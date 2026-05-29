'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function DailyAyah() {
  const [ayah, setAyah] = useState<{ content: string; metadata: Record<string, unknown> } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDailyAyah(); }, []);

  async function fetchDailyAyah() {
    try {
      const { data, error } = await supabase
        .from('islamic_knowledge')
        .select('content, metadata')
        .eq('source_type', 'quran')
        .eq('lang', 'en')
        .limit(50);
      if (!error && data && data.length > 0) {
        setAyah(data[Math.floor(Math.random() * data.length)]);
      }
    } catch { /* fallback below */ }
    finally { setLoading(false); }
  }

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-[#c9a84c]/30 shadow-sm animate-pulse">
        <div className="h-3 bg-[#c9a84c]/20 rounded w-1/5 mb-4" />
        <div className="h-6 bg-gray-100 rounded w-full mb-3" />
        <div className="h-4 bg-gray-100 rounded w-5/6 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-1/3 ml-auto" />
      </div>
    );
  }

  const meta = (ayah?.metadata as Record<string, unknown>) || {};

  return (
    <div className="relative bg-gradient-to-br from-white/90 to-[#fdf6e3]/90 backdrop-blur rounded-2xl p-6 border border-[#c9a84c]/30 shadow-sm overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5"
        style={{ backgroundImage: 'radial-gradient(circle, #c9a84c 2px, transparent 2px)', backgroundSize: '16px 16px' }} />
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 rounded-full bg-[#c9a84c]" />
        <span className="text-xs font-bold text-[#c9a84c] uppercase tracking-widest">Daily Ayah</span>
      </div>
      {meta.arabic_text != null && (
        <p className="arabic text-2xl text-[#0d3d25] mb-4 leading-loose bg-[#0d3d25]/5 rounded-xl p-3">
          {String(meta.arabic_text)}
        </p>
      )}
      <p className="text-sm text-gray-700 leading-relaxed mb-3 italic">
        &ldquo;{ayah?.content || 'In the name of Allah, the Most Gracious, the Most Merciful'}&rdquo;
      </p>
      <p className="text-xs text-[#c9a84c] font-semibold text-right">
        — {meta.surah_name ? `${String(meta.surah_name)} ${String(meta.surah_number)}:${String(meta.ayah_number)}` : 'Al-Fatiha 1:1'}
      </p>
    </div>
  );
}
