import Link from 'next/link';
import DailyAyah from '../components/DailyAyah';
import { TOPICS } from '../constants/topics';

export default function HomePage() {
  return (
    <div className="min-h-screen pattern-bg">
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-[#071f12] via-[#0d3d25] to-[#1a5c38] overflow-hidden">
        {/* Geometric background pattern */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23c9a84c' stroke-width='0.5'%3E%3Cpolygon points='40,4 76,22 76,58 40,76 4,58 4,22'/%3E%3Cpolygon points='40,14 66,27 66,53 40,66 14,53 14,27'/%3E%3Cline x1='40' y1='4' x2='40' y2='14'/%3E%3Cline x1='76' y1='22' x2='66' y2='27'/%3E%3Cline x1='76' y1='58' x2='66' y2='53'/%3E%3Cline x1='40' y1='76' x2='40' y2='66'/%3E%3Cline x1='4' y1='58' x2='14' y2='53'/%3E%3Cline x1='4' y1='22' x2='14' y2='27'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px',
          }} />
        {/* Radial glow */}
        <div className="absolute inset-0 bg-radial-gradient pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(201,168,76,0.12) 0%, transparent 70%)' }} />

        <div className="relative max-w-4xl mx-auto px-6 py-16 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#c9a84c]/15 border border-[#c9a84c]/35 rounded-full px-5 py-1.5 mb-7 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
            <span className="text-[#c9a84c] text-[11px] font-bold tracking-widest uppercase">Authentic Islamic Knowledge</span>
          </div>

          {/* Bismillah */}
          <p className="arabic text-5xl text-[#f0d080] mb-4 leading-loose drop-shadow-md">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>

          <h1 className="text-white text-4xl font-extrabold mb-3 tracking-tight leading-tight">
            Quran & Hadith<br />
            <span className="gradient-text">Assistant</span>
          </h1>
          <p className="text-green-200/60 text-sm mb-10 max-w-sm mx-auto leading-relaxed">
            Answers grounded exclusively in authentic Islamic sources — Quran, Sahih Bukhari & more
          </p>

          {/* CTA */}
          <Link
            href="/chat"
            className="pulse-gold inline-flex items-center gap-3 bg-gradient-to-r from-[#c9a84c] to-[#e8c05a] text-[#0d3d25] font-bold px-9 py-3.5 rounded-full hover:from-[#e8c05a] hover:to-[#f0d080] transition-all duration-300 shadow-xl shadow-[#c9a84c]/25 hover:shadow-[#c9a84c]/40 hover:-translate-y-1 text-sm"
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
          <div className="flex items-center justify-center gap-8 mt-12 pt-10 border-t border-white/10">
            {[
              { num: '6,236', label: 'Quranic Verses' },
              { num: '7,563', label: 'Sahih Hadiths' },
              { num: '2', label: 'Languages' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[#c9a84c] font-bold text-xl">{s.num}</p>
                <p className="text-green-200/50 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Daily Ayah */}
        <DailyAyah />

        {/* Topics */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c9a84c]/30" />
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
              <span className="text-xs font-bold text-[#1a5c38] uppercase tracking-widest">Explore Topics</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c9a84c]/30" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TOPICS.map((topic, i) => (
              <Link
                key={topic.id}
                href={`/chat?prefill=${encodeURIComponent(topic.query)}`}
                style={{ animationDelay: `${i * 55}ms` }}
                className="fade-in group relative bg-white/80 backdrop-blur border border-[#c9a84c]/15 rounded-2xl p-4 text-center hover:border-[#c9a84c]/50 hover:shadow-lg hover:shadow-[#c9a84c]/10 hover:-translate-y-1 transition-all duration-250 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#c9a84c]/0 to-[#c9a84c]/0 group-hover:from-[#c9a84c]/5 group-hover:to-[#1a5c38]/5 transition-all duration-300 rounded-2xl" />
                <div className="relative text-3xl mb-2.5 group-hover:scale-110 transition-transform duration-250">{topic.emoji}</div>
                <div className="relative text-xs font-semibold text-[#1a5c38]">{topic.label}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c9a84c]/30" />
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
              <span className="text-xs font-bold text-[#1a5c38] uppercase tracking-widest">How It Works</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c9a84c]/30" />
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
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c9a84c]/30" />
            <span className="text-xs font-bold text-[#1a5c38] uppercase tracking-widest">Sources</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c9a84c]/30" />
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
