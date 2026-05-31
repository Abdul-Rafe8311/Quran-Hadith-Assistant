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
      <div className="rounded-2xl overflow-hidden border border-[#c9a84c]/25 shadow-sm">
        <div className="h-1 shimmer" />
        <div className="bg-white/80 dark:bg-[#13211a] p-6">
          <div className="h-2.5 shimmer rounded w-20 mb-5" />
          <div className="h-7 shimmer rounded w-full mb-3" />
          <div className="h-4 shimmer rounded w-5/6 mb-2" />
          <div className="h-3 shimmer rounded w-1/3 ml-auto mt-4" />
        </div>
      </div>
    );
  }

  const meta = (ayah?.metadata as Record<string, unknown>) || {};

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#c9a84c]/25 shadow-sm">
      {/* Gold top bar */}
      <div className="h-1 bg-gradient-to-r from-[#c9a84c]/40 via-[#c9a84c] to-[#c9a84c]/40" />

      <div className="relative bg-gradient-to-br from-white/95 to-[#fdf6e3]/90 dark:from-[#13211a] dark:to-[#16241c] backdrop-blur p-6 overflow-hidden">
        {/* Decorative corner ornament */}
        <div className="absolute top-3 right-3 opacity-[0.08] slow-rotate">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <polygon points="40,2 75,20 75,60 40,78 5,60 5,20" stroke="#c9a84c" strokeWidth="1.5" fill="none"/>
            <polygon points="40,12 65,25 65,55 40,68 15,55 15,25" stroke="#c9a84c" strokeWidth="1" fill="none"/>
            <polygon points="40,22 55,31 55,50 40,59 25,50 25,31" stroke="#c9a84c" strokeWidth="0.5" fill="none"/>
          </svg>
        </div>
        <div className="absolute bottom-3 left-3 opacity-[0.05]">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <polygon points="30,2 56,16 56,44 30,58 4,44 4,16" stroke="#1a5c38" strokeWidth="1.5" fill="none"/>
            <polygon points="30,12 46,21 46,39 30,48 14,39 14,21" stroke="#1a5c38" strokeWidth="1" fill="none"/>
          </svg>
        </div>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#e8c05a] flex items-center justify-center shadow-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
          </div>
          <span className="text-xs font-bold text-[#c9a84c] uppercase tracking-widest">Verse of the Day</span>
        </div>

        {/* Arabic text */}
        {meta.arabic_text != null && (
          <div className="relative mb-5">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#c9a84c]/60 via-[#c9a84c] to-[#c9a84c]/60 rounded-full" />
            <p className="arabic text-2xl text-[#0d3d25] dark:text-[#f0d080] leading-loose bg-[#0d3d25]/[0.04] dark:bg-[#c9a84c]/10 rounded-xl p-4 pl-5 border border-[#c9a84c]/10">
              {String(meta.arabic_text)}
            </p>
          </div>
        )}

        {/* Translation */}
        <blockquote className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4 italic pl-1 border-l-0">
          &ldquo;{ayah?.content || 'In the name of Allah, the Most Gracious, the Most Merciful'}&rdquo;
        </blockquote>

        {/* Reference */}
        <div className="flex items-center justify-end gap-1.5">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c9a84c]/25" />
          <span className="text-xs font-semibold text-[#c9a84c]">
            {meta.surah_name
              ? `${String(meta.surah_name)} ${String(meta.surah_number)}:${String(meta.ayah_number)}`
              : 'Al-Fatiha 1:1'}
          </span>
        </div>
      </div>
    </div>
  );
}
