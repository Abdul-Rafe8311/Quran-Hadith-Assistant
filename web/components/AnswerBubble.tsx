'use client';
import { useState } from 'react';
import CitationChip from './CitationChip';
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

export default function AnswerBubble({ question, answer, quranSources, hadithSources }: Props) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

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

  return (
    <div className="px-4 py-2 flex justify-start fade-in">
      <div className="bg-white rounded-2xl rounded-tl-none p-5 max-w-2xl w-full shadow-sm border border-[#c9a84c]/15">
        {/* Answer icon */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-[#0d3d25] flex items-center justify-center text-xs text-[#c9a84c] font-bold shrink-0">☪</div>
          <span className="text-xs font-semibold text-[#1a5c38]">Islamic Assistant</span>
        </div>

        {lines.map((line, i) => {
          if (line.startsWith('[') && line.endsWith(']')) {
            return (
              <div key={i} className="flex items-center gap-2 mt-4 mb-2">
                <div className="w-1 h-4 rounded-full bg-[#c9a84c]" />
                <p className="text-xs font-bold text-[#1a5c38] uppercase tracking-wide">{line.slice(1,-1)}</p>
              </div>
            );
          }
          if (containsArabic(line)) {
            return (
              <p key={i} className="arabic text-xl text-[#0d3d25] my-3 leading-loose bg-[#fdf6e3] border border-[#c9a84c]/20 p-3 rounded-xl">
                {line}
              </p>
            );
          }
          return line.trim() ? (
            <p key={i} className="text-sm text-gray-700 leading-relaxed mb-1.5">{line}</p>
          ) : <div key={i} className="h-2" />;
        })}

        {(quranSources.length > 0 || hadithSources.length > 0) && (
          <div className="mt-4 pt-3 border-t border-[#c9a84c]/15">
            <p className="text-xs text-[#c9a84c] font-bold uppercase tracking-widest mb-2">Sources</p>
            <div className="flex flex-wrap gap-1">
              {quranSources.map((src, i) => (
                <CitationChip key={`q${i}`} type="quran"
                  label={`${src.surah_name} ${src.chapter}:${src.verse}`}
                  fullText={src.text} arabicText={src.arabic_text} />
              ))}
              {hadithSources.map((src, i) => (
                <CitationChip key={`h${i}`} type="hadith"
                  label={`${src.book} #${src.number}`} fullText={src.text} />
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
          <button onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#1a5c38] hover:bg-green-50 py-1.5 rounded-lg transition-colors">
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
          <button onClick={() => navigator.share?.({ text: `Q: ${question}\n\nA: ${answer}` })}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#1a5c38] hover:bg-green-50 py-1.5 rounded-lg transition-colors">
            📤 Share
          </button>
          <button onClick={handleBookmark}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#c9a84c] hover:bg-amber-50 py-1.5 rounded-lg transition-colors">
            {saved ? '✓ Saved' : '🔖 Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
