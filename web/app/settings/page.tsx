'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#c9a84c]/15 shadow-sm">
      <div className="h-0.5 bg-gradient-to-r from-[#c9a84c]/30 via-[#c9a84c]/60 to-[#c9a84c]/30" />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[#0d3d25]/8 flex items-center justify-center text-[#1a5c38]">
            {icon}
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

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

  const fontSizeOptions = [
    { value: 'small', label: 'Small', size: 'text-xs' },
    { value: 'medium', label: 'Medium', size: 'text-sm' },
    { value: 'large', label: 'Large', size: 'text-base' },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto w-full p-5 space-y-4">
      {/* Page title */}
      <div className="flex items-center gap-2 mb-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <h1 className="text-sm font-bold text-[#1a5c38] uppercase tracking-wide">Settings</h1>
      </div>

      {/* Language */}
      <SectionCard title="Language" icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      }>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Response Language</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {language === 'ur' ? 'اردو فعال ہے — Urdu active' : 'English active'}
            </p>
          </div>
          <button
            onClick={() => {
              const l = language === 'en' ? 'ur' : 'en';
              setLanguage(l);
              saveSettings({ language: l });
            }}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${language === 'ur' ? 'bg-[#1a5c38]' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${language === 'ur' ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>
      </SectionCard>

      {/* Font size */}
      <SectionCard title="Text Size" icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
        </svg>
      }>
        <div className="flex gap-2">
          {fontSizeOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setFontSize(opt.value); saveSettings({ fontSize: opt.value }); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                fontSize === opt.value
                  ? 'bg-[#0d3d25] text-white border-[#0d3d25] shadow-sm'
                  : 'text-gray-500 border-gray-200 hover:border-[#c9a84c]/50 hover:bg-[#fdf6e3]/50'
              }`}
            >
              <span className={opt.size}>{opt.label}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Source books */}
      <SectionCard title="Source Books" icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      }>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400">Indexed knowledge base</p>
          <button
            onClick={loadSourceBooks}
            className="flex items-center gap-1 text-xs text-[#1a5c38] font-semibold hover:bg-green-50 px-2 py-1 rounded-lg transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
        </div>
        {booksLoading ? (
          <div className="space-y-2">
            <div className="h-4 shimmer rounded w-2/3" />
            <div className="h-4 shimmer rounded w-1/2" />
          </div>
        ) : sourceBooks.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 leading-relaxed">
            No books indexed yet. Run <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono">npm run ingest</code> after placing PDFs in <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono">scripts/pdfs/</code>
          </div>
        ) : (
          <div className="space-y-1.5">
            {sourceBooks.map(book => (
              <div key={book} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="text-base">{book.toLowerCase().includes('quran') ? '📖' : '📜'}</span>
                <span className="text-sm text-gray-700">{book}</span>
                <span className="ml-auto text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">Active</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Data management */}
      <SectionCard title="Data" icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      }>
        <div className="space-y-2.5">
          <button
            onClick={clearHistory}
            className="w-full flex items-center gap-3 text-sm font-medium text-red-600 bg-red-50/70 border border-red-200/60 rounded-xl px-4 py-3 hover:bg-red-100/80 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Clear Chat History
          </button>
          <button
            onClick={clearSaved}
            className="w-full flex items-center gap-3 text-sm font-medium text-red-600 bg-red-50/70 border border-red-200/60 rounded-xl px-4 py-3 hover:bg-red-100/80 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            Clear Saved Answers
          </button>
        </div>
      </SectionCard>

      {/* About */}
      <SectionCard title="About" icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      }>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0d3d25] to-[#1a5c38] flex items-center justify-center shrink-0 shadow-sm">
            <svg viewBox="0 0 30 30" width="22" height="22" fill="none">
              <path d="M15 3C15 3 21 8 21 15C21 18.3 18.3 21 15 21C11.7 21 9 18.3 9 15C9 11.7 11.7 9 15 9" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="23" cy="6" r="2.5" fill="#c9a84c"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-[#1a5c38] text-sm mb-1">Quran & Hadith Assistant</p>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              All answers are sourced exclusively from authenticated Islamic texts. No external internet content is used.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 bg-amber-50/80 border border-amber-200/60 rounded-xl p-3.5 mt-1">
          <span className="text-amber-500 text-sm shrink-0 mt-0.5">⚠️</span>
          <p className="text-xs text-amber-700 leading-relaxed">
            Not a fatwa service. For religious rulings, consult a qualified Islamic scholar (Mufti).
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
