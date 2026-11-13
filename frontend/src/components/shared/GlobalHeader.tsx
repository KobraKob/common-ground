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
    <header className="sticky top-0 z-40 w-full border-b border-purple-500/20 bg-[#090420]/80 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* Glowing Logo Icon */}
            <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-br from-[#2E1065] to-[#120836] border border-amber-400/40 flex items-center justify-center text-[#FBBF24] shadow-[0_0_15px_rgba(251,191,36,0.35)] transition-transform group-hover:scale-105">
              <span className="font-display font-extrabold text-sm text-[#FBBF24]">CG</span>
              <span className="absolute -top-1 -right-1 text-[10px] text-[#FDE68A] animate-pulse">✦</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-lg font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors">
                  Common<em className="text-amber-300 not-italic">Ground</em>
                </span>
                <span className="hidden sm:inline-block neo-badge text-[9px] px-1.5 py-0.2 bg-amber-400/10 text-[#FDE68A] border-amber-400/30">
                  BLR
                </span>
              </div>
              <span className="text-[9px] font-mono tracking-widest text-[#7C6FA6] uppercase hidden sm:block">
                CROSS-CAMPUS STUDENT NETWORK
              </span>
            </div>
          </Link>
        </div>

        {/* Global Search Bar (Deference: Content-focused, clean keyboard-friendly input) */}
        <div className="flex-1 max-w-md relative hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search peers, courses, notes, hackathons..."
              className="celestial-input w-full text-xs font-mono py-2 pl-9 pr-12 text-[#F8F7FF] placeholder:text-[#7C6FA6]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-purple-950/80 border border-purple-400/30 px-1.5 py-0.5 rounded text-[#C4B5FD]">
              ⌘K
            </span>
          </div>

          {/* Search Results Dropdown */}
          {searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 celestial-card p-3 shadow-2xl max-h-96 overflow-y-auto border border-purple-400/30 z-50">
              {searchResults.students?.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#FBBF24] mb-1.5 flex items-center gap-1.5">
                    <span>✦ Students</span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.students.map((s: any) => (
                      <Link
                        key={s.id || s.user_id}
                        href="/profile"
                        onClick={() => setSearchResults(null)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-purple-900/30 text-xs font-mono transition-colors"
                      >
                        <span className="font-semibold text-[#F8F7FF]">
                          {s.name || s.display_name}{' '}
                          <span className="text-[#7C6FA6]">(@{s.handle})</span>
                        </span>
                        <TrustBadge stage={s.stage || s.verification_stage} size="sm" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.commons_posts?.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#A855F7] mb-1.5 flex items-center gap-1.5">
                    <span>✦ Course Q&A & Notes</span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.commons_posts.map((p: any) => (
                      <Link
                        key={p.id}
                        href="/commons"
                        onClick={() => setSearchResults(null)}
                        className="block p-2 rounded-xl hover:bg-purple-900/30 text-xs font-mono text-[#C4B5FD] hover:text-[#FDE68A] truncate transition-colors"
                      >
                        {p.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.communities?.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#38BDF8] mb-1.5 flex items-center gap-1.5">
                    <span>✦ Campus Communities</span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.communities.map((c: any) => (
                      <Link
                        key={c.id}
                        href="/messages"
                        onClick={() => setSearchResults(null)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-purple-900/30 text-xs font-mono transition-colors"
                      >
                        <span className="text-[#F8F7FF] font-medium">{c.name}</span>
                        <span className="text-[10px] font-mono text-[#7C6FA6]">{c.member_count} members</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {!searchResults.students?.length && !searchResults.commons_posts?.length && !searchResults.communities?.length && (
                <div className="p-3 text-center text-xs font-mono text-[#7C6FA6]">
                  No matching students, notes, or groups found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* Guest or Authenticated State */}
          {!isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-400/30 bg-[#120836]/70 hover:border-amber-400/50 text-xs font-mono text-[#C4B5FD] hover:text-[#FDE68A] transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>

              <Link
                href="/signup"
                className="btn-campus-amber text-xs font-mono px-3.5 py-1.5 flex items-center gap-1 font-bold shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Join Free</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-purple-400/30 bg-[#120836]/70 hover:border-amber-400/50 transition-all"
                title="My Profile"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[#090420] flex items-center justify-center font-mono font-bold text-[11px] shadow-sm">
                  {currentProfile?.display_name ? currentProfile.display_name.charAt(0) : 'U'}
                </div>
                <span className="text-xs font-mono font-medium hidden sm:inline text-[#F8F7FF]">
                  @{currentProfile?.handle || 'me'}
                </span>
              </Link>

              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-full text-[#7C6FA6] hover:text-rose-400 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Mobile Search Button */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden p-2 rounded-full border border-purple-400/30 bg-[#120836]/70 text-[#C4B5FD] hover:text-[#FDE68A] transition-all"
            title="Search"
          >
            {isMobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          {/* Atmosphere Toggle */}
          <button
            onClick={toggleAtmosphere}
            className="p-2 rounded-full border border-purple-400/30 bg-[#120836]/70 text-[#FDE68A] hover:border-amber-400/50 hover:shadow-[0_0_12px_rgba(251,191,36,0.3)] transition-all"
            title={isTwilight ? 'Switch to Deep Midnight' : 'Switch to Twilight Atmosphere'}
          >
            {isTwilight ? (
              <Orbit className="w-4 h-4 text-[#C084FC]" />
            ) : (
              <Moon className="w-4 h-4 text-[#FBBF24]" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Mobile Search Drawer */}
      {isMobileSearchOpen && (
        <div className="md:hidden border-t border-purple-500/20 px-4 py-3 bg-[#090420]/95 backdrop-blur-2xl">
          <div className="relative">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search peers, courses, notes..."
              className="celestial-input w-full text-xs font-mono py-2 pl-9 pr-4 text-[#F8F7FF]"
            />
          </div>

          {searchResults && (
            <div className="mt-2 celestial-card p-3 shadow-2xl max-h-72 overflow-y-auto border border-purple-400/30">
              {searchResults.students?.length > 0 && (
                <div className="mb-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#FBBF24] mb-1">
                    ✦ Students
                  </div>
                  {searchResults.students.map((s: any) => (
                    <Link
                      key={s.id || s.user_id}
                      href="/profile"
                      onClick={() => {
                        setSearchResults(null);
                        setIsMobileSearchOpen(false);
                      }}
                      className="flex items-center justify-between p-1.5 rounded-lg hover:bg-purple-900/30 text-xs font-mono"
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
