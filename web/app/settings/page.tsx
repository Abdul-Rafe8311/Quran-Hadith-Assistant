'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function SettingsPage() {
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [sourceBooks, setSourceBooks] = useState<string[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('settings');
    if (stored) {
      const s = JSON.parse(stored);
      setLanguage(s.language || 'en');
      setFontSize(s.fontSize || 'medium');
    }
    loadSourceBooks();
  }, []);

  async function loadSourceBooks() {
    setBooksLoading(true);
    try {
      const { data, error } = await supabase
        .from('islamic_knowledge')
        .select('metadata')
        .not('metadata->book', 'is', null)
        .limit(1000);
      if (!error && data) {
        const books = new Set<string>();
        for (const row of data) {
          const book = (row.metadata as Record<string, unknown>)?.book;
          if (typeof book === 'string') books.add(book);
        }
        setSourceBooks(Array.from(books).sort());
      }
    } catch {}
    setBooksLoading(false);
  }

  function saveSettings(updates: Partial<{ language: 'en' | 'ur'; fontSize: 'small' | 'medium' | 'large' }>) {
    const current = { language, fontSize, ...updates };
    localStorage.setItem('settings', JSON.stringify(current));
  }

  function clearHistory() {
    if (!confirm('This will delete your chat history.')) return;
    localStorage.removeItem('chat_history');
    alert('Chat history cleared.');
  }

  function clearSaved() {
    if (!confirm('This will delete all saved answers.')) return;
    localStorage.removeItem('saved_answers');
    void supabase.from('saved_answers').delete().neq('id', '');
    alert('Saved answers cleared.');
  }

  return (
    <div className="max-w-3xl mx-auto w-full p-4 space-y-4">

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Language</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-800">English / Urdu</span>
          <button
            onClick={() => {
              const l = language === 'en' ? 'ur' : 'en';
              setLanguage(l);
              saveSettings({ language: l });
            }}
            className={`relative w-12 h-6 rounded-full transition-colors ${language === 'ur' ? 'bg-[#1a5c38]' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${language === 'ur' ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">{language === 'ur' ? 'اردو فعال ہے' : 'English active'}</p>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Font Size</p>
        <div className="flex gap-2">
          {(['small', 'medium', 'large'] as const).map(size => (
            <button
              key={size}
              onClick={() => { setFontSize(size); saveSettings({ fontSize: size }); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                fontSize === size
                  ? 'bg-[#1a5c38] text-white border-[#1a5c38]'
                  : 'text-gray-600 border-gray-200 hover:border-[#1a5c38]'
              }`}
            >
              {size.charAt(0).toUpperCase() + size.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Source Books</p>
          <button onClick={loadSourceBooks} className="text-xs text-[#1a5c38] font-semibold">↺ Refresh</button>
        </div>
        {booksLoading ? (
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
        ) : sourceBooks.length === 0 ? (
          <p className="text-xs text-gray-500">
            No books ingested yet. Run <code className="bg-gray-100 px-1 rounded">npm run ingest</code> after placing PDFs in scripts/pdfs/.
          </p>
        ) : (
          <div className="space-y-2">
            {sourceBooks.map(book => (
              <div key={book} className="flex items-center gap-2 py-1.5 border-b border-gray-50">
                <span>{book.toLowerCase().includes('quran') ? '📖' : '📜'}</span>
                <span className="text-sm text-gray-700">{book}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Data</p>
        <button onClick={clearHistory} className="w-full text-left text-sm text-red-600 font-semibold bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 hover:bg-red-100 transition-colors">
          Clear Chat History
        </button>
        <button onClick={clearSaved} className="w-full text-left text-sm text-red-600 font-semibold bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 hover:bg-red-100 transition-colors">
          Clear Saved Answers
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">About</p>
        <p className="font-bold text-[#1a5c38] mb-2">Quran & Hadith Assistant</p>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          Answers are sourced exclusively from authentic Islamic PDF books. No external APIs or internet sources are used for content.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 leading-relaxed">
          ⚠️ Not a fatwa service. For religious rulings, please consult a qualified Islamic scholar (Mufti).
        </div>
      </div>
    </div>
  );
}
