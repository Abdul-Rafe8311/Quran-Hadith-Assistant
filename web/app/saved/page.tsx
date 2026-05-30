'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase, SavedAnswer } from '../../lib/supabase';

export default function SavedPage() {
  const [saved, setSaved] = useState<SavedAnswer[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSaved = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('saved_answers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data && data.length > 0) {
        setSaved(data as SavedAnswer[]);
        setLoading(false);
        return;
      }
    } catch {}
    try {
      const local = localStorage.getItem('saved_answers');
      if (local) setSaved(JSON.parse(local));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadSaved(); }, [loadSaved]);

  async function handleDelete(id: string) {
    if (!confirm('Remove this saved answer?')) return;
    setSaved(prev => prev.filter(s => s.id !== id));
    try { await supabase.from('saved_answers').delete().eq('id', id); } catch {}
    try {
      const local = localStorage.getItem('saved_answers');
      const list: SavedAnswer[] = local ? JSON.parse(local) : [];
      localStorage.setItem('saved_answers', JSON.stringify(list.filter(s => s.id !== id)));
    } catch {}
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto w-full p-5 space-y-3">
        <div className="h-6 shimmer rounded w-32 mb-5" />
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[#c9a84c]/15">
            <div className="h-0.5 shimmer" />
            <div className="p-5">
              <div className="h-4 shimmer rounded w-3/4 mb-3" />
              <div className="h-3 shimmer rounded w-full mb-2" />
              <div className="h-3 shimmer rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (saved.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
        <div className="w-20 h-20 rounded-full bg-[#fdf6e3] border border-[#c9a84c]/30 flex items-center justify-center mb-5 shadow-sm">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <p className="text-gray-700 font-bold text-lg mb-1.5">No saved answers yet</p>
        <p className="text-gray-400 text-sm max-w-xs">Tap the Save button on any answer to bookmark it for later</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          <h1 className="text-sm font-bold text-[#1a5c38] uppercase tracking-wide">Saved Answers</h1>
          <span className="bg-[#1a5c38]/10 text-[#1a5c38] text-xs font-bold px-2 py-0.5 rounded-full">{saved.length}</span>
        </div>
        <button
          onClick={loadSaved}
          className="flex items-center gap-1.5 text-xs text-[#1a5c38] font-semibold hover:bg-green-50 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Refresh
        </button>
      </div>

      {saved.map((item, idx) => {
        const isExpanded = expanded === item.id;
        const qCount = item.citations?.quran_sources?.length || 0;
        const hCount = item.citations?.hadith_sources?.length || 0;

        return (
          <div
            key={item.id}
            style={{ animationDelay: `${idx * 40}ms` }}
            className="fade-in bg-white rounded-2xl overflow-hidden border border-[#c9a84c]/15 shadow-sm hover:shadow-md hover:border-[#c9a84c]/30 transition-all duration-200 cursor-pointer"
            onClick={() => setExpanded(isExpanded ? null : item.id)}
          >
            {/* Top accent bar */}
            <div className="h-0.5 bg-gradient-to-r from-[#c9a84c]/40 via-[#c9a84c]/70 to-[#c9a84c]/40" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <p className={`text-sm font-semibold text-[#1a5c38] flex-1 leading-snug ${!isExpanded ? 'line-clamp-2' : ''}`}>
                  {item.question}
                </p>
                <div className="flex gap-1.5 shrink-0">
                  {qCount > 0 && (
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200/70">
                      📖 {qCount}
                    </span>
                  )}
                  {hCount > 0 && (
                    <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200/70">
                      📜 {hCount}
                    </span>
                  )}
                </div>
              </div>
              <p className={`text-xs text-gray-500 leading-relaxed mb-3 ${!isExpanded ? 'line-clamp-3' : ''}`}>
                {item.answer}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">{isExpanded ? '▲ less' : '▼ more'}</span>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                    className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-600 font-semibold hover:bg-red-50 px-2 py-0.5 rounded-full transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
