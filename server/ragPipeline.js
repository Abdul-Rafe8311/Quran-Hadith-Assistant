require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pipeline } = require('@xenova/transformers');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let embedder = null;

async function getEmbedder() {
  if (!embedder) {
    console.log('Loading embedding model...');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('Embedding model loaded.');
  }
  return embedder;
}

async function embedText(text) {
  const embed = await getEmbedder();
  const output = await embed(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

async function searchKnowledge(queryEmbedding, limit = 8) {
  const { data, error } = await supabase.rpc('match_islamic_knowledge', {
    query_embedding: queryEmbedding,
    match_count: limit,
  });
  if (error) {
    console.error('Supabase RPC error:', error);
    const { data: fallback, error: fbErr } = await supabase
      .from('islamic_knowledge')
      .select('content, source_type, metadata, lang')
      .limit(limit);
    if (fbErr) throw fbErr;
    return fallback || [];
  }
  return data || [];
}

function buildContext(sources) {
  return sources
    .map((s, i) => {
      const meta = s.metadata || {};
      if (s.source_type === 'quran') {
        return `[${i + 1}] Quran - Surah ${meta.surah_name || ''} (${meta.surah_number || ''}:${meta.ayah_number || ''}): ${s.content}`;
      } else {
        return `[${i + 1}] ${meta.book || 'Hadith'} #${meta.hadith_number || ''}: ${s.content}`;
      }
    })
    .join('\n\n');
}

function parseAnswer(rawAnswer, sources) {
  const quran_sources = sources
    .filter(s => s.source_type === 'quran')
    .map(s => ({
      surah_name: s.metadata?.surah_name || '',
      chapter: s.metadata?.surah_number || 0,
      verse: s.metadata?.ayah_number || 0,
      text: s.content,
      arabic_text: s.metadata?.arabic_text || '',
    }));

  const hadith_sources = sources
    .filter(s => s.source_type === 'hadith')
    .map(s => ({
      book: s.metadata?.book || '',
      number: s.metadata?.hadith_number || 0,
      text: s.content,
    }));

  return { quran_sources, hadith_sources };
}

function detectLanguage(text) {
  const urduPattern = /[؀-ۿݐ-ݿ]/;
  return urduPattern.test(text) ? 'ur' : 'en';
}

async function runRAG(question, language) {
  const detectedLang = language || detectLanguage(question);

  // Embed question
  const queryEmbedding = await embedText(question);

  // Search knowledge base
  const sources = await searchKnowledge(queryEmbedding, 5);

  if (sources.length === 0) {
    return {
      answer: 'This requires deeper scholarly analysis. Please consult a qualified Islamic scholar for a proper ruling.',
      quran_sources: [],
      hadith_sources: [],
      language: detectedLang,
    };
  }

  // Build context
  const context = buildContext(sources);

  // Build prompt
  const prompt = `You are a trusted Islamic knowledge assistant. Answer ONLY using the retrieved Quran verses and Hadith provided below.

Strict rules you must never break:
1. Use ONLY the sources listed below. Never add outside knowledge.
2. Cite every claim: Quran as (Surah Name Chapter:Verse), Hadith as (Book Name #Number).
3. If the sources are not enough to answer, say exactly: 'This requires deeper scholarly analysis. Please consult a qualified Islamic scholar for a proper ruling.'
4. Never give personal opinion. Never speculate. Never fabricate.
5. Structure every answer exactly like this:

   [Direct Answer]
   2-3 sentences directly answering the question.

   [Quranic Evidence]
   List each retrieved Quran verse with full citation.

   [Hadith Evidence]
   List each retrieved Hadith with full citation.

   [Context & Tafsir]
   Brief scholarly context and explanation.

6. If user wrote in Urdu, respond fully in Urdu. If user wrote in English, respond fully in English.

Retrieved sources:
${context}

User question: ${question}`;

  // Call Gemini
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  const answer = result.response.text();

  const { quran_sources, hadith_sources } = parseAnswer(answer, sources);

  return {
    answer,
    quran_sources,
    hadith_sources,
    language: detectedLang,
  };
}

module.exports = { runRAG };
