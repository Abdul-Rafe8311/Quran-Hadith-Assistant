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

// Map common transliterated Islamic terms to the English words that actually
// appear in Quran/Hadith translations — dramatically improves search matching.
const TERM_GLOSSARY = {
  tawakkul: 'trust and complete reliance upon Allah',
  tawakul: 'trust and complete reliance upon Allah',
  sabr: 'patience perseverance steadfastness in hardship',
  shukr: 'gratitude thankfulness being thankful to Allah',
  taqwa: 'God-consciousness piety fear of Allah righteousness',
  ikhlas: 'sincerity pure intention worshipping Allah alone',
  tawbah: 'repentance turning back to Allah seeking forgiveness',
  tawba: 'repentance turning back to Allah seeking forgiveness',
  rizq: 'provision sustenance livelihood from Allah',
  zakat: 'obligatory charity giving alms to the poor',
  sadaqah: 'voluntary charity giving to those in need',
  salah: 'prayer ritual worship five daily prayers',
  salat: 'prayer ritual worship five daily prayers',
  sawm: 'fasting abstaining during Ramadan',
  hajj: 'pilgrimage to Makkah',
  jihad: 'striving struggle in the way of Allah',
  iman: 'faith belief in Allah',
  ihsan: 'excellence perfection worshipping Allah as if seeing Him',
  rahmah: 'mercy compassion kindness',
  adl: 'justice fairness being just',
  ilm: 'knowledge seeking learning',
  dua: 'supplication calling upon Allah prayer',
  dhikr: 'remembrance of Allah glorifying mentioning Allah',
  nikah: 'marriage wedding marital contract',
  halal: 'lawful permitted allowed',
  haram: 'forbidden prohibited unlawful',
  akhlaq: 'good character manners morals behaviour',
  ummah: 'community of believers Muslim nation',
  jannah: 'paradise heaven garden reward',
  jahannam: 'hellfire punishment',
  akhirah: 'hereafter afterlife day of judgement',
};

function expandQuery(question) {
  const lower = question.toLowerCase();
  const additions = [];
  for (const [term, meaning] of Object.entries(TERM_GLOSSARY)) {
    // match whole word (handles "tawakkul", "tawakul", plurals loosely)
    if (new RegExp(`\\b${term}\\b`, 'i').test(lower)) {
      additions.push(meaning);
    }
  }
  return additions.length ? `${question}. ${additions.join('. ')}` : question;
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
  if (!text) return '';

  return text
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/www\.[^\s]+/g, '')
    .replace(/[¶§†‡•·◆▪]/g, '')           // OCR special symbols
    .replace(/[{}_\\|<>]{2,}/g, ' ')
    .replace(/\f/g, '\n')
    .split('\n')
    .map(line => {
      const t = line.trim();
      if (!t) return '';

      // If the line has a readable "Narrated ..." segment, rescue it from garbage prefix
      const narratedIdx = t.indexOf('Narrated ');
      if (narratedIdx > 10) return t.substring(narratedIdx);

      const words = t.split(/\s+/);
      const letters = (t.match(/[a-zA-Z؀-ۿ]/g) || []).length;

      // Basic letter-ratio gate
      if (letters / t.length < 0.3) return '';

      // More than 60% of words are ≤2 letters → OCR garbage line
      const shortWords = words.filter(w => w.replace(/[^a-zA-Z]/g, '').length <= 2);
      if (words.length >= 5 && shortWords.length / words.length > 0.6) return '';

      // Many isolated uppercase letters in a short line → garbled transliteration
      const isolatedCaps = (t.match(/\b[A-Z]{1,2}\b/g) || []).length;
      if (isolatedCaps >= 4 && t.length < 90) return '';

      return t;
    })
    .filter(l => l !== '')
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

