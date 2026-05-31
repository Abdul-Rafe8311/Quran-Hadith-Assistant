import Link from 'next/link';
import DailyAyah from '../components/DailyAyah';
import NameOfAllah from '../components/NameOfAllah';
import { TOPICS } from '../constants/topics';

// Distinct soft color per topic card — keeps the page lively & attractive
const TOPIC_COLORS = [
  { bg: 'from-emerald-50 to-emerald-100/40', border: 'border-emerald-200/70', iconBg: 'bg-emerald-100', text: 'text-emerald-800', glow: 'bg-emerald-300/40' },
  { bg: 'from-amber-50 to-amber-100/40',     border: 'border-amber-200/70',   iconBg: 'bg-amber-100',   text: 'text-amber-800',   glow: 'bg-amber-300/40' },
  { bg: 'from-rose-50 to-rose-100/40',       border: 'border-rose-200/70',    iconBg: 'bg-rose-100',    text: 'text-rose-800',    glow: 'bg-rose-300/40' },
  { bg: 'from-violet-50 to-violet-100/40',   border: 'border-violet-200/70',  iconBg: 'bg-violet-100',  text: 'text-violet-800',  glow: 'bg-violet-300/40' },
  { bg: 'from-sky-50 to-sky-100/40',         border: 'border-sky-200/70',     iconBg: 'bg-sky-100',     text: 'text-sky-800',     glow: 'bg-sky-300/40' },
  { bg: 'from-pink-50 to-pink-100/40',       border: 'border-pink-200/70',    iconBg: 'bg-pink-100',    text: 'text-pink-800',    glow: 'bg-pink-300/40' },
  { bg: 'from-teal-50 to-teal-100/40',       border: 'border-teal-200/70',    iconBg: 'bg-teal-100',    text: 'text-teal-800',    glow: 'bg-teal-300/40' },
  { bg: 'from-indigo-50 to-indigo-100/40',   border: 'border-indigo-200/70',  iconBg: 'bg-indigo-100',  text: 'text-indigo-800',  glow: 'bg-indigo-300/40' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen pattern-bg">
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-[#06170d] via-[#0a2e1c] to-[#1a5c38] overflow-hidden">
        {/* Geometric lattice pattern */}
        <div className="absolute inset-0 geo-pattern opacity-[0.06]" />
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 65% 55% at 50% 25%, rgba(201,168,76,0.16) 0%, transparent 70%)' }} />
        {/* Soft vignette bottom */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#1a5c38]/40 to-transparent pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 pt-14 pb-16 text-center">
          {/* Decorative crescent emblem */}
          <div className="flex justify-center mb-6">
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c9a84c]/25 to-[#c9a84c]/5 border border-[#c9a84c]/40 flex items-center justify-center shadow-gold float">
              <svg viewBox="0 0 44 44" width="30" height="30" fill="none">
                <path d="M22 5C22 5 33 12 33 24 C33 29.5 28.5 34 22 34 C15.5 34 11 29.5 11 24 C11 18.5 15.5 14 22 14" stroke="#f0d080" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M30 9 L33 6 L40 13 L33 21 L30 18 L35 13 Z" fill="#f0d080" opacity="0.55"/>
                <circle cx="36" cy="8" r="2.5" fill="#f0d080"/>
              </svg>
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#c9a84c]/12 border border-[#c9a84c]/35 rounded-full px-5 py-1.5 mb-7 backdrop-blur-sm sheen">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
            <span className="text-[#e8c668] text-[11px] font-bold tracking-[0.2em] uppercase">Authentic Islamic Knowledge</span>
          </div>

          {/* Bismillah */}
          <p className="arabic text-3xl sm:text-4xl text-[#f0d080] mb-4 leading-loose drop-shadow-md">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>

          <h1 className="text-white text-2xl sm:text-3xl font-extrabold mb-2.5 tracking-tight leading-tight">
            Quran &amp; Hadith <span className="gradient-text">Assistant</span>
          </h1>
          <p className="text-green-100/55 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
            Honest answers about Islam — grounded in the Quran and authentic Hadith, explained simply.
          </p>

          {/* CTA */}
          <Link
            href="/chat"
            className="pulse-gold sheen inline-flex items-center gap-3 bg-gradient-to-r from-[#c9a84c] to-[#e8c05a] text-[#0a2e1c] font-bold px-9 py-4 rounded-full hover:from-[#e8c05a] hover:to-[#f0d080] transition-all duration-300 shadow-gold hover:-translate-y-1 text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Ask a Question
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-5 sm:gap-8 mt-10 pt-8 border-t border-white/10">
            {[
              { num: '6,236', label: 'Quran Verses' },
              { num: '4,781', label: 'Sahih Hadiths' },
              { num: '2', label: 'Languages' },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-5 sm:gap-8">
                {i > 0 && <div className="w-px h-7 bg-white/10" />}
                <div className="text-center">
                  <p className="text-[#f0d080] font-bold text-lg sm:text-xl">{s.num}</p>
                  <p className="text-green-100/45 text-[10px] mt-0.5 tracking-wide">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Daily Ayah + Name of Allah */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DailyAyah />
          <NameOfAllah />
        </div>

        {/* Topics */}
        <div>
          <div className="divider-ornament mb-5">
            <div className="flex items-center gap-2">
              <span className="text-[#c9a84c] text-xs">✦</span>
              <span className="text-xs font-bold text-[#1a5c38] uppercase tracking-widest">Explore Topics</span>
              <span className="text-[#c9a84c] text-xs">✦</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {TOPICS.map((topic, i) => {
              const c = TOPIC_COLORS[i % TOPIC_COLORS.length];
              return (
                <Link
                  key={topic.id}
                  href={`/chat?prefill=${encodeURIComponent(topic.query)}`}
                  style={{ animationDelay: `${i * 55}ms` }}
                  className={`fade-in group relative bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl p-5 text-center hover:-translate-y-1.5 transition-all duration-300 overflow-hidden shadow-soft hover:shadow-lg`}
                >
                  <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full ${c.glow} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative">
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-2xl ${c.iconBg} flex items-center justify-center text-2xl group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300 shadow-sm`}>
                      {topic.emoji}
                    </div>
                    <div className={`text-xs font-bold ${c.text} tracking-wide`}>{topic.label}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* How It Works */}
        <div>
          <div className="divider-ornament mb-7">
            <div className="flex items-center gap-2">
              <span className="text-[#c9a84c] text-xs">✦</span>
              <span className="text-xs font-bold text-[#1a5c38] uppercase tracking-widest">How It Works</span>
              <span className="text-[#c9a84c] text-xs">✦</span>
            </div>
          </div>

          <div className="relative">
            {/* Connecting line between steps (desktop) */}
            <div className="hidden sm:block absolute top-10 left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-[#c9a84c]/20 via-[#c9a84c]/50 to-[#c9a84c]/20 z-0" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
              {[
                {
                  step: '1',
                  icon: (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  ),
                  title: 'Ask Your Question',
                  desc: 'Type any question about Islam in English or Urdu — big or small, nothing is too basic.',
                  color: 'bg-[#0d3d25]',
                  badge: 'You type it',
                },
                {
                  step: '2',
                  icon: (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  ),
                  title: 'AI Searches the Sources',
                  desc: 'The AI instantly searches through thousands of Quran verses and authentic Hadith to find the most relevant ones.',
                  color: 'bg-[#c9a84c]',
                  badge: 'AI searches',
                  iconColor: 'text-[#0d3d25]',
                },
                {
                  step: '3',
                  icon: (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                  ),
                  title: 'Get a Clear Answer',
                  desc: 'You receive a simple, easy-to-understand answer with the exact Surah, Ayah, and Hadith references so you can verify it yourself.',
                  color: 'bg-[#1a5c38]',
                  badge: 'With proof',
                },
              ].map((s, i) => (
                <div key={s.step} style={{ animationDelay: `${i * 80}ms` }} className="fade-in flex flex-col items-center text-center">
                  {/* Step circle */}
                  <div className={`relative w-20 h-20 rounded-full ${s.color} flex items-center justify-center shadow-lg mb-4`}>
                    <span className={s.iconColor || 'text-white'}>{s.icon}</span>
                    {/* Step number badge */}
                    <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-[#c9a84c] text-[#0d3d25] text-[10px] font-extrabold flex items-center justify-center shadow-sm">
                      {s.step}
                    </span>
                  </div>
                  {/* Badge */}
                  <span className="text-[10px] font-bold bg-[#c9a84c]/15 border border-[#c9a84c]/30 text-[#1a5c38] px-2.5 py-0.5 rounded-full mb-2 uppercase tracking-wider">
                    {s.badge}
                  </span>
                  <h3 className="text-sm font-bold text-[#0d3d25] mb-1.5">{s.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Highlight box */}
          <div className="mt-6 bg-gradient-to-r from-[#0d3d25]/5 to-[#c9a84c]/10 border border-[#c9a84c]/25 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0d3d25] flex items-center justify-center shrink-0 mt-0.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#0d3d25] mb-0.5">100% grounded in authentic sources</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Every answer comes directly from the Quran and Sahih Hadith stored in our database — the AI never makes things up or uses outside internet sources.
              </p>
            </div>
          </div>
        </div>

        {/* Source cards */}
        <div>
          <div className="divider-ornament mb-6">
            <div className="flex items-center gap-2">
              <span className="text-[#c9a84c] text-xs">✦</span>
              <span className="text-xs font-bold text-[#1a5c38] uppercase tracking-widest">Our Sources</span>
              <span className="text-[#c9a84c] text-xs">✦</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                icon: '📖',
                title: 'Holy Quran',
                desc: 'Full English & Urdu translations with every verse reference',
                tag: '6,236 verses',
                color: 'from-emerald-500/10 to-emerald-600/5',
                border: 'border-emerald-200/50',
              },
              {
                icon: '📜',
                title: 'Sahih Bukhari',
                desc: 'Authentic hadith collection from all 9 volumes',
                tag: '7,563 hadiths',
                color: 'from-amber-500/10 to-amber-600/5',
                border: 'border-amber-200/50',
              },
              {
                icon: '🤖',
                title: 'AI-Powered Search',
                desc: 'Semantic search finds the most relevant sources instantly',
                tag: 'Multilingual',
                color: 'from-blue-500/10 to-blue-600/5',
                border: 'border-blue-200/50',
              },
            ].map(card => (
              <div key={card.title} className={`bg-gradient-to-br ${card.color} border ${card.border} backdrop-blur rounded-2xl p-5`}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{card.icon}</span>
                  <span className="text-[10px] font-bold bg-white/60 border border-[#c9a84c]/20 text-[#1a5c38] px-2 py-0.5 rounded-full">{card.tag}</span>
                </div>
                <p className="font-bold text-[#1a5c38] text-sm mb-1.5">{card.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-center gap-3 bg-amber-50/80 border border-amber-200/60 rounded-2xl p-4">
          <span className="text-amber-500 text-lg shrink-0">⚠️</span>
          <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-bold">Note:</span> This is not a fatwa service. For religious rulings and legal opinions, please consult a qualified Islamic scholar (Mufti).
          </p>
        </div>
      </div>
    </div>
  );
}
