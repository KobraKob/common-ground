'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Bell, Sun, Moon, Sparkles, Building, UserCheck } from 'lucide-react';
import { unifiedSearch, setActiveUser, getActiveUserId } from '@/lib/api';
import { DEMO_USERS, SEED_COLLEGES } from '@/lib/mockData';
import { TrustBadge } from './TrustBadge';

export function GlobalHeader() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(getActiveUserId());
  const [selectedCollegeSlug, setSelectedCollegeSlug] = useState('rvce');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedDark = localStorage.getItem('theme') === 'dark';
      setIsDark(storedDark);
      if (storedDark) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
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

  const handlePersonaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUid = e.target.value;
    setActiveUser(newUid);
    setCurrentUserId(newUid);
    const prof = DEMO_USERS.find((u) => u.user_id === newUid);
    if (prof && prof.college_id) {
      const c = SEED_COLLEGES.find((col) => col.id === prof.college_id);
      if (c) setSelectedCollegeSlug(c.slug);
    }
    // Refresh page state
    window.location.reload();
  };

  const currentProfile = DEMO_USERS.find((u) => u.user_id === currentUserId) || DEMO_USERS[0];
  const activeCollege = SEED_COLLEGES.find((c) => c.slug === selectedCollegeSlug) || SEED_COLLEGES[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#CCCFFA] dark:border-[#282C47] bg-[#FFFFFF]/85 dark:bg-[#0E0F1A]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/campus" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-[#1A1C29] dark:bg-[#C5E17A] flex items-center justify-center text-[#C5E17A] dark:text-[#0E0F1A] font-mono font-bold text-sm shadow-sm transition-transform group-hover:scale-105">
              CG
            </div>
            <div>
              <span className="neo-heading text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                Common<em>Ground</em>
              </span>
              <span className="hidden sm:inline-block ml-1.5 neo-badge text-[9px] px-1 py-0.2 bg-[#C5E17A]/20 text-[#1A1C29] dark:text-[#C5E17A] border-[#C5E17A]/40">
                BLR // '26
              </span>
            </div>
          </Link>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-lg relative hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search students, groups, Q&A notes, projects across Bengaluru..."
              className="w-full text-xs font-mono py-2 pl-9 pr-4 rounded-full border border-[#CCCFFA] dark:border-[#282C47] bg-[#F5F6FD] dark:bg-[#151726] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-[#C5E17A]"
            />
          </div>

          {/* Search Results Dropdown */}
          {searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 neo-card p-3 shadow-xl max-h-96 overflow-y-auto bg-white dark:bg-[#151726] border border-[#CCCFFA] dark:border-[#282C47]">
              {searchResults.students?.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Students</div>
                  {searchResults.students.map((s: any) => (
                    <Link
                      key={s.id}
                      href={`/profile`}
                      onClick={() => setSearchResults(null)}
                      className="flex items-center justify-between p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-mono"
                    >
                      <span className="font-semibold">{s.name} (@{s.handle})</span>
                      <TrustBadge stage={s.stage} size="sm" />
                    </Link>
                  ))}
                </div>
              )}

              {searchResults.commons_posts?.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Commons Q&A</div>
                  {searchResults.commons_posts.map((p: any) => (
                    <Link
                      key={p.id}
                      href={`/commons`}
                      onClick={() => setSearchResults(null)}
                      className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-mono truncate"
                    >
                      {p.title}
                    </Link>
                  ))}
                </div>
              )}

              {searchResults.communities?.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Communities</div>
                  {searchResults.communities.map((c: any) => (
                    <Link
                      key={c.id}
                      href={`/messages`}
                      onClick={() => setSearchResults(null)}
                      className="flex items-center justify-between p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-mono"
                    >
                      <span>{c.name}</span>
                      <span className="text-[10px] text-gray-400">{c.member_count} members</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Controls: Persona Switcher, Campus Selector, Dark Mode, Profile */}
        <div className="flex items-center gap-3">
          {/* Active Persona Switcher */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#F5F6FD] dark:bg-[#151726] border border-[#CCCFFA] dark:border-[#282C47] rounded-full px-2.5 py-1">
            <UserCheck className="w-3.5 h-3.5 text-[#6366F1] dark:text-[#C5E17A]" />
            <select
              value={currentUserId}
              onChange={handlePersonaChange}
              className="bg-transparent text-[11px] font-mono text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
            >
              <option value="aaaa0001-0000-0000-0000-000000000001" className="dark:bg-[#151726]">Aarav (RVCE • Stage 3)</option>
              <option value="aaaa0002-0000-0000-0000-000000000002" className="dark:bg-[#151726]">Diya (PESU • Stage 2)</option>
              <option value="aaaa0003-0000-0000-0000-000000000003" className="dark:bg-[#151726]">Rohan (BMSCE • Provisional)</option>
            </select>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full border border-[#CCCFFA] dark:border-[#282C47] text-gray-600 dark:text-gray-300 hover:border-[#C5E17A] transition-colors"
            title="Toggle Light / Dark Neo-Y2K Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-[#C5E17A]" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile Pill */}
          <Link
            href="/profile"
            className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-[#CCCFFA] dark:border-[#282C47] bg-[#F5F6FD] dark:bg-[#151726] hover:border-[#C5E17A] transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-[#1A1C29] text-[#C5E17A] flex items-center justify-center font-mono font-bold text-[10px]">
              {currentProfile.display_name.charAt(0)}
            </div>
            <span className="text-xs font-mono font-medium hidden sm:inline text-gray-900 dark:text-gray-100">
              @{currentProfile.handle}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
