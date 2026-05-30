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

function stripArtifacts(text) {
  return (text || '')
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/www\.[^\s]+/g, '')
    .replace(/[{}_\\|<>]{2,}/g, '')
    .split('\n')
    .filter(line => {
      const t = line.trim();
      if (!t) return true;
      const letters = (t.match(/[a-zA-Z؀-ۿ]/g) || []).length;
      return letters / t.length > 0.25;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildContext(sources) {
  return sources
    .map((s, i) => {
      const meta = s.metadata || {};
      const content = stripArtifacts(s.content);
      if (s.source_type === 'quran') {
        const ref = meta.surah_name
          ? `Surah ${meta.surah_name} (${meta.surah_number || '?'}:${meta.ayah_number || '?'})`
          : 'Quran';
        return `[${i + 1}] ${ref}:\n${content}`;
      } else {
        const ref = meta.hadith_number
          ? `${meta.book || 'Hadith'} #${meta.hadith_number}`
          : (meta.book || 'Hadith');
        return `[${i + 1}] ${ref}:\n${content}`;
      }
    })
    .join('\n\n');
}

function parseAnswer(rawAnswer, sources, quranRefs = []) {
  // Build two lookup strategies:
  // 1. By context index (if Claude used the [N] index from the prompt)
  const refByIdx = {};
  for (const r of quranRefs) {
    if (r?.index) refByIdx[r.index] = r;
  }
  // 2. Sequential — assign refs in order to sources that lack DB metadata
  const refsQueue = [...quranRefs];

  const seenContent = new Set();

  const quran_sources = sources
    .filter(s => s.source_type === 'quran')
    .filter(s => {
      // Deduplicate by first 60 chars of content
      const key = s.content.substring(0, 60).trim();
      if (seenContent.has(key)) return false;
      seenContent.add(key);
      return true;
    })
    .map((s, i) => {
      const dbName    = s.metadata?.surah_name   || '';
      const dbChapter = s.metadata?.surah_number || 0;
      const dbVerse   = s.metadata?.ayah_number  || 0;

      // Try index-based lookup (1-based context position = i+1 for quran-only count)
      // Try sequential queue as fallback for unidentified sources
      let ref = refByIdx[i + 1] || null;
      if (!ref && refsQueue.length > 0) ref = refsQueue.shift();

      return {
        surah_name:  dbName    || ref?.surah_name || '',
        chapter:     dbChapter || ref?.chapter    || 0,
        verse:       dbVerse   || ref?.verse      || 0,
        text:        stripArtifacts(s.content),
        arabic_text: s.metadata?.arabic_text || '',
      };
    });

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
      book:   s.metadata?.book          || '',
      number: s.metadata?.hadith_number || 0,
      text:   stripArtifacts(s.content),
    }));

  return { quran_sources, hadith_sources };
}

function detectLanguage(text) {
  const urduPattern = /[؀-ۿݐ-ݿ]/;
  return urduPattern.test(text) ? 'ur' : 'en';
}

