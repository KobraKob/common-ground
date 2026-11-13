'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { getActiveProfile, isAuthenticated } from '@/lib/api';

/**
 * Core 5 Primary Navigation Destinations (Apple HIG: ≤ 5 destinations).
 * Straightforward plain labels without cryptic matrix codes.
 */
const PRIMARY_DESTINATIONS = [
  { href: '/city', label: 'City Pulse', icon: Compass },
  { href: '/campus', label: 'Campus Hub', icon: Building2 },
  { href: '/commons', label: 'Commons', icon: BookOpen },
  { href: '/build', label: 'Build Squads', icon: Hammer },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
];

export function NavigationSidebar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isModerator, setIsModerator] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoggedIn(isAuthenticated());
      const profile = getActiveProfile();
      // Only show mod queue to authorized staff/moderators
      const role = (profile as any)?.role || (profile as any)?.platform_role;
      setIsModerator(role === 'MODERATOR' || role === 'ADMIN');
    }
  }, [pathname]);

  return (
    <>
      {/* Desktop Slim Sidebar (Apple-inspired deference & hierarchy) */}
      <aside className="hidden md:flex flex-col w-56 lg:w-60 shrink-0 border-r border-purple-500/20 min-h-[calc(100vh-4rem)] p-3 bg-[#0B0524]/60 backdrop-blur-2xl">
        <div className="space-y-1 flex-1 pt-2">
          {PRIMARY_DESTINATIONS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-mono transition-all duration-200 overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/15 via-purple-600/15 to-transparent text-[#FDE68A] font-bold border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
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
              </Link>
            );
          })}
        </div>

        {/* Bottom Utility: Profile + Conditional Mod Queue */}
        <div className="pt-3 border-t border-purple-500/20 space-y-1">
          {isLoggedIn && (
            <Link
              href="/profile"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-mono transition-all duration-200 ${
                pathname === '/profile'
                  ? 'bg-gradient-to-r from-amber-500/15 via-purple-600/15 to-transparent text-[#FDE68A] font-bold border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                  : 'text-[#C4B5FD] hover:text-[#F8F7FF] hover:bg-purple-900/20 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className={`w-4 h-4 ${pathname === '/profile' ? 'text-[#FBBF24]' : 'text-[#7C6FA6]'}`} />
                <span>My Profile</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60 text-[#7C6FA6]" />
            </Link>
          )}

          {/* Mod Queue: Strictly visible only to confirmed moderators */}
          {isModerator && (
            <Link
              href="/moderation"
              className={`flex items-center justify-between px-3.5 py-2 rounded-2xl text-xs font-mono transition-all duration-200 ${
                pathname === '/moderation'
                  ? 'bg-purple-900/30 text-amber-300 border border-amber-400/40'
                  : 'text-[#7C6FA6] hover:text-white hover:bg-purple-900/20 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Mod Queue</span>
              </div>
              <span className="neo-badge text-[8px] bg-red-500/15 text-red-300 border-red-500/40">
                STAFF
              </span>
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Native-Feel Bottom Tab Dock (5 Primary Destinations) */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 rounded-3xl border border-purple-500/30 bg-[#090422]/95 backdrop-blur-2xl px-2 py-1.5 flex items-center justify-around shadow-[0_12px_36px_rgba(3,1,12,0.9)] safe-area-pb">
        {PRIMARY_DESTINATIONS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2.5 rounded-2xl text-[10px] font-mono transition-all duration-150 ${
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
              <span className="truncate max-w-[54px]">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
