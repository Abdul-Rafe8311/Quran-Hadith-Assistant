require('dotenv').config();
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

const BOOK_MAP = [
  // Urdu variants must come before generic English matches
  { pattern: /bukhari.*urdu|urdu.*bukhari|sahi[\s-]+bukhari[\s-]+urdu|jild/i,
                            book: 'Sahih Bukhari (Urdu)',  source_type: 'hadith', lang: 'ur' },
  { pattern: /bukhari/i,    book: 'Sahih Bukhari',         source_type: 'hadith', lang: 'en' },
  { pattern: /muslim.*urdu|urdu.*muslim/i,
                            book: 'Sahih Muslim (Urdu)',   source_type: 'hadith', lang: 'ur' },
  { pattern: /muslim/i,     book: 'Sahih Muslim',          source_type: 'hadith', lang: 'en' },
  { pattern: /tirmidhi/i,   book: 'Jami at-Tirmidhi',     source_type: 'hadith', lang: 'en' },
  { pattern: /abu[\s_-]?dawood/i, book: 'Sunan Abu Dawood', source_type: 'hadith', lang: 'en' },
  { pattern: /nasai/i,      book: "Sunan an-Nasa'i",       source_type: 'hadith', lang: 'en' },
  { pattern: /ibn[\s_-]?majah/i, book: 'Sunan Ibn Majah', source_type: 'hadith', lang: 'en' },
  { pattern: /quran.*urdu|urdu.*quran|quran-pdf.*urdu/i,
                            book: 'Quran (Urdu)',           source_type: 'quran',  lang: 'ur' },
  { pattern: /quran|english.*quran|quran.*english|quran.*translation/i,
                            book: 'Quran (English)',        source_type: 'quran',  lang: 'en' },
];

const HADITH_NUMBER_PATTERNS = [
  /hadith[:\s#]+(\d+)/i,
  /no\.[:\s]+(\d+)/i,
  /^\s*(\d+)\./m,
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
  const embed = await getEmbedder();
  const output = await embed(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

async function upsertBatch(records) {
  const { error } = await supabase.from('islamic_knowledge').upsert(records, {
    onConflict: 'id',
  });
  if (error) console.error('  Upsert error:', error.message);
}

function detectBookMeta(filename) {
  const base = path.basename(filename).toLowerCase();
  for (const entry of BOOK_MAP) {
    if (entry.pattern.test(base)) {
      return { book: entry.book, source_type: entry.source_type, lang: entry.lang };
    }
  }
  return { book: path.basename(filename, '.pdf'), source_type: 'hadith', lang: 'en' };
}

function extractHadithNumber(text) {
  for (const pattern of HADITH_NUMBER_PATTERNS) {
    const match = text.match(pattern);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

async function processPDF(filePath) {
  const filename = path.basename(filePath);
  console.log(`Processing: ${filename}`);

  const rawBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(rawBuffer);
  const rawText = pdfData.text;
  console.log(`  Extracted ${rawText.length.toLocaleString()} characters`);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 400,
    chunkOverlap: 80,
    separators: ['\n\n', '\n', '۔', '. ', ' '],
  });

  const chunks = await splitter.splitText(rawText);
  console.log(`  Split into ${chunks.length} chunks`);

  const meta = detectBookMeta(filename);
  let batch = [];
  let ingested = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i].trim();
    if (chunk.length < 20) continue;

    const hadithNumber = meta.source_type === 'hadith' ? extractHadithNumber(chunk) : null;
    const embedding = await embed(chunk);

    batch.push({
      content: chunk,
      embedding,
      source_type: meta.source_type,
      lang: meta.lang,
      metadata: {
        book: meta.book,
        hadith_number: hadithNumber,
        filename,
        chunk_index: i,
      },
    });

    ingested++;

    if (batch.length >= 50) {
      await upsertBatch(batch);
      batch = [];
    }

    if (ingested % 100 === 0) {
      console.log(`  ${ingested}/${chunks.length} chunks embedded...`);
    }
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
  console.log('=== Islamic Knowledge PDF Ingestion ===\n');

  const quranPDFs = getPDFFiles(QURAN_DIR);
  const hadithPDFs = getPDFFiles(HADITH_DIR);
  const allPDFs = [...quranPDFs, ...hadithPDFs];

  if (allPDFs.length === 0) {
    console.log('No PDF files found.');
    console.log(`  Place Quran PDFs in:  ${QURAN_DIR}`);
    console.log(`  Place Hadith PDFs in: ${HADITH_DIR}`);
    console.log('\nNaming convention:');
    console.log('  Quran English  → quran.pdf or quran_english.pdf');
    console.log('  Quran Urdu     → quran_urdu.pdf');
    console.log('  Sahih Bukhari  → bukhari.pdf or sahih_bukhari.pdf');
    console.log('  Sahih Muslim   → muslim.pdf or sahih_muslim.pdf');
    console.log('  Tirmidhi       → tirmidhi.pdf');
    console.log('  Abu Dawood     → abu_dawood.pdf');
    console.log("  Nasa'i         → nasai.pdf");
    console.log('  Ibn Majah      → ibn_majah.pdf');
    return;
  }

  console.log(`Found ${allPDFs.length} PDF file(s):\n`);
  allPDFs.forEach(f => console.log(`  - ${path.basename(f)}`));
  console.log('');

  // Load embedder once upfront
  await getEmbedder();

  let totalChunks = 0;
  for (const filePath of allPDFs) {
    try {
      totalChunks += await processPDF(filePath);
    } catch (err) {
      console.error(`  ✗ Failed: ${path.basename(filePath)} — ${err.message}\n`);
    }
  }

  console.log('=== Ingestion Complete ===');
  console.log(`All PDFs ingested! Total chunks: ${totalChunks}`);
}

main().catch(console.error);
