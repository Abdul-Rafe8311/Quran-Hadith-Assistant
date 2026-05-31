'use client';
import { useState } from 'react';
import { supabase, QuranSource, HadithSource } from '../lib/supabase';

interface Props {
  question: string;
  answer: string;
  quranSources: QuranSource[];
  hadithSources: HadithSource[];
}

function containsArabic(text: string) {
  return /[؀-ۿ]/.test(text);
}

/** Remove PDF OCR garbage — URLs, garbled lines, isolated-cap fragments */
function cleanText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/www\.[^\s]+/g, '')
    .replace(/[¶§†‡•·◆▪]/g, '')
    .replace(/[{}_\\|<>]{2,}/g, ' ')
    .split('\n')
    .map(line => {
      const t = line.trim();
      if (!t) return '';

      // Rescue "Narrated ..." from a garbage-prefixed line
      const narratedIdx = t.indexOf('Narrated ');
      if (narratedIdx > 10) return t.substring(narratedIdx);

      const words = t.split(/\s+/);
      const letters = (t.match(/[a-zA-Z؀-ۿ]/g) || []).length;

      if (letters / t.length < 0.3) return '';

      // >60% of words are ≤2 letters → OCR garbage
      const shortWords = words.filter(w => w.replace(/[^a-zA-Z]/g, '').length <= 2);
      if (words.length >= 5 && shortWords.length / words.length > 0.6) return '';

      // Many isolated caps in a short line → garbled transliteration
      const isolatedCaps = (t.match(/\b[A-Z]{1,2}\b/g) || []).length;
      if (isolatedCaps >= 4 && t.length < 90) return '';

      return t;
    })
    .filter(l => l !== '')
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Render the answer body in the "The Quran says → Commentary → follow-up" style */
function renderAnswerBody(answer: string, showArabic: boolean) {
  const lines = answer.split('\n').map(l => l.trim());
  const out: React.ReactNode[] = [];
  let bullets: string[] = [];
  let k = 0;

  const flush = () => {
    if (!bullets.length) return;
    const items = bullets;
    bullets = [];
    out.push(
      <ul key={`ul${k++}`} className="space-y-2 my-2.5">
        {items.map((b, j) => (
          <li key={j} className="flex gap-2.5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#c9a84c] shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) { flush(); continue; }

    // Section heading [The Quran says] / [Commentary] / ...
    if (line.startsWith('[') && line.endsWith(']')) {
      flush();
      out.push(
        <h3 key={`h${k++}`} className="text-base font-bold text-[#0d3d25] dark:text-gray-100 mt-5 first:mt-0 mb-2">
          {line.slice(1, -1)}
        </h3>
      );
      continue;
    }

    // Bullet point
    if (/^[-•*]\s+/.test(line)) {
      bullets.push(line.replace(/^[-•*]\s+/, ''));
      continue;
    }

    // Arabic verse line
    if (containsArabic(line)) {
      flush();
      // When the user didn't ask in Arabic, skip the Arabic line — the
      // following translation line will be rendered on its own.
      if (!showArabic) continue;
      const next = lines[i + 1] || '';
      const hasTrans = /^["“]/.test(next);
      out.push(
        <blockquote key={`q${k++}`} className="my-3 pl-4 border-l-[3px] border-[#c9a84c]">
          <p className="arabic text-xl text-[#0d3d25] dark:text-[#f0d080] leading-loose mb-1">{line}</p>
          {hasTrans && <p className="text-sm italic text-gray-600 dark:text-gray-300 leading-relaxed">{next}</p>}
        </blockquote>
      );
      if (hasTrans) i++;
      continue;
    }

    // Standalone translation line (quoted)
    if (/^["“]/.test(line)) {
      flush();
      out.push(
        <p key={`t${k++}`} className="text-sm italic text-gray-600 dark:text-gray-300 leading-relaxed my-2 pl-4 border-l-[3px] border-[#c9a84c]">{line}</p>
      );
      continue;
    }

    // Reference line (e.g. "Surah Adh-Dhariyat (51:56)" or "Sahih Bukhari #5386")
    if (/\d{1,3}\s*:\s*\d{1,3}/.test(line) || /#\s*\d+/.test(line)) {
      flush();
      out.push(
        <p key={`r${k++}`} className="text-sm font-semibold text-[#1a5c38] dark:text-[#e8c668] mb-2">{line}</p>
      );
      continue;
    }

    // Follow-up question → highlighted box
    if (line.endsWith('?')) {
      flush();
      out.push(
        <div key={`f${k++}`} className="mt-4 flex items-start gap-2.5 bg-[#fdf6e3] dark:bg-white/5 border border-[#c9a84c]/25 rounded-xl px-4 py-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" className="mt-0.5 shrink-0">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
          <p className="text-sm text-[#1a5c38] dark:text-gray-200 font-medium leading-relaxed">{line}</p>
        </div>
      );
      continue;
    }

    // Plain paragraph
    flush();
    out.push(
      <p key={`p${k++}`} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">{line}</p>
    );
  }
  flush();
  return out;
}

const SURAH_NAMES: Record<number, string> = {
  1:'Al-Fatihah',2:'Al-Baqarah',3:'Al-Imran',4:'An-Nisa',5:'Al-Maidah',
  6:'Al-Anam',7:'Al-Araf',8:'Al-Anfal',9:'At-Tawbah',10:'Yunus',
  11:'Hud',12:'Yusuf',13:'Ar-Rad',14:'Ibrahim',15:'Al-Hijr',
  16:'An-Nahl',17:'Al-Isra',18:'Al-Kahf',19:'Maryam',20:'Ta-Ha',
  21:'Al-Anbiya',22:'Al-Hajj',23:'Al-Muminun',24:'An-Nur',25:'Al-Furqan',
  26:'Ash-Shuara',27:'An-Naml',28:'Al-Qasas',29:'Al-Ankabut',30:'Ar-Rum',
  31:'Luqman',32:'As-Sajdah',33:'Al-Ahzab',34:'Saba',35:'Fatir',
  36:'Ya-Sin',37:'As-Saffat',38:'Sad',39:'Az-Zumar',40:'Ghafir',
  41:'Fussilat',42:'Ash-Shura',43:'Az-Zukhruf',44:'Ad-Dukhan',45:'Al-Jathiyah',
  46:'Al-Ahqaf',47:'Muhammad',48:'Al-Fath',49:'Al-Hujurat',50:'Qaf',
  51:'Adh-Dhariyat',52:'At-Tur',53:'An-Najm',54:'Al-Qamar',55:'Ar-Rahman',
  56:'Al-Waqiah',57:'Al-Hadid',58:'Al-Mujadila',59:'Al-Hashr',60:'Al-Mumtahanah',
  61:'As-Saf',62:'Al-Jumuah',63:'Al-Munafiqun',64:'At-Taghabun',65:'At-Talaq',
  66:'At-Tahrim',67:'Al-Mulk',68:'Al-Qalam',69:'Al-Haqqah',70:'Al-Maarij',
  71:'Nuh',72:'Al-Jinn',73:'Al-Muzzammil',74:'Al-Muddaththir',75:'Al-Qiyamah',
  76:'Al-Insan',77:'Al-Mursalat',78:'An-Naba',79:'An-Naziat',80:'Abasa',
  81:'At-Takwir',82:'Al-Infitar',83:'Al-Mutaffifin',84:'Al-Inshiqaq',85:'Al-Buruj',
  86:'At-Tariq',87:'Al-Ala',88:'Al-Ghashiyah',89:'Al-Fajr',90:'Al-Balad',
  91:'Ash-Shams',92:'Al-Layl',93:'Ad-Duha',94:'Ash-Sharh',95:'At-Tin',
  96:'Al-Alaq',97:'Al-Qadr',98:'Al-Bayyinah',99:'Az-Zalzalah',100:'Al-Adiyat',
  101:'Al-Qariah',102:'At-Takathur',103:'Al-Asr',104:'Al-Humazah',105:'Al-Fil',
  106:'Quraysh',107:'Al-Maun',108:'Al-Kawthar',109:'Al-Kafirun',110:'An-Nasr',
  111:'Al-Masad',112:'Al-Ikhlas',113:'Al-Falaq',114:'An-Nas',
};

/** Try to extract surah/verse from text content when DB metadata is missing */
function parseRefFromText(text: string): { surahNum?: number; verseNum?: number; surahName?: string } {
  // Pattern: (5:33) or 5:33
  const colonRef = text.match(/\((\d{1,3}):(\d{1,3})\)/) || text.match(/\b(\d{1,3}):(\d{1,3})\b/);
  if (colonRef) {
    const s = parseInt(colonRef[1], 10), v = parseInt(colonRef[2], 10);
    if (s >= 1 && s <= 114 && v >= 1) return { surahNum: s, verseNum: v, surahName: SURAH_NAMES[s] };
  }
  // Pattern: surah name in text
  for (const [num, name] of Object.entries(SURAH_NAMES)) {
    if (text.includes(name)) {
      const n = parseInt(num, 10);
      // also try to find verse number near the name
      const vMatch = text.match(new RegExp(name + '[^\\d]*(\\d{1,3})'));
      return { surahNum: n, verseNum: vMatch ? parseInt(vMatch[1], 10) : undefined, surahName: name };
    }
  }
  // Pattern: standalone verse-like number "35." at start of sentence
  const verseOnly = text.match(/(?:^|[.;!]\s+)(\d{1,3})\.\s+[A-Z]/m);
  if (verseOnly) return { verseNum: parseInt(verseOnly[1], 10) };
  return {};
}

function QuranCard({ src, index, showArabic }: { src: QuranSource; index: number; showArabic: boolean }) {
  const [open, setOpen] = useState(false);

  const translation = cleanText(src.text);

  // Build reference — prefer DB metadata, fall back to text extraction
  const dbChapter = Number(src.chapter);
  const dbVerse   = Number(src.verse);
  const dbName    = src.surah_name?.trim();

  const hasDbRef  = dbChapter > 0 && dbVerse > 0;
  const textRef   = hasDbRef ? {} : parseRefFromText(translation || src.text);

  const surahNum  = hasDbRef ? dbChapter : textRef.surahNum;
  const verseNum  = hasDbRef ? dbVerse   : textRef.verseNum;
  const surahName = dbName || textRef.surahName || (surahNum ? SURAH_NAMES[surahNum] : undefined);

  const chipLabel = surahName && verseNum
    ? `Surah ${surahName} — Ayah ${verseNum}`
    : surahName && surahNum
      ? `Surah ${surahName} (Ch. ${surahNum})`
      : surahNum && verseNum
        ? `Quran ${surahNum}:${verseNum}`
        : verseNum
          ? `Quran — Ayah ${verseNum}`
          : 'Quran Verse';

  return (
    <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-800/40 overflow-hidden">
      {/* Collapsed row */}
      <button
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-emerald-50/60 dark:bg-emerald-900/20 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">{index + 1}</span>
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 truncate">📖 {chipLabel}</span>
        </div>
        <svg className={`shrink-0 w-4 h-4 text-emerald-600 dark:text-emerald-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-emerald-200/60 dark:border-emerald-800/40 bg-white dark:bg-[#13211a] divide-y divide-emerald-100/60 dark:divide-white/5">

          {/* ── Reference banner ── */}
          <div className="px-4 py-3 bg-emerald-700 flex flex-wrap items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="2" className="shrink-0">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mr-1">Quran Reference</span>
            {surahName && (
              <span className="bg-white/15 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                Surah {surahName}
              </span>
            )}
            {surahNum && (
              <span className="bg-white/15 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                Chapter {surahNum}
              </span>
            )}
            {verseNum && (
              <span className="bg-[#c9a84c] text-[#0d3d25] text-xs font-bold px-2.5 py-1 rounded-full">
                Ayah {verseNum}
              </span>
            )}
          </div>

          {/* ── Arabic text (only when the user asked in Arabic) ── */}
          {showArabic && src.arabic_text && (
            <div className="p-4">
              <p className="text-[10px] font-bold text-[#c9a84c] uppercase tracking-widest mb-3">Arabic Text</p>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#c9a84c]/60 via-[#c9a84c] to-[#c9a84c]/60 rounded-full" />
                <p className="arabic text-2xl text-[#0d3d25] dark:text-[#f0d080] leading-loose bg-[#fdf6e3] dark:bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-xl p-4 pl-5">
                  {src.arabic_text}
                </p>
              </div>
            </div>
          )}

          {/* ── Translation ── */}
          {translation && (
            <div className="p-4">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Translation</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{translation}</p>
            </div>
          )}

          {/* ── Simple explanation ── */}
          {src.explanation && (
            <div className="p-4 bg-emerald-50/40 dark:bg-emerald-900/15">
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9.663 17h4.673M12 3v1M12 17v4M5 12H4M20 12h-1M6.34 6.34l-.7-.7M18.36 6.34l.7-.7"/>
                  <circle cx="12" cy="12" r="4"/>
                </svg>
                In Simple Words
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{src.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HadithCard({ src, index }: { src: HadithSource; index: number }) {
  const [open, setOpen] = useState(false);

  const hasNumber = src.number && Number(src.number) > 0;
  const chipLabel = hasNumber ? `${src.book} — Hadith #${src.number}` : src.book || 'Hadith';
  const text = cleanText(src.text);

  return (
    <div className="rounded-xl border border-amber-200/70 dark:border-amber-800/40 overflow-hidden">
      {/* Collapsed row */}
      <button
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-amber-50/60 dark:bg-amber-900/20 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0 w-6 h-6 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">{index + 1}</span>
          <span className="text-xs font-bold text-amber-800 dark:text-amber-300 truncate">📜 {chipLabel}</span>
        </div>
        <svg className={`shrink-0 w-4 h-4 text-amber-600 dark:text-amber-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-amber-200/60 dark:border-amber-800/40 bg-white dark:bg-[#13211a] divide-y divide-amber-100/60 dark:divide-white/5">

          {/* ── Reference banner ── */}
          <div className="px-4 py-3 bg-amber-700 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fde68a" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              <span className="text-[10px] font-bold text-amber-200 uppercase tracking-widest">Hadith Reference</span>
            </div>
            <div className="flex flex-wrap gap-2 ml-auto">
              {src.book && (
                <span className="bg-white/15 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {src.book}
                </span>
              )}
              {hasNumber && (
                <span className="bg-[#c9a84c] text-[#0d3d25] text-xs font-bold px-3 py-1 rounded-full">
                  Hadith No. {src.number}
                </span>
              )}
              {!hasNumber && (
                <span className="bg-white/10 text-amber-200 text-xs px-3 py-1 rounded-full italic">
                  Number not extracted
                </span>
              )}
            </div>
          </div>

          {/* ── Hadith text ── */}
          <div className="p-4">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Hadith Text</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{text || 'Hadith text unavailable.'}</p>
          </div>

          {/* ── Simple explanation ── */}
          {src.explanation && (
            <div className="p-4 bg-amber-50/40 dark:bg-amber-900/15 border-t border-amber-100/60 dark:border-white/5">
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9.663 17h4.673M12 3v1M12 17v4M5 12H4M20 12h-1M6.34 6.34l-.7-.7M18.36 6.34l.7-.7"/>
                  <circle cx="12" cy="12" r="4"/>
                </svg>
                In Simple Words
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{src.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AnswerBubble({ question, answer, quranSources, hadithSources }: Props) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(true);

  async function handleCopy() {
    await navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleBookmark() {
    const entry = {
      id: Date.now().toString(),
      question,
      answer,
      citations: { quran_sources: quranSources, hadith_sources: hadithSources },
      created_at: new Date().toISOString(),
    };
    try {
      const existing = localStorage.getItem('saved_answers');
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(entry);
      localStorage.setItem('saved_answers', JSON.stringify(list.slice(0, 50)));
      await supabase.from('saved_answers').insert({ question, answer, citations: entry.citations });
    } catch { /* saved locally */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const totalSources = quranSources.length + hadithSources.length;
  // Show Arabic only when the user's own question contained Arabic
  const showArabic = containsArabic(question);

  return (
    <div className="px-4 py-2 flex justify-start fade-in">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-[#13211a] rounded-2xl rounded-tl-sm shadow-sm border border-[#c9a84c]/15 dark:border-white/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-[#0d3d25] to-[#1a5c38] border-b border-[#c9a84c]/20">
            <div className="w-6 h-6 rounded-full bg-[#c9a84c]/20 border border-[#c9a84c]/50 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 20 20" width="12" height="12" fill="none">
                <path d="M10 2C10 2 14 5 14 10C14 12.2 12.2 14 10 14C7.8 14 6 12.2 6 10C6 7.8 7.8 6 10 6" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="15" cy="4" r="1.5" fill="#c9a84c" opacity="0.8"/>
              </svg>
            </div>
            <span className="text-xs font-semibold text-[#c9a84c]/90 tracking-wide">Islamic Assistant</span>
            {totalSources > 0 && (
              <span className="ml-auto text-[10px] font-bold bg-[#c9a84c]/15 border border-[#c9a84c]/25 text-[#c9a84c] px-2 py-0.5 rounded-full">
                {totalSources} source{totalSources > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Answer body */}
          <div className="px-5 py-4">
            {renderAnswerBody(answer, showArabic)}
          </div>

          {/* Sources section */}
          {totalSources > 0 && (
            <div className="border-t border-[#c9a84c]/10">
              <button
                onClick={() => setSourcesOpen(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#fdf6e3]/50 transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <span className="text-[10px] font-bold text-[#c9a84c] uppercase tracking-widest">
                    Referenced Sources ({totalSources})
                  </span>
                  {quranSources.length > 0 && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">📖 {quranSources.length} Quran</span>
                  )}
                  {hadithSources.length > 0 && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">📜 {hadithSources.length} Hadith</span>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 text-[#c9a84c] transition-transform duration-200 ${sourcesOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {sourcesOpen && (
                <div className="px-4 pb-4 space-y-2">
                  {quranSources.map((src, i) => (
                    <QuranCard key={`q${i}`} src={src} index={i} showArabic={showArabic} />
                  ))}
                  {hadithSources.map((src, i) => (
                    <HadithCard key={`h${i}`} src={src} index={i} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action row */}
          <div className="flex border-t border-gray-100 dark:border-white/10">
            <button onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-[#1a5c38] dark:hover:text-emerald-300 hover:bg-green-50/80 dark:hover:bg-white/5 py-2.5 transition-all duration-150">
              {copied
                ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied</>
                : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy</>
              }
            </button>
            <div className="w-px bg-gray-100 dark:bg-white/10" />
            <button onClick={() => navigator.share?.({ text: `Q: ${question}\n\nA: ${answer}` })}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-[#1a5c38] dark:hover:text-emerald-300 hover:bg-green-50/80 dark:hover:bg-white/5 py-2.5 transition-all duration-150">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Share
            </button>
            <div className="w-px bg-gray-100 dark:bg-white/10" />
            <button onClick={handleBookmark}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-[#c9a84c] hover:bg-amber-50/80 dark:hover:bg-white/5 py-2.5 transition-all duration-150">
              {saved
                ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Saved!</>
                : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Save</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
