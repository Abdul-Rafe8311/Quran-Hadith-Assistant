require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { pipeline } = require('@xenova/transformers');
const pdfParse = require('pdf-parse');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const QURAN_DIR = path.join(__dirname, 'pdfs', 'quran');
const HADITH_DIR = path.join(__dirname, 'pdfs', 'hadith');

// Skip Urdu/Arabic-script PDFs — pdf-parse can't extract them, they become garbage.
// Set INGEST_URDU=1 to include them anyway.
const SKIP_URDU = process.env.INGEST_URDU !== '1';

const BOOK_MAP = [
  { pattern: /bukhari.*urdu|urdu.*bukhari|sahi[\s-]+bukhari[\s-]+urdu|jild/i,
                            book: 'Sahih Bukhari (Urdu)',  source_type: 'hadith', lang: 'ur' },
  { pattern: /bukhari/i,    book: 'Sahih Bukhari',         source_type: 'hadith', lang: 'en' },
  { pattern: /muslim.*urdu|urdu.*muslim/i,
                            book: 'Sahih Muslim (Urdu)',   source_type: 'hadith', lang: 'ur' },
  { pattern: /muslim/i,     book: 'Sahih Muslim',          source_type: 'hadith', lang: 'en' },
  { pattern: /tirmidhi/i,   book: 'Jami at-Tirmidhi',      source_type: 'hadith', lang: 'en' },
  { pattern: /abu[\s_-]?dawood/i, book: 'Sunan Abu Dawood', source_type: 'hadith', lang: 'en' },
  { pattern: /nasai/i,      book: "Sunan an-Nasa'i",       source_type: 'hadith', lang: 'en' },
  { pattern: /ibn[\s_-]?majah/i, book: 'Sunan Ibn Majah',  source_type: 'hadith', lang: 'en' },
  { pattern: /quran.*urdu|urdu.*quran|quran-pdf.*urdu/i,
                            book: 'Quran (Urdu)',           source_type: 'quran',  lang: 'ur' },
  { pattern: /quran|english.*quran|quran.*english|quran.*translation/i,
                            book: 'Quran (English)',        source_type: 'quran',  lang: 'en' },
];

const SURAH_NAMES = [
  'Al-Fatihah','Al-Baqarah','Al-Imran','An-Nisa','Al-Maidah','Al-Anam','Al-Araf',
  'Al-Anfal','At-Tawbah','Yunus','Hud','Yusuf','Ar-Rad','Ibrahim','Al-Hijr',
  'An-Nahl','Al-Isra','Al-Kahf','Maryam','Ta-Ha','Al-Anbiya','Al-Hajj','Al-Muminun',
  'An-Nur','Al-Furqan','Ash-Shuara','An-Naml','Al-Qasas','Al-Ankabut','Ar-Rum',
  'Luqman','As-Sajdah','Al-Ahzab','Saba','Fatir','Ya-Sin','As-Saffat','Sad',
  'Az-Zumar','Ghafir','Fussilat','Ash-Shura','Az-Zukhruf','Ad-Dukhan','Al-Jathiyah',
  'Al-Ahqaf','Muhammad','Al-Fath','Al-Hujurat','Qaf','Adh-Dhariyat','At-Tur',
  'An-Najm','Al-Qamar','Ar-Rahman','Al-Waqiah','Al-Hadid','Al-Mujadila','Al-Hashr',
  'Al-Mumtahanah','As-Saf','Al-Jumuah','Al-Munafiqun','At-Taghabun','At-Talaq',
  'At-Tahrim','Al-Mulk','Al-Qalam','Al-Haqqah','Al-Maarij','Nuh','Al-Jinn',
  'Al-Muzzammil','Al-Muddaththir','Al-Qiyamah','Al-Insan','Al-Mursalat','An-Naba',
  'An-Naziat','Abasa','At-Takwir','Al-Infitar','Al-Mutaffifin','Al-Inshiqaq',
  'Al-Buruj','At-Tariq','Al-Ala','Al-Ghashiyah','Al-Fajr','Al-Balad','Ash-Shams',
  'Al-Layl','Ad-Duha','Ash-Sharh','At-Tin','Al-Alaq','Al-Qadr','Al-Bayyinah',
  'Az-Zalzalah','Al-Adiyat','Al-Qariah','At-Takathur','Al-Asr','Al-Humazah',
  'Al-Fil','Quraysh','Al-Maun','Al-Kawthar','Al-Kafirun','An-Nasr','Al-Masad',
  'Al-Ikhlas','Al-Falaq','An-Nas',
];