function parseAnswer(rawAnswer, sources, explByIdx = {}) {
  // Tag every source with its 1-based context index (matches buildContext order)
  // BEFORE filtering, so Claude's per-source explanations line up.
  const tagged = sources.map((s, i) => ({ ...s, _ctxIdx: i + 1 }));

  const seenContent = new Set();

  const quran_sources = tagged
    .filter(s => s.source_type === 'quran')
    .filter(s => {
      const key = s.content.substring(0, 60).trim();
      if (seenContent.has(key)) return false;
      seenContent.add(key);
      return true;
    })
    .map(s => ({
      surah_name:  s.metadata?.surah_name   || '',
      chapter:     s.metadata?.surah_number || 0,
      verse:       s.metadata?.ayah_number  || 0,
      text:        stripArtifacts(s.content),
      arabic_text: s.metadata?.arabic_text || '',
      explanation: explByIdx[s._ctxIdx] || '',
    }));

  const seenHadith = new Set();
  const hadith_sources = tagged
    .filter(s => s.source_type === 'hadith')
    .filter(s => {
      // Dedup by hadith number when present, otherwise by content —
      // (numberless hadiths must NOT all collapse into one).
      const num = s.metadata?.hadith_number;
      const key = num
        ? `${s.metadata?.book}#${num}`
        : `c:${(s.content || '').substring(0, 60).trim()}`;
      if (seenHadith.has(key)) return false;
      seenHadith.add(key);
      return true;
    })
    .map(s => ({
      book:        s.metadata?.book          || '',
      number:      s.metadata?.hadith_number || 0,
      text:        stripArtifacts(s.content),
      explanation: explByIdx[s._ctxIdx] || '',
    }));

  return { quran_sources, hadith_sources };
}

function detectLanguage(text) {
  const urduPattern = /[؀-ۿݐ-ݿ]/;
  return urduPattern.test(text) ? 'ur' : 'en';
}

function buildPrompt(question, context, detectedLang, responseSize) {
  // English-only responses (even if the question is in another language)
  const langRule = 'ALWAYS respond in simple, easy English that a teenager can understand. No difficult words. Even if the question is written in Urdu or another language, your answer must be in English.';

  const persona = `You are "Ilm" — a friendly Islamic guide made for teenagers and young people who have questions about Islam. You speak like a knowledgeable older sibling: warm, clear, never judgmental, and always encouraging. Your job is to answer their questions honestly using the Quran and authentic Hadith, and explain things in a way that connects to real teenage life.`;

  const sizeInstructions = {
    small: `RESPONSE SIZE: SMALL — One source only (the single most relevant Quran verse OR Hadith), with 2-3 short commentary bullets. Keep it brief.`,

    medium: `RESPONSE SIZE: MEDIUM — One Quran verse and (if genuinely relevant) one Hadith, each with 3-4 simple commentary bullets.`,

    large: `RESPONSE SIZE: LARGE — One or two Quran verses and one or two relevant Hadith, each followed by 4-5 commentary bullets. You may add a short real-life connection for teenagers.`,
  };

  return `${persona}

${sizeInstructions[responseSize]}

Rules you must always follow:

SOURCE RELEVANCE (most important — check this FIRST):
1. Identify the real SUBJECT of the question, not just its keywords. Example: "Is listening to music haram?" → the subject is "the Islamic ruling on music," NOT "listening/hearing" in general.
2. Before using any retrieved source, ask: does it actually address that subject? A Hadith or verse that merely shares a word (e.g. "listen", "hear") but discusses an unrelated topic is IRRELEVANT — discard it and DO NOT cite it. Never include a source just because a word overlaps.
3. If NONE of the retrieved sources are genuinely relevant to the subject, be honest: give the correct general scholarly explanation from your own reliable knowledge of famous Quran verses and authentic Hadith, and clearly tell the student that the provided sources did not contain a directly relevant text — rather than forcing an unrelated one in. Still give a real, useful answer; never just refuse.
4. For each source you DO use, briefly note (in plain words) why it is relevant to the subject.
5. When a topic is contested among scholars (e.g. music, pictures, etc.), present the differing positions fairly rather than asserting one ruling as the final word.
6. You MAY add famous, widely-documented Quran verses and authentic Hadith you are confident are correct, but NEVER fabricate a verse, wording, or citation. If unsure of an exact reference, describe the teaching without inventing a fake citation.

STYLE & FORMAT:
7. Always cite: Quran as (Surah Name Chapter:Verse), Hadith as (Book #Number). Only give a citation you are confident is accurate.
8. Write in simple, plain English. Short sentences. Everyday words. No jargon — if you must use an Islamic term, immediately explain what it means in brackets.
9. When quoting a Hadith, FIRST give the full clean English text of what the Prophet ﷺ said or did, THEN explain what it means in 1-2 sentences. Never show garbled or partial text.
10. When quoting a Quran verse, quote it cleanly then explain what it means in simple words.
11. Never be judgmental. Teenagers come with honest questions — treat them with respect.
12. Only say "For a personal fatwa (religious ruling), please ask a qualified scholar" if the question is specifically asking for a legal ruling about a personal situation. For all general knowledge questions, answer fully.
13. ${langRule}
14. Format your answer EXACTLY like the template below. Use the section headers in square brackets on their own line. For each evidence: put the reference on its own line, then the Arabic on its own line (Quran only), then the clean English translation in "quotes" on its own line. Then a [Commentary] section with simple bullet points (each starting with "- "). Finally end with ONE short, warm follow-up question on its own line inviting them to explore more.

TEMPLATE (include [The Hadith says] only when you have a genuinely relevant, clean Hadith; omit it otherwise):

[The Quran says]
Surah <Name> (<chapter>:<verse>)
<Arabic verse text>
"<clean English translation>"

[Commentary]
- <simple point in plain words>
- <another simple point>
- <another simple point>

[The Hadith says]
<Book Name> #<Number>
"<clean English hadith text>"

[Commentary]
- <simple point>
- <another simple point>

<One short friendly follow-up question, e.g. "Would you like to explore how worship is practiced in Islam?">

Do NOT use any other section headers (no [Direct Answer], no [Explanation & Tafsir]). Keep bullets short and easy.

15. IMPORTANT — after your answer, you MUST add this exact block. Give a short, simple-English "explanation" (1-2 easy sentences a teenager can understand) for EVERY numbered source listed under "Retrieved sources" below — both Quran verses AND Hadith, whether or not you used them in your answer. Key each explanation by its source number [i]. Explain in plain words what that verse or hadith means.
<NOTES>
[{"i":1,"explanation":"This verse reminds us that Allah is always watching over everything and never gets tired."},{"i":2,"explanation":"This hadith teaches that a person's deeds are judged by their intention."}]
</NOTES>
Include an entry for every numbered source. Keep each explanation simple and warm.

Retrieved sources (Quran + Hadith + Tafsir):
${context}

Teenager's question: ${question}`;
}

