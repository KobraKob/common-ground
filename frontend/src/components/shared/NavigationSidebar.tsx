'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Building2, Compass, Hammer, MessageSquare, ShieldCheck, User } from 'lucide-react';
import { getCurrentRole, isAuthenticated } from '@/lib/api';

const desktopItems = [
  { href: '/city', label: 'City', icon: Compass },
  { href: '/campus', label: 'Campus', icon: Building2 },
  { href: '/commons', label: 'Q&A', icon: BookOpen },
  { href: '/build', label: 'Build', icon: Hammer },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
];
const mobileItems = desktopItems.filter((item) => item.href !== '/build');

export function NavigationSidebar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isModerator, setIsModerator] = useState(false);

  useEffect(() => {
    const loggedIn = isAuthenticated();
    setIsLoggedIn(loggedIn);
    setIsModerator(false);
    if (loggedIn) {
      getCurrentRole()
        .then((result) => setIsModerator(['ADMIN', 'MODERATOR'].includes(result.platform_role)))
        .catch(() => setIsModerator(false));
    }
  }, [pathname]);

  const isAuth = ['/login', '/signup', '/onboarding'].some((path) => pathname.startsWith(path));
  if (pathname === '/' || isAuth || !isLoggedIn) return null;

  const renderItem = (item: typeof desktopItems[number], mobile = false) => {
    const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
    const Icon = item.icon;
    return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${active ? 'bg-[var(--surface-2)] text-[var(--accent)] font-semibold' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text)]'} ${mobile ? 'min-w-0 flex-1 flex-col justify-center gap-1 px-1 py-1 text-[10px]' : ''}`}>
      <Icon size={mobile ? 22 : 19} strokeWidth={1.8} />
      <span className={mobile ? 'truncate' : ''}>{item.label}</span>
    </Link>;
  };

  return <>
    <aside className="hidden w-52 shrink-0 flex-col border-r border-[var(--separator)] px-3 py-5 md:flex">
      <nav className="sticky top-[68px] flex flex-col gap-1" aria-label="App navigation">
        {desktopItems.map((item) => renderItem(item))}
        {isModerator && <>
          <div className="my-3 border-t border-[var(--separator)]" />
          <Link href="/insights" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface)]"><ShieldCheck size={19} /> Insights</Link>
          <Link href="/performance" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface)]"><ShieldCheck size={19} /> Performance</Link>
          <Link href="/moderation" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface)]"><ShieldCheck size={19} /> Moderation</Link>
        </>}
      </nav>
    </aside>
    <nav className="fixed inset-x-0 bottom-0 z-40 flex min-h-[calc(56px+env(safe-area-inset-bottom))] items-center justify-around border-t border-[var(--separator)] bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="App tabs">
      {mobileItems.map((item) => renderItem(item, true))}
    </nav>
  </>;
}
