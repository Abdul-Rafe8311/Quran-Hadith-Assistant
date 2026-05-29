'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/chat', label: 'Ask' },
  { href: '/saved', label: 'Saved' },
  { href: '/settings', label: 'Settings' },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="bg-[#0d3d25] border-b border-[#c9a84c]/30 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-[#c9a84c]/20 border border-[#c9a84c]/50 flex items-center justify-center text-base">
            ☪️
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Islamic Assistant</p>
            <p className="text-[#c9a84c]/70 text-[10px] leading-tight">Quran & Hadith</p>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                pathname === l.href
                  ? 'bg-[#c9a84c] text-[#0d3d25] font-semibold shadow-sm'
                  : 'text-green-100/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
