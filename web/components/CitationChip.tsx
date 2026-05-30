'use client';
import { useState } from 'react';

interface CitationChipProps {
  type: 'quran' | 'hadith';
  label: string;
  fullText: string;
  arabicText?: string;
}

export default function CitationChip({ type, label, fullText, arabicText }: CitationChipProps) {
  const [open, setOpen] = useState(false);
  const isQuran = type === 'quran';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
          isQuran
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200/70 hover:bg-emerald-100 hover:border-emerald-300'
            : 'bg-amber-50 text-amber-800 border-amber-200/70 hover:bg-amber-100 hover:border-amber-300'
        }`}
      >
        <span>{isQuran ? '📖' : '📜'}</span>
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[75vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className={`flex items-center justify-between px-6 py-4 ${isQuran ? 'bg-gradient-to-r from-emerald-700 to-emerald-600' : 'bg-gradient-to-r from-amber-700 to-amber-600'}`}>
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{isQuran ? '📖' : '📜'}</span>
                <div>
                  <p className="text-white font-bold text-sm">{isQuran ? 'Quran' : 'Hadith'}</p>
                  <p className="text-white/70 text-xs">{label}</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto p-6 space-y-4">
              {arabicText && (
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#c9a84c]/60 via-[#c9a84c] to-[#c9a84c]/60 rounded-full" />
                  <p className="arabic text-xl text-gray-800 leading-loose bg-[#fdf6e3] border border-[#c9a84c]/20 p-4 pl-5 rounded-xl">
                    {arabicText}
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-700 leading-relaxed">{fullText}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
