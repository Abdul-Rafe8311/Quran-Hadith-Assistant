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
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border mr-2 mb-1 transition-opacity hover:opacity-80 ${
          isQuran
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-blue-100 text-blue-800 border-blue-200'
        }`}
      >
        {isQuran ? '📖' : '📜'} {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[70vh] overflow-y-auto p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isQuran ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}
              >
                {isQuran ? 'Quran' : 'Hadith'} — {label}
              </span>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {arabicText && (
              <p className="arabic text-xl text-gray-800 leading-relaxed bg-amber-50 p-4 rounded-lg mb-4">
                {arabicText}
              </p>
            )}
            <p className="text-sm text-gray-700 leading-relaxed">{fullText}</p>
          </div>
        </div>
      )}
    </>
  );
}
