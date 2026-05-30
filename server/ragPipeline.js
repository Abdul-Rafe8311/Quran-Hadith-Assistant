require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
const { pipeline } = require('@xenova/transformers');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
  const seenQuran = new Set();
  const quran_sources = sources
    .filter(s => s.source_type === 'quran')
    .filter(s => {
      const key = `${s.metadata?.surah_number}:${s.metadata?.ayah_number}`;
      if (seenQuran.has(key)) return false;
      seenQuran.add(key);
      return true;
    })
    .map(s => ({
      surah_name: s.metadata?.surah_name || '',
      chapter: s.metadata?.surah_number || 0,
      verse: s.metadata?.ayah_number || 0,
      text: s.content,
      arabic_text: s.metadata?.arabic_text || '',
    }));

  const seenHadith = new Set();
  const hadith_sources = sources
    .filter(s => s.source_type === 'hadith')
    .filter(s => {
      const key = `${s.metadata?.book}#${s.metadata?.hadith_number}`;
      if (seenHadith.has(key)) return false;
      seenHadith.add(key);
      return true;
    })
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
  const sources = await searchKnowledge(queryEmbedding, 10);

  if (sources.length === 0) {
    return {
      answer: 'No matching sources were found in the knowledge base for this question. Please try rephrasing your question.',
      quran_sources: [],
      hadith_sources: [],
      language: detectedLang,
    };
  }

  // Build context
  const context = buildContext(sources);

  // Build prompt
  const prompt = `You are a friendly and knowledgeable Islamic assistant. You have access to Quran verses (with Arabic text and Tafsir/explanation) and authentic Hadith. Answer every question fully and helpfully using the sources below.

Rules:
1. Always give a clear, complete answer based on the sources below. Do not refuse to answer.
2. Write in simple, easy-to-understand English (or Urdu if the user wrote in Urdu). Avoid difficult words. Explain things as if talking to someone who is new to Islam.
3. Cite your sources: Quran as (Surah Name Chapter:Verse), Hadith as (Book Name #Number).
4. Use the Tafsir and context in the sources to give a thorough explanation — not just a one-line answer.
5. Never make up information. Stick to what the sources say.
6. ONLY add "Note: For a personal fatwa or religious ruling, please consult a qualified scholar (Mufti)." if the user is explicitly asking for a legal fatwa about their personal situation. Do NOT add this note for general knowledge questions.
7. Structure every answer like this:

[Direct Answer]
A clear 2-3 sentence answer to the question in simple words.

[Quranic Evidence]
Quote and explain each relevant Quran verse. Include what it means in simple terms.

[Hadith Evidence]
Quote and explain each relevant Hadith in simple words.

[Explanation & Tafsir]
Use the Tafsir/commentary from the sources to explain the topic more deeply in easy language.

Retrieved sources (Quran + Hadith + Tafsir):
${context}

User question: ${question}`;

  // Call Claude
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });
  const answer = message.content[0].text;

  const { quran_sources, hadith_sources } = parseAnswer(answer, sources);

  return {
    answer,
    quran_sources,
    hadith_sources,
    language: detectedLang,
  };
}

module.exports = { runRAG };
