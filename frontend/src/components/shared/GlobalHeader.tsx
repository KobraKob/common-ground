'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Sun, Moon, UserCheck } from 'lucide-react';
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
    const storedDark = localStorage.getItem('theme') === 'dark';
    setIsDark(storedDark);
    document.documentElement.classList.toggle('dark', storedDark);
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    setSearchResults(null);
    setIsSearching(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await unifiedSearch(query, controller.signal);
        if (!controller.signal.aborted) setSearchResults(results);
      } catch (error) {
        if (!controller.signal.aborted) console.error('[Global Search]', error);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.classList.toggle('dark', nextDark);
    localStorage.setItem('theme', nextDark ? 'dark' : 'light');
  };

  const handlePersonaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUid = e.target.value;
    setActiveUser(newUid);
    setCurrentUserId(newUid);
    const prof = DEMO_USERS.find((u) => u.user_id === newUid);
    if (prof?.college_id) {
      const college = SEED_COLLEGES.find((item) => item.id === prof.college_id);
      if (college) setSelectedCollegeSlug(college.slug);
    }
    window.location.reload();
  };

  const currentProfile = DEMO_USERS.find((u) => u.user_id === currentUserId) || DEMO_USERS[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#CCCFFA] dark:border-[#282C47] bg-[#FFFFFF]/85 dark:bg-[#0E0F1A]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
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

        <div className="flex-1 max-w-lg relative hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students, groups, Q&A notes, projects across Bengaluru..."
              aria-label="Search students, communities, and Commons"
              aria-busy={isSearching}
              autoComplete="off"
              className="w-full text-xs font-mono py-2 pl-9 pr-4 rounded-full border border-[#CCCFFA] dark:border-[#282C47] bg-[#F5F6FD] dark:bg-[#151726] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-[#C5E17A]"
            />
          </div>

          {(searchResults || isSearching) && (
            <div
              className="absolute top-full left-0 right-0 mt-2 neo-card p-3 shadow-xl max-h-96 overflow-y-auto bg-white dark:bg-[#151726] border border-[#CCCFFA] dark:border-[#282C47]"
              role="region"
              aria-label="Search results"
              aria-live="polite"
            >
              {isSearching && <p className="px-2 py-3 text-xs font-mono text-gray-500">Searching CommonGround…</p>}
              {!isSearching && searchResults && (
                <>
                  {searchResults.students?.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Students</div>
                      {searchResults.students.map((student: any) => (
                        <Link
                          key={student.id || student.user_id}
                          href="/profile"
                          onClick={() => setSearchQuery('')}
                          className="flex items-center justify-between p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-mono"
                        >
                          <span className="font-semibold">{student.name || student.display_name} (@{student.handle})</span>
                          {student.stage && <TrustBadge stage={student.stage} size="sm" />}
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.commons_posts?.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Commons Q&A</div>
                      {searchResults.commons_posts.map((post: any) => (
                        <Link
                          key={post.id}
                          href="/commons"
                          onClick={() => setSearchQuery('')}
                          className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-mono truncate"
                        >
                          {post.title}
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.communities?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Communities</div>
                      {searchResults.communities.map((community: any) => (
                        <Link
                          key={community.id}
                          href="/messages"
                          onClick={() => setSearchQuery('')}
                          className="flex items-center justify-between p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-mono"
                        >
                          <span>{community.name}</span>
                          <span className="text-[10px] text-gray-400">{community.member_count} members</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {!searchResults.students?.length && !searchResults.commons_posts?.length && !searchResults.communities?.length && (
                    <p className="px-2 py-3 text-xs font-mono text-gray-500">No matching results.</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 bg-[#F5F6FD] dark:bg-[#151726] border border-[#CCCFFA] dark:border-[#282C47] rounded-full px-2.5 py-1">
            <UserCheck className="w-3.5 h-3.5 text-[#6366F1] dark:text-[#C5E17A]" />
            <select
              value={currentUserId}
              onChange={handlePersonaChange}
              aria-label="Switch demo student"
              className="bg-transparent text-[11px] font-mono text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
            >
              <option value="aaaa0001-0000-0000-0000-000000000001" className="dark:bg-[#151726]">Aarav (RVCE • Stage 3)</option>
              <option value="aaaa0002-0000-0000-0000-000000000002" className="dark:bg-[#151726]">Diya (PESU • Stage 2)</option>
              <option value="aaaa0003-0000-0000-0000-000000000003" className="dark:bg-[#151726]">Rohan (BMSCE • Provisional)</option>
            </select>
          </div>

          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="p-2 rounded-full border border-[#CCCFFA] dark:border-[#282C47] text-gray-600 dark:text-gray-300 hover:border-[#C5E17A] transition-colors"
            title="Toggle Light / Dark Neo-Y2K Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-[#C5E17A]" /> : <Moon className="w-4 h-4" />}
          </button>

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
