'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Compass, BookOpen, MessageSquare, Hammer, User, ShieldCheck, Map } from 'lucide-react';
import { getActiveProfile, getMyProfile, isAuthenticated } from '@/lib/api';

const desktopItems = [
  { href: '/city', label: 'City', icon: Compass },
  { href: '/campus', label: 'Campuses', icon: Building2 },
  { href: '/commons', label: 'Q&A', icon: BookOpen },
  { href: '/build', label: 'Build', icon: Hammer },
  { href: '/discover', label: 'Discover', icon: Map },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
];
const mobileItems = desktopItems.filter((item) => ['/city','/discover','/build','/messages','/profile'].includes(item.href));

export function NavigationSidebar() {
  const pathname = usePathname();
  const [isModerator, setIsModerator] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let active = true;
    const cachedProfile = getActiveProfile();
    const cachedRole = cachedProfile?.platform_role;
    const authenticated = isAuthenticated();
    setIsLoggedIn(authenticated);
    if (!authenticated) {
      setIsModerator(false);
    } else if (cachedRole) {
      setIsModerator(cachedRole === 'MODERATOR' || cachedRole === 'ADMIN');
    } else {
      getMyProfile().then((profile) => {
        if (!active) return;
        setIsModerator(profile?.platform_role === 'MODERATOR' || profile?.platform_role === 'ADMIN');
      });
    }
    return () => { active = false; };
  }, [pathname]);

  const active = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href + '/'));
  if (!isLoggedIn) return null;

  return (
    <>
      <nav aria-label="Primary navigation" className="hidden md:block border-b border-[var(--cg-border)] bg-[var(--cg-bg)]">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center gap-1 px-4">
          {desktopItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} aria-current={active(href) ? 'page' : undefined}
              className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${active(href) ? 'bg-[var(--cg-elevated)] text-[var(--cg-accent)]' : 'text-[var(--cg-muted)] hover:bg-[var(--cg-elevated)] hover:text-[var(--cg-text)]'}`}>
              <Icon size={17} aria-hidden="true" /><span>{label}</span>
            </Link>
          ))}
          {isModerator && <div className="ml-auto flex items-center gap-1"><Link href="/insights" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-[var(--cg-muted)] hover:bg-[var(--cg-elevated)]"><ShieldCheck size={17}/>Insights</Link><Link href="/moderation" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-[var(--cg-muted)] hover:bg-[var(--cg-elevated)]"><ShieldCheck size={17}/>Moderation</Link></div>}
        </div>
      </nav>
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-50 flex min-h-[58px] items-center justify-around border-t border-[var(--cg-border)] bg-[var(--cg-surface)]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        {mobileItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={active(href) ? 'page' : undefined}
            className={`flex min-h-11 min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-[11px] ${active(href) ? 'font-semibold text-[var(--cg-accent)]' : 'text-[var(--cg-muted)]'}`}>
            <Icon size={20} aria-hidden="true"/><span>{label === 'Campuses' ? 'Campus' : label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
