'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Moon, 
  Sun, 
  X, 
  LogOut, 
  LogIn, 
  UserPlus,
  Compass,
  Building2,
  BookOpen,
  Hammer,
  Map
} from 'lucide-react';
import { 
  unifiedSearch, 
  getActiveProfile, 
  clearAuthSession,
  isAuthenticated,
  trackAnalyticsEvent
} from '@/lib/api';
import { TrustBadge } from './TrustBadge';

export function GlobalHeader() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
    const savedTheme = localStorage.getItem('cg-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
      document.documentElement.dataset.theme = savedTheme;
    } else {
      setTheme('system');
      delete document.documentElement.dataset.theme;
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setTheme(nextTheme);
    if (nextTheme === 'system') {
      localStorage.removeItem('cg-theme');
      delete document.documentElement.dataset.theme;
    } else {
      localStorage.setItem('cg-theme', nextTheme);
      document.documentElement.dataset.theme = nextTheme;
    }
  };

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    if (val.trim().length < 2) {
      setSearchResults(null);
      setIsSearching(false);
    } else {
      setIsSearching(true);
    }
  };

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const results = await unifiedSearch(query, controller.signal);
        if (!controller.signal.aborted) setSearchResults(results);
      } catch (error) {
        if (!controller.signal.aborted) {
          setSearchResults(null);
        }
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
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (window.matchMedia('(max-width: 767px)').matches) {
          setIsMobileSearchOpen(true);
          window.setTimeout(() => mobileSearchInputRef.current?.focus(), 0);
        } else {
          searchInputRef.current?.focus();
        }
      }
      if (event.key === 'Escape') {
        setSearchResults(null);
        setIsMobileSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  const handleSignOut = () => {
    clearAuthSession();
    setIsLoggedIn(false);
    router.push('/');
    router.refresh();
  };

  const currentProfile = getActiveProfile();

  return (
    <header className="cg-header sticky top-0 z-40 w-full border-b border-[var(--cg-border)] bg-[var(--cg-bg)]/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* Minimal Geometric Node Logo */}
            <div className="w-9 h-9 rounded-xl bg-[var(--cg-elevated)] border border-[var(--cg-border)] flex items-center justify-center text-[var(--cg-accent)] transition-colors">
              <span className="font-display font-bold text-xs tracking-wider text-[var(--cg-accent)]">CG</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display text-base sm:text-lg font-bold tracking-tight text-[var(--cg-text)] group-hover:text-[var(--cg-accent)] transition-colors">
                  Common<span className="text-[var(--cg-accent)]">Ground</span>
                </span>
                
              </div>
              
            </div>
          </Link>
        </div>

        {!isLoggedIn && <nav aria-label="Public navigation" className="hidden lg:flex items-center gap-1">
          {[
            { href: '/city', label: 'City', icon: Compass },
            { href: '/campus', label: 'Campuses', icon: Building2 },
            { href: '/commons', label: 'Q&A', icon: BookOpen },
            { href: '/build', label: 'Build', icon: Hammer },
            { href: '/discover', label: 'Discover', icon: Map },
          ].map(({href,label,icon:Icon}) => <Link key={href} href={href} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-[var(--cg-muted)] hover:bg-[var(--cg-elevated)] hover:text-[var(--cg-text)]"><Icon size={15}/>{label}</Link>)}
        </nav>}
        {/* Global Search Bar (Jakob's Law & Fitts's Law) */}
        <div className="flex-1 max-w-md relative hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="search"
              aria-label="Search CommonGround"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search peers, courses, notes, hackathons..."
              className="celestial-input w-full text-sm py-2 pl-9 pr-12 placeholder:text-[var(--cg-muted)]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-400">
              Ctrl K / ⌘ K
            </span>
          </div>

          {/* Search Results Dropdown */}
          {searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 celestial-card p-3 shadow-xl max-h-96 overflow-y-auto z-50 animate-entrance">
              {searchResults.students?.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300 mb-1.5 font-semibold">
                    Students
                  </div>
                  <div className="space-y-1">
                    {searchResults.students.map((s: any) => (
                      <Link
                        key={s.id || s.user_id}
                        href={'/students/' + encodeURIComponent(s.handle)}
                        onClick={() => { void trackAnalyticsEvent('profile_opened', 'search'); setSearchResults(null); }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 text-xs font-mono transition-colors"
                      >
                        <span className="font-semibold text-white">
                          {s.name || s.display_name}{' '}
                          <span className="text-slate-500">(@{s.handle})</span>
                        </span>
                        <TrustBadge stage={s.stage || s.verification_stage} size="sm" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.commons_posts?.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300 mb-1.5 font-semibold">
                    Course Q&A & Notes
                  </div>
                  <div className="space-y-1">
                    {searchResults.commons_posts.map((p: any) => (
                      <Link
                        key={p.id}
                        href="/commons"
                        onClick={() => setSearchResults(null)}
                        className="block p-2 rounded-lg hover:bg-white/5 text-xs font-mono text-slate-300 hover:text-amber-300 truncate transition-colors"
                      >
                        {p.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.communities?.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300 mb-1.5 font-semibold">
                    Campus Communities
                  </div>
                  <div className="space-y-1">
                    {searchResults.communities.map((c: any) => (
                      <Link
                        key={c.id}
                        href="/messages"
                        onClick={() => setSearchResults(null)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 text-xs font-mono transition-colors"
                      >
                        <span className="text-white font-medium">{c.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">{c.member_count} members</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {!searchResults.students?.length && !searchResults.commons_posts?.length && !searchResults.communities?.length && (
                <div className="p-3 text-center text-xs font-mono text-slate-400">
                  No matching students, notes, or groups found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {!isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/15 bg-white/5 hover:border-amber-400/50 text-xs font-mono text-slate-300 hover:text-white transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>

              <Link
                href="/signup"
                className="btn-campus-amber text-xs font-mono px-4 py-1.5 flex items-center gap-1 font-bold shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Join Free</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-white/15 bg-white/5 hover:border-amber-400/50 transition-all"
                title="My Profile"
              >
                <div className="w-6 h-6 rounded-full bg-amber-400 text-[#0A0C12] flex items-center justify-center font-mono font-bold text-[11px] shadow-sm">
                  {currentProfile?.display_name ? currentProfile.display_name.charAt(0) : 'U'}
                </div>
                <span className="text-xs font-mono font-medium hidden sm:inline text-white">
                  @{currentProfile?.handle || 'me'}
                </span>
              </Link>

              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-full text-slate-400 hover:text-rose-400 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Mobile Search Button */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden p-2 rounded-full border border-white/15 bg-white/5 text-slate-300 hover:text-white transition-all"
            title="Search"
          >
            {isMobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="min-h-11 min-w-11 rounded-full border border-[var(--cg-border)] bg-[var(--cg-elevated)] text-[var(--cg-muted)] transition-colors hover:text-[var(--cg-text)]"
            title={`Appearance: ${theme}. Click to cycle system, light and dark.`}
            aria-label={`Appearance: ${theme}. Change theme`}
          >
            {theme === 'light' ? <Sun className="mx-auto h-4 w-4" /> : <Moon className="mx-auto h-4 w-4" />}
          </button>
        </div>
      </div>

      {!isLoggedIn && <nav aria-label="Public navigation" className="flex items-center gap-1 overflow-x-auto border-t border-[var(--cg-border)] px-3 py-1.5 lg:hidden">
        {[['/city','City'],['/campus','Campuses'],['/commons','Q&A'],['/build','Build'],['/discover','Discover']].map(([href,label])=><Link key={href} href={href} className="min-h-10 shrink-0 rounded-full px-3 py-2 text-xs font-medium text-[var(--cg-muted)] hover:bg-[var(--cg-elevated)]">{label}</Link>)}
      </nav>}
      {/* Expandable Mobile Search Drawer */}
      {isMobileSearchOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-3 bg-[#0A0C12]/95 backdrop-blur-2xl">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={mobileSearchInputRef}
              type="search"
              aria-label="Search CommonGround"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search peers, courses, notes..."
              className="celestial-input w-full text-sm py-2 pl-9 pr-4 placeholder:text-[var(--cg-muted)]"
            />
          </div>

          {searchResults && (
            <div className="mt-2 celestial-card p-3 shadow-xl max-h-72 overflow-y-auto">
              {searchResults.students?.length > 0 && (
                <div className="mb-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300 mb-1 font-semibold">
                    Students
                  </div>
                  {searchResults.students.map((s: any) => (
                    <Link
                      key={s.id || s.user_id}
                      href="/profile"
                      onClick={() => {
                        setSearchResults(null);
                        setIsMobileSearchOpen(false);
                      }}
                      className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/5 text-xs font-mono"
                    >
                      <span>{s.name || s.display_name}</span>
                      <TrustBadge stage={s.stage || s.verification_stage} size="sm" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