async function runRAG(question, language, responseSize = 'medium') {
  const detectedLang = language || detectLanguage(question);

  // Expand Islamic terms (tawakkul → "trust reliance upon Allah") so the
  // semantic search matches the English translations actually stored.
  const expandedQuery = expandQuery(question);
  const queryEmbedding = await embedText(expandedQuery);

  // Search knowledge base — retrieve more candidates for better coverage
  const sources = await searchKnowledge(queryEmbedding, 16);

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
  // Higher limits because NOTES explains every retrieved source
  const maxTokens = responseSize === 'small' ? 1500 : responseSize === 'large' ? 4096 : 3000;

  // Call Claude
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  const rawAnswer = message.content[0].text;

  // Strip the NOTES block from the displayed answer
  const answer = rawAnswer.replace(/<NOTES>[\s\S]*?<\/NOTES>/g, '').trim();

  // Parse <NOTES> — a simple-words explanation for every numbered source [i]
  const explByIdx = {};
  const notesMatch = rawAnswer.match(/<NOTES>([\s\S]*?)<\/NOTES>/);
  if (notesMatch) {
    let notes = [];
    try {
      notes = JSON.parse(notesMatch[1].trim());
    } catch {
      const objRe = /\{[^{}]+\}/g;
      let m;
      while ((m = objRe.exec(notesMatch[1])) !== null) {
        try { notes.push(JSON.parse(m[0])); } catch {}
      }
    }
    for (const n of notes) {
      const i = n.i ?? n.index;
      if (i && n.explanation) explByIdx[i] = String(n.explanation);
    }
  }

  const { quran_sources, hadith_sources } = parseAnswer(answer, sources, explByIdx);

  return {
    answer,
    quran_sources,
    hadith_sources,
    language: detectedLang,
  };
}

module.exports = { runRAG };
