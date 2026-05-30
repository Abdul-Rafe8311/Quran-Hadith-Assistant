'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )},
  { href: '/chat', label: 'Ask', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )},
  { href: '/saved', label: 'Saved', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  )},
  { href: '/settings', label: 'Settings', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )},
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-40 bg-[#0d3d25] border-b border-[#c9a84c]/20 shadow-lg shadow-black/20">
      {/* Decorative top line */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[#c9a84c]/60 to-transparent" />
      <div className="max-w-5xl mx-auto flex items-center justify-between px-5 py-2.5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#c9a84c]/30 to-[#c9a84c]/10 border border-[#c9a84c]/50 flex items-center justify-center shadow-inner">
            <svg viewBox="0 0 36 36" width="22" height="22" fill="none">
              <path d="M18 4 C18 4 26 10 26 18 C26 22.4 22.4 26 18 26 C13.6 26 10 22.4 10 18 C10 13.6 13.6 10 18 10" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="28" cy="8" r="3" fill="#c9a84c" opacity="0.8"/>
              <path d="M20 14 L22 12 L28 18 L22 24 L20 22 L24 18 Z" fill="#c9a84c" opacity="0.5"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight tracking-tight">Islamic Assistant</p>
            <p className="gradient-text text-[10px] leading-tight font-medium tracking-wider">Quran & Hadith</p>
          </div>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-0.5">
          {links.map(l => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-[#c9a84c] text-[#0d3d25] shadow-sm shadow-[#c9a84c]/30'
                    : 'text-green-100/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className={active ? 'text-[#0d3d25]' : 'text-current opacity-70'}>{l.icon}</span>
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
