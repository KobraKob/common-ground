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
 * 5 Primary Destinations (Hick's Law & Apple HIG).
 * Strict 12px radius, clean amber active state, no purple gradients.
 */
const PRIMARY_DESTINATIONS = [
  { href: '/city', label: 'City Feed', icon: Compass },
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
      const role = (profile as any)?.role || (profile as any)?.platform_role;
      setIsModerator(role === 'MODERATOR' || role === 'ADMIN');
    }
  }, [pathname]);

  return (
    <>
      {/* Desktop Slim Sidebar */}
      <aside className="hidden md:flex flex-col w-56 lg:w-60 shrink-0 border-r border-white/10 min-h-[calc(100vh-4rem)] p-3 bg-[#0E1017]/80 backdrop-blur-2xl">
        <div className="space-y-1.5 flex-1 pt-2">
          {PRIMARY_DESTINATIONS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all duration-150 overflow-hidden ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-300 font-bold border border-amber-400/35 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {/* Active Amber Indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-amber-400 rounded-r-full shadow-[0_0_8px_#F59E0B]" />
                )}

                <div className="flex items-center gap-3 pl-1">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-amber-400' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom Utility: Profile + Mod Queue */}
        <div className="pt-3 border-t border-white/10 space-y-1">
          {isLoggedIn && (
            <Link
              href="/profile"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all duration-150 ${
                pathname === '/profile'
                  ? 'bg-amber-500/10 text-amber-300 font-bold border border-amber-400/35 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className={`w-4 h-4 ${pathname === '/profile' ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>My Profile</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50 text-slate-500" />
            </Link>
          )}

          {isModerator && (
            <Link
              href="/moderation"
              className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-mono transition-all duration-150 ${
                pathname === '/moderation'
                  ? 'bg-white/10 text-amber-300 border border-amber-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
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

      {/* Mobile Native-Feel Bottom Tab Bar (Fitts's Law: 48px touch targets) */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 rounded-xl border border-white/15 bg-[#0E1017]/95 backdrop-blur-2xl px-2 py-2 flex items-center justify-around shadow-2xl safe-area-pb">
        {PRIMARY_DESTINATIONS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-mono transition-all ${
                isActive
                  ? 'text-amber-300 font-bold scale-105'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 mb-0.5 ${
                    isActive ? 'text-amber-400' : ''
                  }`}
                />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#F59E0B]" />
                )}
              </div>
              <span className="truncate max-w-[56px]">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
