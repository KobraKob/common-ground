'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, Moon, Search, Sun, X } from 'lucide-react';
import { clearAuthSession, getActiveProfile, isAuthenticated, unifiedSearch } from '@/lib/api';

const publicLinks = [
  { href: '/city', label: 'City' },
  { href: '/campuses', label: 'Campuses' },
  { href: '/commons', label: 'Q&A' },
  { href: '/build', label: 'Build' },
];

export function GlobalHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const isAuth = ['/login', '/signup', '/onboarding'].some((path) => pathname.startsWith(path));
  const isMarketing = pathname === '/' || ['/about', '/privacy', '/terms'].some((path) => pathname.startsWith(path));
  const privatePages = ['/messages', '/profile', '/passport', '/moderation', '/insights', '/performance'];
  const showPublicNav = !isAuth && !privatePages.some((path) => pathname.startsWith(path));
  const showSearch = isLoggedIn && !isAuth && !isMarketing;

  useEffect(() => {
    const loggedIn = isAuthenticated();
    setIsLoggedIn(loggedIn);
    const profile = getActiveProfile();
    setProfileName(profile?.display_name || 'Profile');
    const savedTheme = localStorage.getItem('cg-theme');
    const systemLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const nextTheme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : systemLight ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, [pathname]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await unifiedSearch(query, controller.signal);
        if (!controller.signal.aborted) setSearchResults(results);
      } catch {
        if (!controller.signal.aborted) setSearchResults(null);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      } else if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName || '')) {
        event.preventDefault();
        searchInputRef.current?.focus();
      } else if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('cg-theme', nextTheme);
  }

  function signOut() {
    clearAuthSession();
    setIsLoggedIn(false);
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-50 h-[52px] border-b border-[var(--separator)] bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1080px] items-center justify-between gap-3 px-4">
        <Link href="/" className="flex min-h-[44px] shrink-0 items-center gap-2" aria-label="CommonGround home">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--surface-2)] text-sm font-semibold tracking-tight">CG</span>
          <span className="text-[17px] font-semibold tracking-tight">CommonGround</span>
        </Link>

        {showPublicNav && <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          {publicLinks.map((item) => <Link key={item.href} href={item.href} className="min-h-[44px] flex items-center text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]">{item.label}</Link>)}
        </nav>}

        {showSearch && <div className="relative hidden max-w-md flex-1 md:block">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input ref={searchInputRef} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search students, posts and projects" aria-label="Search CommonGround" className="celestial-input h-10 w-full pl-9 pr-12 text-sm" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[var(--text-muted)]">⌘K</span>
          {searchQuery.trim().length >= 2 && <div className="absolute left-0 right-0 top-12 z-50 rounded-xl bg-[var(--surface)] p-3 shadow-2xl">
            <p className="text-xs text-[var(--text-muted)]">{isSearching ? 'Searching…' : searchResults ? 'Search results are ready' : 'No results to show'}</p>
            {searchResults && <div className="mt-2 grid gap-1 text-sm">
              <span>{searchResults.students?.length || 0} students</span>
              <span>{searchResults.communities?.length || 0} communities</span>
              <span>{searchResults.commons_posts?.length || 0} posts</span>
              <span>{searchResults.resources?.length || 0} resources</span>
            </div>}
          </div>}
        </div>}

        <div className="flex shrink-0 items-center gap-1">
          <button onClick={toggleTheme} className="grid h-11 w-11 place-items-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface)]" aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
          {!isAuth && !isLoggedIn && <>
            <Link href="/login" className="hidden min-h-[44px] items-center px-3 text-sm text-[var(--text-secondary)] sm:inline-flex">Sign in</Link>
            <Link href="/signup" className="btn-primary min-h-[36px] px-4 text-sm">Join</Link>
          </>}
          {isMarketing && isLoggedIn && <Link href="/profile" className="hidden min-h-[44px] items-center px-3 text-sm text-[var(--text-secondary)] sm:inline-flex">{profileName}</Link>}
          {showSearch && <button onClick={() => searchInputRef.current?.focus()} className="grid h-11 w-11 place-items-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface)] md:hidden" aria-label="Open search"><Search size={19} /></button>}
          {isLoggedIn && !isMarketing && <button onClick={signOut} className="hidden h-10 items-center gap-2 rounded-full px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface)] md:flex"><LogOut size={16} /> Sign out</button>}
          {showPublicNav && <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="grid h-11 w-11 place-items-center rounded-full md:hidden" aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}>{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>}
        </div>
      </div>

      {mobileMenuOpen && <nav className="fixed inset-0 top-[52px] z-50 flex h-[calc(100dvh-52px)] flex-col gap-1 bg-[var(--bg)] px-6 py-8 md:hidden" aria-label="Mobile navigation">
        {publicLinks.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className="flex min-h-[60px] items-center border-b border-[var(--separator)] text-2xl font-semibold">{item.label}</Link>)}
        {isLoggedIn ? <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="flex min-h-[60px] items-center border-b border-[var(--separator)] text-2xl font-semibold">Profile</Link> : <>
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex min-h-[60px] items-center border-b border-[var(--separator)] text-2xl font-semibold">Sign in</Link>
          <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="btn-primary mt-6">Join free</Link>
        </>}
      </nav>}
    </header>
  );
}
