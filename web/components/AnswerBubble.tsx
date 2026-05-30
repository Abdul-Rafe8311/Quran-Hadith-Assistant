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

/** Remove PDF artifacts: URLs, garbled OCR lines, excessive special chars */
function cleanText(raw: string): string {
  return raw
    .replace(/https?:\/\/[^\s]+/g, '')           // strip URLs
    .replace(/www\.[^\s]+/g, '')                  // strip www. links
    .replace(/[{}_\\|<>]{2,}/g, '')               // strip PDF artifact runs
    .split('\n')
    .filter(line => {
      const t = line.trim();
      if (!t) return true;
      // keep line only if at least 30% of chars are letters (Latin or Arabic)
      const letters = (t.match(/[a-zA-Z؀-ۿ]/g) || []).length;
      return letters / t.length > 0.28;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function QuranCard({ src, index }: { src: QuranSource; index: number }) {
  const [open, setOpen] = useState(false);

  const hasRef = src.surah_name && Number(src.chapter) > 0 && Number(src.verse) > 0;
  const onlyNumbers = !src.surah_name && Number(src.chapter) > 0 && Number(src.verse) > 0;
  const label = hasRef
    ? `Surah ${src.surah_name} — ${src.chapter}:${src.verse}`
    : onlyNumbers
      ? `Quran ${src.chapter}:${src.verse}`
      : 'Quran Verse';

  const translation = cleanText(src.text);

  return (
    <div className="rounded-xl border border-emerald-200/70 overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-emerald-50/60 hover:bg-emerald-50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">{index + 1}</span>
          <div className="min-w-0">
            <span className="text-xs font-bold text-emerald-800 block truncate">📖 {label}</span>
          </div>
        </div>
        <svg
          className={`shrink-0 w-4 h-4 text-emerald-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="border-t border-emerald-200/60 bg-white space-y-3 p-4">
          {/* Arabic text */}
          {src.arabic_text && (
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#c9a84c]/60 via-[#c9a84c] to-[#c9a84c]/60 rounded-full" />
              <div className="bg-[#fdf6e3] border border-[#c9a84c]/20 rounded-xl p-4 pl-5">
                <p className="text-[10px] font-bold text-[#c9a84c] uppercase tracking-widest mb-2">Arabic</p>
                <p className="arabic text-2xl text-[#0d3d25] leading-loose">{src.arabic_text}</p>
              </div>
            </div>
          )}

          {/* Translation */}
          {translation && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Translation</p>
              <p className="text-sm text-gray-700 leading-relaxed">{translation}</p>
            </div>
          )}

          {/* Reference */}
          {hasRef && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              Holy Quran, Surah {src.surah_name}, Chapter {src.chapter}, Verse {src.verse}
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
  const label = hasNumber ? `${src.book} — Hadith #${src.number}` : src.book || 'Hadith';
  const text = cleanText(src.text);

  return (
    <div className="rounded-xl border border-amber-200/70 overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-amber-50/60 hover:bg-amber-50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0 w-6 h-6 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">{index + 1}</span>
          <div className="min-w-0">
            <span className="text-xs font-bold text-amber-800 block truncate">📜 {label}</span>
          </div>
        </div>
        <svg
          className={`shrink-0 w-4 h-4 text-amber-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="border-t border-amber-200/60 bg-white p-4 space-y-3">
          {/* Hadith text */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Hadith Text</p>
            <p className="text-sm text-gray-700 leading-relaxed">{text || 'Hadith text unavailable.'}</p>
          </div>

          {/* Reference */}
          <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-semibold">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            {hasNumber ? `${src.book}, Hadith No. ${src.number}` : src.book}
          </div>
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

  const lines = answer.split('\n');
  const totalSources = quranSources.length + hadithSources.length;

  return (
    <div className="px-4 py-2 flex justify-start fade-in">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm border border-[#c9a84c]/15 overflow-hidden">
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
            {lines.map((line, i) => {
              if (line.startsWith('[') && line.endsWith(']')) {
                return (
                  <div key={i} className="flex items-center gap-2.5 mt-5 mb-3">
                    <div className="w-0.5 h-5 rounded-full bg-gradient-to-b from-[#c9a84c] to-[#c9a84c]/40" />
                    <p className="text-xs font-bold text-[#1a5c38] uppercase tracking-widest">{line.slice(1, -1)}</p>
                  </div>
                );
              }
              if (containsArabic(line)) {
                return (
                  <div key={i} className="relative my-4">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#c9a84c]/60 via-[#c9a84c] to-[#c9a84c]/60 rounded-full" />
                    <p className="arabic text-xl text-[#0d3d25] leading-loose bg-[#fdf6e3] border border-[#c9a84c]/20 p-4 pl-5 rounded-xl">
                      {line}
                    </p>
                  </div>
                );
              }
              return line.trim() ? (
                <p key={i} className="text-sm text-gray-700 leading-relaxed mb-2">{line}</p>
              ) : <div key={i} className="h-1.5" />;
            })}
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
                    <QuranCard key={`q${i}`} src={src} index={i} />
                  ))}
                  {hadithSources.map((src, i) => (
                    <HadithCard key={`h${i}`} src={src} index={i} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action row */}
          <div className="flex border-t border-gray-100">
            <button onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 hover:text-[#1a5c38] hover:bg-green-50/80 py-2.5 transition-all duration-150">
              {copied
                ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied</>
                : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy</>
              }
            </button>
            <div className="w-px bg-gray-100" />
            <button onClick={() => navigator.share?.({ text: `Q: ${question}\n\nA: ${answer}` })}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 hover:text-[#1a5c38] hover:bg-green-50/80 py-2.5 transition-all duration-150">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Share
            </button>
            <div className="w-px bg-gray-100" />
            <button onClick={handleBookmark}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 hover:text-[#c9a84c] hover:bg-amber-50/80 py-2.5 transition-all duration-150">
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
