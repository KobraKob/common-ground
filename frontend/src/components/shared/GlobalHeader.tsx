'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Sparkles, 
  Moon, 
  Orbit, 
  X, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Compass, 
  Building2 
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

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.trim().length >= 2) {
      setIsSearching(true);
      try {
        const results = await unifiedSearch(val);
        setSearchResults(results);
      } catch (err) {
        console.error(err);
      }
    } else {
      setSearchResults(null);
      setIsSearching(false);
    }
  };

  const handleSignOut = () => {
    clearAuthSession();
    setIsLoggedIn(false);
    router.push('/');
    window.location.reload();
  };

  const currentProfile = getActiveProfile();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-500/20 bg-[#090420]/80 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-4 shrink-0">
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
                  BLR // 2026
                </span>
              </div>
              <span className="text-[9px] font-mono tracking-widest text-[#7C6FA6] uppercase hidden sm:block">
                CROSS-CAMPUS NIGHT NETWORK
              </span>
            </div>
          </Link>

          {/* Quick Direct Nav Tabs on Desktop */}
          <nav className="hidden xl:flex items-center gap-1 pl-2">
            <Link
              href="/city"
              className="px-3 py-1.5 rounded-xl text-xs font-mono text-[#C4B5FD] hover:text-[#FDE68A] hover:bg-purple-900/30 flex items-center gap-1.5 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>City Pulse</span>
            </Link>
            <Link
              href="/campus"
              className="px-3 py-1.5 rounded-xl text-xs font-mono text-[#C4B5FD] hover:text-[#FDE68A] hover:bg-purple-900/30 flex items-center gap-1.5 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Campus Hub</span>
            </Link>
          </nav>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md relative hidden md:block">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 font-mono text-sm">
              ✦
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search cross-campus peers, study groups, Q&A, build squads..."
              className="celestial-input w-full text-xs font-mono py-2 pl-9 pr-12 text-[#F8F7FF]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-purple-950/80 border border-purple-400/30 px-1.5 py-0.5 rounded text-[#C4B5FD]">
              ⌘K
            </span>
          </div>

          {/* Search Results Dropdown */}
          {searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 celestial-card p-4 shadow-2xl max-h-96 overflow-y-auto border border-purple-400/30 z-50">
              {searchResults.students?.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#FBBF24] mb-2 flex items-center gap-1.5">
                    <span>✦ Cross-Campus Peers</span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.students.map((s: any) => (
                      <Link
                        key={s.id || s.user_id}
                        href={`/profile`}
                        onClick={() => setSearchResults(null)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-purple-900/30 text-xs font-mono transition-colors"
                      >
                        <span className="font-semibold text-[#F8F7FF]">{s.name || s.display_name} <span className="text-[#7C6FA6]">(@{s.handle})</span></span>
                        <TrustBadge stage={s.stage || s.verification_stage} size="sm" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.commons_posts?.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#A855F7] mb-2 flex items-center gap-1.5">
                    <span>✦ Vault Q&A Notes</span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.commons_posts.map((p: any) => (
                      <Link
                        key={p.id}
                        href={`/commons`}
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
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#38BDF8] mb-2 flex items-center gap-1.5">
                    <span>✦ Active Communities</span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.communities.map((c: any) => (
                      <Link
                        key={c.id}
                        href={`/messages`}
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
                <div className="p-4 text-center text-xs font-mono text-[#7C6FA6]">
                  No matching peers, notes, or communities found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Auth Controls: Either Guest (Sign In / Join Free) OR Authenticated (Profile + Sign Out) */}
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
            <div className="flex items-center gap-1">
              <Link
                href="/profile"
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-purple-400/30 bg-[#120836]/70 hover:border-amber-400/50 hover:shadow-[0_0_12px_rgba(251,191,36,0.25)] transition-all"
                title="My student profile"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[#090420] flex items-center justify-center font-mono font-bold text-[11px] shadow-sm">
                  {currentProfile?.display_name ? currentProfile.display_name.charAt(0) : 'U'}
                </div>
                <span className="text-xs font-mono font-medium hidden md:inline text-[#F8F7FF]">
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

          {/* Mobile Search Trigger */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden p-2 rounded-full border border-purple-400/30 bg-[#120836]/70 text-[#C4B5FD] hover:text-[#FDE68A] hover:border-amber-400/50 transition-all"
            title="Search network"
          >
            {isMobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          {/* Atmosphere Toggle */}
          <button
            onClick={toggleAtmosphere}
            className="p-2 rounded-full border border-purple-400/30 bg-[#120836]/70 text-[#FDE68A] hover:border-amber-400/50 hover:shadow-[0_0_12px_rgba(251,191,36,0.3)] transition-all"
            title={isTwilight ? 'Switch to Deep Midnight' : 'Switch to Twilight Glow'}
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
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 font-mono text-sm">
              ✦
            </span>
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search peers, notes, build squads..."
              className="celestial-input w-full text-xs font-mono py-2.5 pl-9 pr-4 text-[#F8F7FF]"
            />
          </div>

          {searchResults && (
            <div className="mt-2 celestial-card p-3 shadow-2xl max-h-80 overflow-y-auto border border-purple-400/30">
              {searchResults.students?.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#FBBF24] mb-1.5 flex items-center gap-1.5">
                    <span>✦ Cross-Campus Peers</span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.students.map((s: any) => (
                      <Link
                        key={s.id || s.user_id}
                        href="/profile"
                        onClick={() => {
                          setSearchResults(null);
                          setIsMobileSearchOpen(false);
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-purple-900/30 text-xs font-mono transition-colors"
                      >
                        <span className="font-semibold text-[#F8F7FF]">{s.name || s.display_name} (@{s.handle})</span>
                        <TrustBadge stage={s.stage || s.verification_stage} size="sm" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.commons_posts?.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#A855F7] mb-1.5 flex items-center gap-1.5">
                    <span>✦ Vault Q&A Notes</span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.commons_posts.map((p: any) => (
                      <Link
                        key={p.id}
                        href="/commons"
                        onClick={() => {
                          setSearchResults(null);
                          setIsMobileSearchOpen(false);
                        }}
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
                    <span>✦ Active Communities</span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.communities.map((c: any) => (
                      <Link
                        key={c.id}
                        href="/messages"
                        onClick={() => {
                          setSearchResults(null);
                          setIsMobileSearchOpen(false);
                        }}
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
                  No matching results found.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