let embedder = null;

async function getEmbedder() {
  if (!embedder) {
    console.log('Loading MiniLM model (~25MB, cached after first run)...');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('Model loaded.\n');
  }
  return embedder;
}

async function embed(text) {
  const e = await getEmbedder();
  const output = await e(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

// ── TEXT CLEANING ────────────────────────────────────────────────────────────

const VOWELS = /[aeiouAEIOU]/;

/** Is a single token OCR/transliteration garbage? (e.g. "JI", "0tv", "yRto") */
function isGarbageWord(w) {
  const clean = w.replace(/[^A-Za-z0-9]/g, '');
  if (!clean) return true;
  if (/\d/.test(clean) && /[A-Za-z]/.test(clean)) return true; // mixed digits+letters
  if (clean.length >= 3 && !VOWELS.test(clean)) return true;    // no vowel = junk
  // weird internal capitalisation like "yRto", "AAr"
  if (clean.length >= 3 && /[a-z][A-Z]/.test(clean) && !/^[A-Z][a-z]+$/.test(clean)) return true;
  return false;
}

/** Drop a line if it is mostly garbage tokens */
function isGarbageLine(line) {
  const words = line.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const garbage = words.filter(isGarbageWord).length;
  return garbage / words.length > 0.4;
}

/** Clean raw English PDF text: strip non-ASCII (Arabic junk), URLs, noise */
function cleanEnglish(text) {
  let t = text
    .replace(/\r/g, '\n')
    .replace(/https?:\/\/\S+/g, '')        // URLs
    .replace(/www\.\S+/g, '')
    .replace(/[^\x20-\x7E\n]/g, ' ')       // strip non-ASCII (Arabic rendered as junk)
    .replace(/[_]{2,}/g, ' ')              // TOC dotted/underscore lines
    .replace(/[-]{3,}/g, ' ')              // dividers
    .replace(/[•◆▪·¶§]/g, ' ')
    .replace(/[ \t]+/g, ' ');

  // Line-level garbage filter
  t = t
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !isGarbageLine(l))
    .join('\n');

  return t.replace(/\n{2,}/g, '\n').trim();
}

/** Final per-chunk tidy: join broken lines into flowing sentences */
function finalizeChunk(text) {
  return text
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}

// ── METADATA EXTRACTION ──────────────────────────────────────────────────────

function extractQuranMeta(text) {
  const patterns = [
    /\((\d{1,3})[:\s](\d{1,3})\)/,
    /\b(\d{1,3}):(\d{1,3})\b/,
    /chapter\s+(\d{1,3})[,\s]+verse\s+(\d{1,3})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const s = parseInt(m[1], 10), v = parseInt(m[2], 10);
      if (s >= 1 && s <= 114 && v >= 1 && v <= 286) {
        return { surah_number: s, ayah_number: v, surah_name: SURAH_NAMES[s - 1] || '' };
      }
    }
  }
  return {};
}

// ── HADITH CHUNKING (by numbered "Narrated" boundaries) ──────────────────────

function chunkHadith(cleanText) {
  const chunks = [];
  // Split on a hadith boundary: "<number>. Narrated"
  const re = /(\d{1,5})\.\s*Narrated/g;
  const indices = [];
  let m;
  while ((m = re.exec(cleanText)) !== null) {
    indices.push({ pos: m.index, num: parseInt(m[1], 10) });
  }

  if (indices.length === 0) {
    // No numbered narrations found — fall back to size-based splitting
    return null;
  }

  for (let i = 0; i < indices.length; i++) {
    const start = indices[i].pos;
    const end = i + 1 < indices.length ? indices[i + 1].pos : cleanText.length;
    const body = finalizeChunk(cleanText.substring(start, end));
    if (body.length >= 40) {
      chunks.push({ text: body, hadith_number: indices[i].num });
    }
  }
  return chunks;
}

