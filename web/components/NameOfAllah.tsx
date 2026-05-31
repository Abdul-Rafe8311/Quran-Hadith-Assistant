'use client';
import { useEffect, useState } from 'react';

// The 99 Beautiful Names of Allah (Asma ul Husna) — cycles one per day
const NAMES = [
  { arabic: 'ٱلرَّحْمَٰن', translit: 'Ar-Rahman', meaning: 'The Most Compassionate' },
  { arabic: 'ٱلرَّحِيم', translit: 'Ar-Raheem', meaning: 'The Most Merciful' },
  { arabic: 'ٱلْمَلِك', translit: 'Al-Malik', meaning: 'The King, The Sovereign' },
  { arabic: 'ٱلْقُدُّوس', translit: 'Al-Quddus', meaning: 'The Most Holy' },
  { arabic: 'ٱلسَّلَام', translit: 'As-Salam', meaning: 'The Source of Peace' },
  { arabic: 'ٱلْمُؤْمِن', translit: "Al-Mu'min", meaning: 'The Granter of Security' },
  { arabic: 'ٱلْمُهَيْمِن', translit: 'Al-Muhaymin', meaning: 'The Guardian' },
  { arabic: 'ٱلْعَزِيز', translit: 'Al-Azeez', meaning: 'The Almighty' },
  { arabic: 'ٱلْجَبَّار', translit: 'Al-Jabbar', meaning: 'The Compeller' },
  { arabic: 'ٱلْمُتَكَبِّر', translit: 'Al-Mutakabbir', meaning: 'The Supreme in Greatness' },
  { arabic: 'ٱلْخَالِق', translit: 'Al-Khaliq', meaning: 'The Creator' },
  { arabic: 'ٱلْبَارِئ', translit: "Al-Bari'", meaning: 'The Originator' },
  { arabic: 'ٱلْمُصَوِّر', translit: 'Al-Musawwir', meaning: 'The Fashioner' },
  { arabic: 'ٱلْغَفَّار', translit: 'Al-Ghaffar', meaning: 'The Constant Forgiver' },
  { arabic: 'ٱلْقَهَّار', translit: 'Al-Qahhar', meaning: 'The All-Subduer' },
  { arabic: 'ٱلْوَهَّاب', translit: 'Al-Wahhab', meaning: 'The Supreme Bestower' },
  { arabic: 'ٱلرَّزَّاق', translit: 'Ar-Razzaq', meaning: 'The Provider' },
  { arabic: 'ٱلْفَتَّاح', translit: 'Al-Fattah', meaning: 'The Supreme Opener' },
  { arabic: 'ٱلْعَلِيم', translit: 'Al-Aleem', meaning: 'The All-Knowing' },
  { arabic: 'ٱلْقَابِض', translit: 'Al-Qabid', meaning: 'The Withholder' },
  { arabic: 'ٱلْبَاسِط', translit: 'Al-Basit', meaning: 'The Extender' },
  { arabic: 'ٱلْخَافِض', translit: 'Al-Khafid', meaning: 'The Reducer' },
  { arabic: 'ٱلرَّافِع', translit: "Ar-Rafi'", meaning: 'The Exalter' },
  { arabic: 'ٱلْمُعِزّ', translit: "Al-Mu'izz", meaning: 'The Honourer' },
  { arabic: 'ٱلْمُذِلّ', translit: 'Al-Mudhill', meaning: 'The Dishonourer' },
  { arabic: 'ٱلسَّمِيع', translit: "As-Samee'", meaning: 'The All-Hearing' },
  { arabic: 'ٱلْبَصِير', translit: 'Al-Baseer', meaning: 'The All-Seeing' },
  { arabic: 'ٱلْحَكَم', translit: 'Al-Hakam', meaning: 'The Impartial Judge' },
  { arabic: 'ٱلْعَدْل', translit: 'Al-Adl', meaning: 'The Utterly Just' },
  { arabic: 'ٱللَّطِيف', translit: 'Al-Lateef', meaning: 'The Subtle, The Gentle' },
  { arabic: 'ٱلْخَبِير', translit: 'Al-Khabeer', meaning: 'The All-Aware' },
  { arabic: 'ٱلْحَلِيم', translit: 'Al-Haleem', meaning: 'The Forbearing' },
  { arabic: 'ٱلْعَظِيم', translit: 'Al-Azeem', meaning: 'The Magnificent' },
  { arabic: 'ٱلْغَفُور', translit: 'Al-Ghafur', meaning: 'The All-Forgiving' },
  { arabic: 'ٱلشَّكُور', translit: 'Ash-Shakur', meaning: 'The Most Appreciative' },
  { arabic: 'ٱلْعَلِيّ', translit: 'Al-Aliyy', meaning: 'The Most High' },
  { arabic: 'ٱلْكَبِير', translit: 'Al-Kabeer', meaning: 'The Most Great' },
  { arabic: 'ٱلْحَفِيظ', translit: 'Al-Hafeez', meaning: 'The Preserver' },
  { arabic: 'ٱلْمُقِيت', translit: 'Al-Muqeet', meaning: 'The Sustainer' },
  { arabic: 'ٱلْحَسِيب', translit: 'Al-Haseeb', meaning: 'The Reckoner' },
  { arabic: 'ٱلْجَلِيل', translit: 'Al-Jaleel', meaning: 'The Majestic' },
  { arabic: 'ٱلْكَرِيم', translit: 'Al-Kareem', meaning: 'The Most Generous' },
  { arabic: 'ٱلرَّقِيب', translit: 'Ar-Raqeeb', meaning: 'The Watchful' },
  { arabic: 'ٱلْمُجِيب', translit: 'Al-Mujeeb', meaning: 'The Responsive One' },
  { arabic: 'ٱلْوَاسِع', translit: "Al-Wasi'", meaning: 'The All-Encompassing' },
  { arabic: 'ٱلْحَكِيم', translit: 'Al-Hakeem', meaning: 'The All-Wise' },
  { arabic: 'ٱلْوَدُود', translit: 'Al-Wadud', meaning: 'The Most Loving' },
  { arabic: 'ٱلْمَجِيد', translit: 'Al-Majeed', meaning: 'The Most Glorious' },
  { arabic: 'ٱلْبَاعِث', translit: "Al-Ba'ith", meaning: 'The Resurrector' },
  { arabic: 'ٱلشَّهِيد', translit: 'Ash-Shaheed', meaning: 'The Witness' },
  { arabic: 'ٱلْحَقّ', translit: 'Al-Haqq', meaning: 'The Absolute Truth' },
  { arabic: 'ٱلْوَكِيل', translit: 'Al-Wakeel', meaning: 'The Trustee' },
  { arabic: 'ٱلْقَوِيّ', translit: 'Al-Qawiyy', meaning: 'The All-Strong' },
  { arabic: 'ٱلْمَتِين', translit: 'Al-Mateen', meaning: 'The Firm, The Steadfast' },
  { arabic: 'ٱلْوَلِيّ', translit: 'Al-Waliyy', meaning: 'The Protecting Friend' },
  { arabic: 'ٱلْحَمِيد', translit: 'Al-Hameed', meaning: 'The Praiseworthy' },
  { arabic: 'ٱلْمُحْصِي', translit: 'Al-Muhsee', meaning: 'The All-Enumerating' },
  { arabic: 'ٱلْمُبْدِئ', translit: "Al-Mubdi'", meaning: 'The Originator' },
  { arabic: 'ٱلْمُعِيد', translit: "Al-Mu'id", meaning: 'The Restorer' },
  { arabic: 'ٱلْمُحْيِي', translit: 'Al-Muhyi', meaning: 'The Giver of Life' },
  { arabic: 'ٱلْمُمِيت', translit: 'Al-Mumeet', meaning: 'The Bringer of Death' },
  { arabic: 'ٱلْحَيّ', translit: 'Al-Hayy', meaning: 'The Ever-Living' },
  { arabic: 'ٱلْقَيُّوم', translit: 'Al-Qayyum', meaning: 'The Self-Sustaining' },
  { arabic: 'ٱلْوَاجِد', translit: 'Al-Wajid', meaning: 'The Perceiver' },
  { arabic: 'ٱلْمَاجِد', translit: 'Al-Majid', meaning: 'The Illustrious' },
  { arabic: 'ٱلْوَاحِد', translit: 'Al-Wahid', meaning: 'The One' },
  { arabic: 'ٱلْأَحَد', translit: 'Al-Ahad', meaning: 'The Indivisible' },
  { arabic: 'ٱلصَّمَد', translit: 'As-Samad', meaning: 'The Eternal Refuge' },
  { arabic: 'ٱلْقَادِر', translit: 'Al-Qadir', meaning: 'The All-Powerful' },
  { arabic: 'ٱلْمُقْتَدِر', translit: 'Al-Muqtadir', meaning: 'The Determiner' },
  { arabic: 'ٱلْمُقَدِّم', translit: 'Al-Muqaddim', meaning: 'The Expediter' },
  { arabic: 'ٱلْمُؤَخِّر', translit: "Al-Mu'akhkhir", meaning: 'The Delayer' },
  { arabic: 'ٱلْأَوَّل', translit: 'Al-Awwal', meaning: 'The First' },
  { arabic: 'ٱلْآخِر', translit: 'Al-Akhir', meaning: 'The Last' },
  { arabic: 'ٱلظَّاهِر', translit: 'Az-Zahir', meaning: 'The Manifest' },
  { arabic: 'ٱلْبَاطِن', translit: 'Al-Batin', meaning: 'The Hidden' },
  { arabic: 'ٱلْوَالِي', translit: 'Al-Wali', meaning: 'The Governor' },
  { arabic: 'ٱلْمُتَعَالِي', translit: "Al-Muta'ali", meaning: 'The Most Exalted' },
  { arabic: 'ٱلْبَرّ', translit: 'Al-Barr', meaning: 'The Source of Goodness' },
  { arabic: 'ٱلتَّوَّاب', translit: 'At-Tawwab', meaning: 'The Ever-Pardoning' },
  { arabic: 'ٱلْمُنْتَقِم', translit: 'Al-Muntaqim', meaning: 'The Avenger' },
  { arabic: 'ٱلْعَفُوّ', translit: 'Al-Afuww', meaning: 'The Pardoner' },
  { arabic: 'ٱلرَّؤُوف', translit: "Ar-Ra'uf", meaning: 'The Most Kind' },
  { arabic: 'مَالِكُ ٱلْمُلْك', translit: 'Malik-ul-Mulk', meaning: 'Master of the Kingdom' },
  { arabic: 'ذُو ٱلْجَلَالِ وَٱلْإِكْرَام', translit: 'Dhul-Jalali wal-Ikram', meaning: 'Lord of Majesty & Honour' },
  { arabic: 'ٱلْمُقْسِط', translit: 'Al-Muqsit', meaning: 'The Equitable' },
  { arabic: 'ٱلْجَامِع', translit: "Al-Jami'", meaning: 'The Gatherer' },
  { arabic: 'ٱلْغَنِيّ', translit: 'Al-Ghaniyy', meaning: 'The Self-Sufficient' },
  { arabic: 'ٱلْمُغْنِي', translit: 'Al-Mughni', meaning: 'The Enricher' },
  { arabic: 'ٱلْمَانِع', translit: "Al-Mani'", meaning: 'The Withholder' },
  { arabic: 'ٱلضَّارّ', translit: 'Ad-Darr', meaning: 'The Distresser' },
  { arabic: 'ٱلنَّافِع', translit: "An-Nafi'", meaning: 'The Benefactor' },
  { arabic: 'ٱلنُّور', translit: 'An-Nur', meaning: 'The Light' },
  { arabic: 'ٱلْهَادِي', translit: 'Al-Hadi', meaning: 'The Guide' },
  { arabic: 'ٱلْبَدِيع', translit: "Al-Badi'", meaning: 'The Incomparable Originator' },
  { arabic: 'ٱلْبَاقِي', translit: 'Al-Baqi', meaning: 'The Everlasting' },
  { arabic: 'ٱلْوَارِث', translit: 'Al-Warith', meaning: 'The Inheritor' },
  { arabic: 'ٱلرَّشِيد', translit: 'Ar-Rasheed', meaning: 'The Guide to the Right Path' },
  { arabic: 'ٱلصَّبُور', translit: 'As-Saboor', meaning: 'The Most Patient' },
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
              <span className="text-[9px] font-semibold text-green-100/45 bg-white/5 border border-white/10 rounded-full px-1.5 py-0.5">{idx + 1} / 99</span>
            </div>
            <p className="text-[#f0d080] font-bold text-lg mb-0.5">{name.translit}</p>
            <p className="text-green-100/70 text-sm">{name.meaning}</p>
            <p className="text-green-100/35 text-[10px] mt-2">A new name each day · 99 Beautiful Names</p>
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
