'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building, 
  Compass, 
  BookOpen, 
  MessageSquare, 
  Hammer, 
  User, 
  ShieldCheck, 
  ChevronRight,
  Flame
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/campus', label: 'Campus', icon: Building, tag: 'BASE // 01' },
  { href: '/city', label: 'City', icon: Compass, tag: 'BLR // 02' },
  { href: '/commons', label: 'Commons', icon: BookOpen, tag: 'VAULT // 03' },
  { href: '/messages', label: 'Messages', icon: MessageSquare, tag: 'CHAT // 04' },
  { href: '/build', label: 'Build', icon: Hammer, tag: 'LABS // 05' },
];

export function NavigationSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-[#CCCFFA] dark:border-[#282C47] min-h-[calc(100vh-4rem)] p-4 bg-white/50 dark:bg-[#0E0F1A]/50">
        <div className="space-y-1.5 flex-1">
          <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-gray-400">
            Navigation Matrix
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-mono transition-all ${
                  isActive
                    ? 'bg-[#1A1C29] text-[#C5E17A] dark:bg-[#C5E17A] dark:text-[#0E0F1A] font-semibold shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#151726] border border-transparent hover:border-[#CCCFFA] dark:hover:border-[#282C47]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#C5E17A] dark:text-[#0E0F1A]' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                <span className={`text-[9px] uppercase tracking-wider ${isActive ? 'opacity-80' : 'text-gray-400'}`}>
                  {item.tag}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Bottom Utility Links */}
        <div className="pt-4 border-t border-[#CCCFFA] dark:border-[#282C47] space-y-1">
          <Link
            href="/profile"
            className={`flex items-center justify-between px-3 py-2 rounded text-xs font-mono transition-all ${
              pathname === '/profile'
                ? 'bg-[#1A1C29] text-[#C5E17A] dark:bg-[#C5E17A] dark:text-[#0E0F1A]'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#151726]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4" />
              <span>Identity & Trust</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </Link>

          <Link
            href="/moderation"
            className={`flex items-center justify-between px-3 py-2 rounded text-xs font-mono transition-all ${
              pathname === '/moderation'
                ? 'bg-[#1A1C29] text-[#C5E17A] dark:bg-[#C5E17A] dark:text-[#0E0F1A]'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#151726]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Mod Queue</span>
            </div>
            <span className="neo-badge text-[8px] bg-red-500/10 text-red-500 border-red-500/30">
              AUDIT
            </span>
          </Link>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Capacitor Ready) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#CCCFFA] dark:border-[#282C47] bg-[#FFFFFF]/95 dark:bg-[#0E0F1A]/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around safe-area-pb">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-3 rounded text-[10px] font-mono transition-colors ${
                isActive
                  ? 'text-[#6366F1] dark:text-[#C5E17A] font-bold'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