// ── PDF PROCESSING ───────────────────────────────────────────────────────────

function detectBookMeta(filename) {
  const base = path.basename(filename).toLowerCase();
  for (const entry of BOOK_MAP) {
    if (entry.pattern.test(base)) {
      return { book: entry.book, source_type: entry.source_type, lang: entry.lang };
    }
  }
  return { book: path.basename(filename, '.pdf'), source_type: 'hadith', lang: 'en' };
}

async function upsertBatch(records) {
  const { error } = await supabase.from('islamic_knowledge').insert(records);
  if (error) console.error('  Insert error:', error.message);
}

async function processPDF(filePath) {
  const filename = path.basename(filePath);
  const meta = detectBookMeta(filename);

  if (SKIP_URDU && meta.lang === 'ur') {
    console.log(`Skipping (Urdu, extracts as garbage): ${filename}\n`);
    return 0;
  }

  console.log(`Processing: ${filename}  [${meta.book}]`);

  const pdfData = await pdfParse(fs.readFileSync(filePath));
  const cleaned = cleanEnglish(pdfData.text);
  console.log(`  Cleaned text: ${cleaned.length.toLocaleString()} chars (from ${pdfData.text.length.toLocaleString()})`);

  // Build chunks
  let items = [];
  if (meta.source_type === 'hadith') {
    const hadithChunks = chunkHadith(cleaned);
    if (hadithChunks) {
      items = hadithChunks;
      console.log(`  Split into ${items.length} hadiths (by narration)`);
    }
  }
  if (items.length === 0) {
    // Quran, or hadith with no numbered narrations: size-based split
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500, chunkOverlap: 60, separators: ['\n', '. ', ' '],
    });
    const parts = await splitter.splitText(cleaned);
    items = parts.map(p => ({ text: finalizeChunk(p), hadith_number: null }));
    console.log(`  Split into ${items.length} chunks (by size)`);
  }

  let batch = [];
  let ingested = 0;

  for (let i = 0; i < items.length; i++) {
    const text = items[i].text;
    if (!text || text.length < 40) continue;

    const metadata = { book: meta.book, filename, chunk_index: i };
    if (meta.source_type === 'hadith') {
      metadata.hadith_number = items[i].hadith_number;
    } else {
      Object.assign(metadata, extractQuranMeta(text));
    }

    const embedding = await embed(text);
    batch.push({ content: text, embedding, source_type: meta.source_type, lang: meta.lang, metadata });
    ingested++;

    if (batch.length >= 50) { await upsertBatch(batch); batch = []; }
    if (ingested % 200 === 0) console.log(`  ${ingested}/${items.length} embedded...`);
  }

  if (batch.length > 0) await upsertBatch(batch);
  console.log(`  ✓ Done: ${filename} (${ingested} chunks)\n`);
  return ingested;
}

function getPDFFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .map(f => path.join(dir, f));
}

async function main() {
  console.log('=== Islamic Knowledge PDF Ingestion (v2 — clean) ===\n');

  if (process.argv.includes('--clear')) {
    console.log('Clearing existing islamic_knowledge rows...');
    const { error } = await supabase.from('islamic_knowledge').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) console.error('Clear error:', error.message);
    else console.log('Cleared.\n');
  }

  const allPDFs = [...getPDFFiles(QURAN_DIR), ...getPDFFiles(HADITH_DIR)];
  if (allPDFs.length === 0) {
    console.log('No PDF files found in scripts/pdfs/{quran,hadith}/.');
    return;
  }

  console.log(`Found ${allPDFs.length} PDF file(s). Urdu files ${SKIP_URDU ? 'WILL be skipped' : 'will be included'}.\n`);
  await getEmbedder();

  let total = 0;
  for (const filePath of allPDFs) {
    try { total += await processPDF(filePath); }
    catch (err) { console.error(`  ✗ Failed: ${path.basename(filePath)} — ${err.message}\n`); }
  }

  console.log('=== Ingestion Complete ===');
  console.log(`Total chunks ingested: ${total}`);
}

main().catch(console.error);
