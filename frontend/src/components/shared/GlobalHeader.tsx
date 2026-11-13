'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Moon, 
  Orbit, 
  X, 
  LogOut, 
  LogIn, 
  UserPlus
} from 'lucide-react';
import { 
  unifiedSearch, 
  getActiveProfile, 
  clearAuthSession,
  isAuthenticated
} from '@/lib/api';
import { TrustBadge } from './TrustBadge';

export function GlobalHeader() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isTwilight, setIsTwilight] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoggedIn(isAuthenticated());
      const storedAtmosphere = localStorage.getItem('cg-atmosphere');
      if (storedAtmosphere === 'twilight') {
        setIsTwilight(true);
        document.documentElement.classList.add('atmosphere-twilight');
      }
    }
  }, []);

  const toggleAtmosphere = () => {
    const nextMode = !isTwilight;
    setIsTwilight(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('atmosphere-twilight');
      localStorage.setItem('cg-atmosphere', 'twilight');
    } else {
      document.documentElement.classList.remove('atmosphere-twilight');
      localStorage.setItem('cg-atmosphere', 'midnight');
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

  const handleSignOut = () => {
    clearAuthSession();
    setIsLoggedIn(false);
    router.push('/');
    window.location.reload();
  };

  const currentProfile = getActiveProfile();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0A0C12]/85 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* Minimal Geometric Node Logo */}
            <div className="w-9 h-9 rounded-xl bg-[#161926] border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-sm transition-transform duration-150 group-hover:scale-105">
              <span className="font-display font-extrabold text-xs tracking-wider text-amber-300">CG</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors">
                  Common<span className="text-amber-400">Ground</span>
                </span>
                <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/25 font-mono">
                  BLR
                </span>
              </div>
              <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase hidden sm:block">
                CROSS-CAMPUS STUDENT NETWORK
              </span>
            </div>
          </Link>
        </div>

        {/* Global Search Bar (Jakob's Law & Fitts's Law) */}
        <div className="flex-1 max-w-md relative hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search peers, courses, notes, hackathons..."
              className="celestial-input w-full text-xs font-mono py-2 pl-9 pr-12 text-white placeholder:text-slate-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-400">
              ⌘K
            </span>
          </div>

          {/* Search Results Dropdown */}
          {searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 celestial-card p-3 shadow-2xl max-h-96 overflow-y-auto border border-white/15 z-50 animate-entrance">
              {searchResults.students?.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300 mb-1.5 font-semibold">
                    Students
                  </div>
                  <div className="space-y-1">
                    {searchResults.students.map((s: any) => (
                      <Link
                        key={s.id || s.user_id}
                        href="/profile"
                        onClick={() => setSearchResults(null)}
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

          {/* Atmosphere Toggle */}
          <button
            onClick={toggleAtmosphere}
            className="p-2 rounded-full border border-white/15 bg-white/5 text-amber-300 hover:border-amber-400/50 transition-all"
            title={isTwilight ? 'Switch to Deep Midnight' : 'Switch to Twilight Atmosphere'}
          >
            {isTwilight ? (
              <Orbit className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-amber-300" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Mobile Search Drawer */}
      {isMobileSearchOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-3 bg-[#0A0C12]/95 backdrop-blur-2xl">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search peers, courses, notes..."
              className="celestial-input w-full text-xs font-mono py-2 pl-9 pr-4 text-white"
            />
          </div>

          {searchResults && (
            <div className="mt-2 celestial-card p-3 shadow-2xl max-h-72 overflow-y-auto border border-white/15">
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
