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
      <div className="max-w-3xl mx-auto w-full p-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-full mb-1" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (saved.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
        <p className="text-5xl mb-4">🔖</p>
        <p className="text-gray-700 font-bold text-lg mb-1">No saved answers yet</p>
        <p className="text-gray-400 text-sm">Tap the Save button on any answer to bookmark it</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-sm font-bold text-[#1a5c38] uppercase tracking-wide">Saved Answers</h1>
        <button onClick={loadSaved} className="text-xs text-[#1a5c38] font-semibold">↺ Refresh</button>
      </div>

      {saved.map(item => {
        const isExpanded = expanded === item.id;
        const qCount = item.citations?.quran_sources?.length || 0;
        const hCount = item.citations?.hadith_sources?.length || 0;

        return (
          <div
            key={item.id}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setExpanded(isExpanded ? null : item.id)}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className={`text-sm font-bold text-[#1a5c38] flex-1 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                {item.question}
              </p>
              <div className="flex gap-1 flex-shrink-0">
                {qCount > 0 && (
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">📖 {qCount}</span>
                )}
                {hCount > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">📜 {hCount}</span>
                )}
              </div>
            </div>
            <p className={`text-xs text-gray-600 leading-relaxed mb-2 ${!isExpanded ? 'line-clamp-3' : ''}`}>
              {item.answer}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</p>
              <button
                onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
