'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building2, 
  Compass, 
  BookOpen, 
  MessageSquare, 
  Hammer, 
  User, 
  ShieldCheck, 
  ChevronRight,
  Sparkles,
  Flame,
  Home
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Overview & Guide', icon: Sparkles, tag: 'GUIDE // 00', exact: true },
  { href: '/city', label: 'City Pulse Feed', icon: Compass, tag: 'FEED // 01', exact: false },
  { href: '/campus', label: 'Campus Hub', icon: Building2, tag: 'BASE // 02', exact: false },
  { href: '/commons', label: 'Commons Q&A', icon: BookOpen, tag: 'VAULT // 03', exact: false },
  { href: '/messages', label: 'Messages', icon: MessageSquare, tag: 'CHAT // 04', exact: false },
  { href: '/build', label: 'Build Cohorts', icon: Hammer, tag: 'LABS // 05', exact: false },
];

export function NavigationSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-purple-500/20 min-h-[calc(100vh-4rem)] p-4 bg-[#0B0524]/70 backdrop-blur-2xl">
        <div className="space-y-1.5 flex-1">
          <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[#7C6FA6] flex items-center justify-between">
            <span>Navigation Matrix</span>
            <span className="text-[#FBBF24]">✦</span>
          </div>

          {NAV_ITEMS.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all duration-200 overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/15 via-purple-600/15 to-transparent text-[#FDE68A] font-semibold border border-amber-400/35 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'text-[#C4B5FD] hover:text-[#F8F7FF] hover:bg-purple-900/20 border border-transparent hover:border-purple-500/20'
                }`}
              >
                {/* Lit Window Left Glow Indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-[#FDE68A] via-[#FBBF24] to-[#F59E0B] rounded-r-full shadow-[0_0_12px_#FBBF24]" />
                )}

                <div className="flex items-center gap-3 pl-1">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#FBBF24] drop-shadow-[0_0_8px_#FBBF24]' : 'text-[#7C6FA6]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <span
                  className={`text-[9px] uppercase tracking-wider font-mono ${
                    isActive ? 'text-[#FDE68A] opacity-90' : 'text-[#7C6FA6]'
                  }`}
                >
                  {item.tag}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Bottom Utility Links */}
        <div className="pt-4 border-t border-purple-500/20 space-y-1">
          <Link
            href="/profile"
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all duration-200 ${
              pathname === '/profile'
                ? 'bg-gradient-to-r from-amber-500/15 via-purple-600/15 to-transparent text-[#FDE68A] font-semibold border border-amber-400/35 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                : 'text-[#C4B5FD] hover:text-[#F8F7FF] hover:bg-purple-900/20 border border-transparent hover:border-purple-500/20'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <User className={`w-4 h-4 ${pathname === '/profile' ? 'text-[#FBBF24]' : 'text-[#7C6FA6]'}`} />
              <span>Identity & Trust</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 text-[#7C6FA6]" />
          </Link>

          <Link
            href="/moderation"
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all duration-200 ${
              pathname === '/moderation'
                ? 'bg-gradient-to-r from-amber-500/15 via-purple-600/15 to-transparent text-[#FDE68A] font-semibold border border-amber-400/35 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                : 'text-[#C4B5FD] hover:text-[#F8F7FF] hover:bg-purple-900/20 border border-transparent hover:border-purple-500/20'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className={`w-4 h-4 ${pathname === '/moderation' ? 'text-[#FBBF24]' : 'text-[#7C6FA6]'}`} />
              <span>Mod Queue</span>
            </div>
            <span className="neo-badge text-[8px] bg-red-500/15 text-red-300 border-red-500/40">
              AUDIT
            </span>
          </Link>
        </div>
      </aside>

      {/* Mobile Floating Bottom Dock (Capacitor & Touch Responsive) */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 rounded-2xl border border-purple-500/30 bg-[#090422]/90 backdrop-blur-2xl px-2 py-1.5 flex items-center justify-around shadow-[0_8px_32px_rgba(3,1,12,0.85)] safe-area-pb">
        {NAV_ITEMS.slice(0, 4).map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-mono transition-all duration-150 ${
                isActive
                  ? 'text-[#FDE68A] font-bold scale-105'
                  : 'text-[#7C6FA6] hover:text-[#C4B5FD]'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 mb-0.5 ${
                    isActive ? 'text-[#FBBF24] drop-shadow-[0_0_8px_#FBBF24]' : ''
                  }`}
                />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#FBBF24] shadow-[0_0_6px_#FBBF24]" />
                )}
              </div>
              <span className="truncate max-w-[50px]">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}

        {/* Profile Mobile Icon */}
        <Link
          href="/profile"
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-mono transition-all duration-150 ${
            pathname === '/profile'
              ? 'text-[#FDE68A] font-bold scale-105'
              : 'text-[#7C6FA6] hover:text-[#C4B5FD]'
          }`}
        >
          <User
            className={`w-5 h-5 mb-0.5 ${
              pathname === '/profile' ? 'text-[#FBBF24] drop-shadow-[0_0_8px_#FBBF24]' : ''
            }`}
          />
          <span>Profile</span>
        </Link>
      </nav>
    </>
  );
}