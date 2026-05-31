'use client';
import { useEffect, useState } from 'react';

// A selection from the 99 Beautiful Names of Allah (Asma ul Husna)
const NAMES = [
  { arabic: 'ٱلرَّحْمَٰن', translit: 'Ar-Rahman', meaning: 'The Most Compassionate' },
  { arabic: 'ٱلرَّحِيم', translit: 'Ar-Raheem', meaning: 'The Most Merciful' },
  { arabic: 'ٱلْمَلِك', translit: 'Al-Malik', meaning: 'The King, The Sovereign' },
  { arabic: 'ٱلْقُدُّوس', translit: 'Al-Quddus', meaning: 'The Most Holy' },
  { arabic: 'ٱلسَّلَام', translit: 'As-Salam', meaning: 'The Source of Peace' },
  { arabic: 'ٱلْغَفُور', translit: 'Al-Ghafur', meaning: 'The All-Forgiving' },
  { arabic: 'ٱلْوَهَّاب', translit: 'Al-Wahhab', meaning: 'The Supreme Bestower' },
  { arabic: 'ٱلرَّزَّاق', translit: 'Ar-Razzaq', meaning: 'The Provider' },
  { arabic: 'ٱلْحَكِيم', translit: 'Al-Hakeem', meaning: 'The All-Wise' },
  { arabic: 'ٱلْوَدُود', translit: 'Al-Wadud', meaning: 'The Most Loving' },
  { arabic: 'ٱلْحَلِيم', translit: 'Al-Haleem', meaning: 'The Forbearing' },
  { arabic: 'ٱلشَّكُور', translit: 'Ash-Shakur', meaning: 'The Most Appreciative' },
  { arabic: 'ٱلْكَرِيم', translit: 'Al-Kareem', meaning: 'The Most Generous' },
  { arabic: 'ٱلْمُجِيب', translit: 'Al-Mujeeb', meaning: 'The Responsive One' },
  { arabic: 'ٱلْحَفِيظ', translit: 'Al-Hafeez', meaning: 'The Preserver' },
  { arabic: 'ٱلْوَكِيل', translit: 'Al-Wakeel', meaning: 'The Trustee' },
  { arabic: 'ٱلْقَوِيّ', translit: 'Al-Qawiyy', meaning: 'The All-Strong' },
  { arabic: 'ٱلصَّبُور', translit: 'As-Saboor', meaning: 'The Most Patient' },
  { arabic: 'ٱلنُّور', translit: 'An-Nur', meaning: 'The Light' },
  { arabic: 'ٱلْهَادِي', translit: 'Al-Hadi', meaning: 'The Guide' },
];

export default function NameOfAllah() {
  // Pick by day of year so it changes daily but is stable within a day
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const day = Math.floor((now.getTime() - start.getTime()) / 86400000);
    setIdx(day % NAMES.length);
  }, []);

  const name = NAMES[idx];

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#c9a84c]/25 shadow-soft">
      {/* Deep green gradient with pattern */}
      <div className="relative bg-gradient-to-br from-[#0a2e1c] via-[#0d3d25] to-[#1a5c38] p-6 overflow-hidden">
        <div className="absolute inset-0 geo-pattern opacity-[0.06]" />
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#c9a84c]/10 blur-3xl" />

        <div className="relative flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
              <span className="text-[10px] font-bold text-[#e8c668] uppercase tracking-[0.2em]">Name of Allah</span>
            </div>
            <p className="text-[#f0d080] font-bold text-lg mb-0.5">{name.translit}</p>
            <p className="text-green-100/70 text-sm">{name.meaning}</p>
          </div>

          {/* Arabic medallion */}
          <div className="shrink-0 w-24 h-24 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center">
            <p className="arabic text-3xl text-[#f0d080] leading-none" dir="rtl">{name.arabic}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