function buildPrompt(question, context, detectedLang, responseSize) {
  const langRule = detectedLang === 'ur'
    ? 'The user wrote in Urdu. Respond fully in Urdu.'
    : 'Respond in simple, easy English that a teenager can understand. No difficult words.';

  const persona = `You are "Ilm" — a friendly Islamic guide made for teenagers and young people who have questions about Islam. You speak like a knowledgeable older sibling: warm, clear, never judgmental, and always encouraging. Your job is to answer their questions honestly using the Quran and authentic Hadith, and explain things in a way that connects to real teenage life.`;

  const sizeInstructions = {
    small: `RESPONSE SIZE: SMALL — Give a short, clear answer. 2-4 sentences max. One key Quran verse OR one Hadith as evidence. No long explanations. Get straight to the point. Perfect for a quick answer.`,

    medium: `RESPONSE SIZE: MEDIUM — Give a solid answer with clear evidence. Include:
- A direct 3-5 sentence answer
- 1-2 Quran verses with what they mean in simple words
- 1-2 Hadith with a short explanation
- A brief real-life example or connection teenagers can relate to`,

    large: `RESPONSE SIZE: LARGE — Give a detailed, thorough answer. Include:
- A clear direct answer (4-6 sentences)
- Multiple Quran verses with full explanation of what each one means
- Multiple Hadith with context and explanation
- Tafsir/scholarly explanation from the sources
- A real-life example or scenario teenagers can connect with
- A short encouraging closing message`,
  };

  return `${persona}

${sizeInstructions[responseSize]}

Rules you must always follow:
1. Use ONLY the sources provided below. Never invent information.
2. Always cite your sources: Quran as (Surah Name Chapter:Verse), Hadith as (Book #Number).
3. Write in a friendly, easy-to-understand way. Imagine explaining to a 15-year-old. Avoid religious jargon — if you use an Islamic term, explain what it means.
4. Never be judgmental. Teenagers come with honest questions — treat them with respect.
5. Only say "For a personal fatwa (religious ruling), please ask a qualified scholar" if the question is specifically asking for a legal ruling about a personal situation. For all general knowledge questions, answer fully.
6. ${langRule}
7. Format your answer using these section headers (only include sections relevant to your response size):

[Direct Answer]
[Quranic Evidence]
[Hadith Evidence]
[Explanation & Tafsir]
[Real Life Connection]

8. IMPORTANT — after your answer, you MUST add this block. Identify the exact Surah name, chapter number, and verse number for every Quran source listed below, using your knowledge of the Quran:
<QURAN_REFS>
[{"index":1,"surah_name":"Al-Baqarah","chapter":2,"verse":255},{"index":2,...}]
</QURAN_REFS>
Include ALL Quran sources. If a source covers multiple verses, use the first verse. Use standard English transliterations of Surah names.

Retrieved sources (Quran + Hadith + Tafsir):
${context}

Teenager's question: ${question}`;
}

async function runRAG(question, language, responseSize = 'medium') {
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

  // Build prompt using size-aware teenager persona
  const prompt = buildPrompt(question, context, detectedLang, responseSize);
  const maxTokens = responseSize === 'small' ? 700 : responseSize === 'large' ? 3200 : 1800;

  // Call Claude
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  const rawAnswer = message.content[0].text;

  // Strip the QURAN_REFS block from displayed answer
  const answer = rawAnswer.replace(/<QURAN_REFS>[\s\S]*?<\/QURAN_REFS>/g, '').trim();

  // --- Method 1: parse structured <QURAN_REFS> JSON block ---
  let quranRefs = [];
  const refsMatch = rawAnswer.match(/<QURAN_REFS>([\s\S]*?)<\/QURAN_REFS>/);
  if (refsMatch) {
    try {
      quranRefs = JSON.parse(refsMatch[1].trim());
    } catch {
      // Malformed JSON — try extracting individual objects
      const objRe = /\{[^{}]+\}/g;
      let m;
      while ((m = objRe.exec(refsMatch[1])) !== null) {
        try {
          const o = JSON.parse(m[0]);
          if (o.chapter >= 1 && o.chapter <= 114) quranRefs.push(o);
        } catch {}
      }
    }
  }

  // --- Method 2: parse citations Claude naturally writes in the answer ---
  // e.g. "Surah Al-Baqarah (2:43)" or "Al-Maidah 5:3" — used when block is absent/empty
  if (quranRefs.length === 0) {
    const citRe = /(?:Surah\s+)?([A-Z][A-Za-z'-]+(?:\s+[A-Za-z'-]+){0,2})\s*\(?\s*(\d{1,3})\s*:\s*(\d{1,3})\s*\)?/g;
    const seen = new Set();
    let cm;
    while ((cm = citRe.exec(rawAnswer)) !== null) {
      const chapter = parseInt(cm[2], 10);
      const verse   = parseInt(cm[3], 10);
      const key = `${chapter}:${verse}`;
      if (chapter >= 1 && chapter <= 114 && !seen.has(key)) {
        seen.add(key);
        quranRefs.push({ surah_name: cm[1].trim(), chapter, verse });
      }
    }
  }

  const { quran_sources, hadith_sources } = parseAnswer(answer, sources, quranRefs);

  return {
    answer,
    quran_sources,
    hadith_sources,
    language: detectedLang,
  };
}

module.exports = { runRAG };
