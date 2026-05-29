import Link from 'next/link';
import DailyAyah from '../components/DailyAyah';
import { TOPICS } from '../constants/topics';

export default function HomePage() {
  return (
    <div className="min-h-screen pattern-bg">
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-[#0d3d25] via-[#1a5c38] to-[#236b42] overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #c9a84c 1px, transparent 1px), radial-gradient(circle at 75% 75%, #c9a84c 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="relative max-w-4xl mx-auto px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-[#c9a84c]/20 border border-[#c9a84c]/40 rounded-full px-4 py-1.5 mb-6">
            <span className="text-[#c9a84c] text-xs font-semibold tracking-widest uppercase">Authentic Islamic Knowledge</span>
          </div>
          <p className="arabic text-4xl text-[#f0d080] mb-3 leading-loose">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
          <h1 className="text-white text-3xl font-bold mb-2 tracking-tight">Quran & Hadith Assistant</h1>
          <p className="text-green-200/70 text-sm mb-8">Answers grounded exclusively in authentic Islamic sources</p>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 bg-[#c9a84c] text-[#0d3d25] font-bold px-8 py-3 rounded-full hover:bg-[#f0d080] transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Ask a Question
            <span className="text-lg">→</span>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Daily Ayah */}
        <DailyAyah />

        {/* Topics */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c9a84c]/30" />
            <span className="text-xs font-bold text-[#1a5c38] uppercase tracking-widest">Explore Topics</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c9a84c]/30" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TOPICS.map((topic, i) => (
              <Link
                key={topic.id}
                href={`/chat?prefill=${encodeURIComponent(topic.query)}`}
                style={{ animationDelay: `${i * 60}ms` }}
                className="fade-in group bg-white/80 backdrop-blur border border-[#c9a84c]/20 rounded-2xl p-4 text-center hover:border-[#c9a84c]/60 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">{topic.emoji}</div>
                <div className="text-xs font-semibold text-[#1a5c38]">{topic.label}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: '📖', title: 'Quran', desc: 'Full English & Urdu translations with verse references' },
            { icon: '📜', title: 'Sahih Bukhari', desc: 'Authentic hadith from all 9 volumes' },
            { icon: '🔍', title: 'AI-Powered', desc: 'Semantic search finds the most relevant sources' },
          ].map(card => (
            <div key={card.title} className="bg-white/70 backdrop-blur border border-[#c9a84c]/20 rounded-2xl p-4">
              <div className="text-2xl mb-2">{card.icon}</div>
              <p className="font-bold text-[#1a5c38] text-sm mb-1">{card.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center pb-4 border-t border-[#c9a84c]/20 pt-4">
          ⚠️ Not a fatwa service. For religious rulings, consult a qualified Islamic scholar (Mufti).
        </p>
      </div>
    </div>
  );
}
