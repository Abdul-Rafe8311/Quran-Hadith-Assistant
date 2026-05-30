// Ingest the COMPLETE Quran (all 6,236 verses) from AlQuran.cloud — clean,
// structured data: Arabic + English (Saheeh International) + exact references.
// This replaces the messy PDF-derived Quran chunks. Hadith stays from PDFs.
//
//   node scripts/ingest_quran.js
//
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const { createClient } = require('@supabase/supabase-js');
const { pipeline } = require('@xenova/transformers');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ARABIC_EDITION = 'quran-uthmani';
const ENGLISH_EDITION = 'en.sahih'; // Saheeh International — clear modern English

let embedder = null;
async function getEmbedder() {
  if (!embedder) {
    console.log('Loading MiniLM model...');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('Model loaded.\n');
  }
  return embedder;
}
async function embed(text) {
  const e = await getEmbedder();
  const out = await e(text, { pooling: 'mean', normalize: true });
  return Array.from(out.data);
}

async function fetchEdition(edition) {
  const res = await fetch(`https://api.alquran.cloud/v1/quran/${edition}`);
  const json = await res.json();
  if (json.status !== 'OK') throw new Error(`API error for ${edition}`);
  return json.data.surahs;
}

async function main() {
  console.log('=== Quran Ingestion (complete, all 6,236 verses) ===\n');

  console.log('Fetching Arabic + English from AlQuran.cloud...');
  const [arSurahs, enSurahs] = await Promise.all([
    fetchEdition(ARABIC_EDITION),
    fetchEdition(ENGLISH_EDITION),
  ]);
  console.log(`Fetched ${enSurahs.length} surahs.\n`);

  await getEmbedder();

  // Remove existing Quran rows (keep hadith untouched)
  console.log('Deleting existing Quran rows...');
  const { error: delErr } = await supabase
    .from('islamic_knowledge')
    .delete()
    .eq('source_type', 'quran');
  if (delErr) console.error('Delete error:', delErr.message);
  else console.log('Old Quran rows deleted.\n');

  let batch = [];
  let total = 0;

  for (let si = 0; si < enSurahs.length; si++) {
    const enSurah = enSurahs[si];
    const arSurah = arSurahs[si];
    const surahName = enSurah.englishName;       // e.g. "Al-Baqara"
    const surahNumber = enSurah.number;          // 1..114

    for (let ai = 0; ai < enSurah.ayahs.length; ai++) {
      const enAyah = enSurah.ayahs[ai];
      const arAyah = arSurah.ayahs[ai];
      const ayahNumber = enAyah.numberInSurah;
      const english = enAyah.text;
      const arabic = arAyah.text;

      // Embed the English translation (what users search in)
      const embedding = await embed(english);

      batch.push({
        content: english,
        embedding,
        source_type: 'quran',
        lang: 'en',
        metadata: {
          book: 'Holy Quran',
          surah_name: surahName,
          surah_number: surahNumber,
          ayah_number: ayahNumber,
          arabic_text: arabic,
          translation: 'Saheeh International',
        },
      });
      total++;

      if (batch.length >= 100) {
        const { error } = await supabase.from('islamic_knowledge').insert(batch);
        if (error) console.error('  Insert error:', error.message);
        batch = [];
        console.log(`  ${total}/6236 verses embedded...`);
      }
    }
  }

  if (batch.length > 0) {
    const { error } = await supabase.from('islamic_knowledge').insert(batch);
    if (error) console.error('  Insert error:', error.message);
  }

  console.log(`\n=== Done: ${total} Quran verses ingested ===`);
}

main().catch(console.error);
