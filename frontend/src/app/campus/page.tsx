'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, MessageSquare, Users } from 'lucide-react';
import { BENGALURU_COLLEGES } from '@/constants/colleges';
import { getCampusOverview, getPostsPaginated } from '@/lib/api';
import type { Post } from '@/types';

type CampusTab = 'feed' | 'qa' | 'teams';

export default function CampusPage({ initialSlug = 'rvce' }: { initialSlug?: string }) {
  const [selectedSlug, setSelectedSlug] = useState(initialSlug);
  const [tab, setTab] = useState<CampusTab>('feed');
  const [overview, setOverview] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const college = useMemo(() => BENGALURU_COLLEGES.find((item) => item.slug === selectedSlug) || BENGALURU_COLLEGES[0], [selectedSlug]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      getCampusOverview(selectedSlug),
      getPostsPaginated({ scope: 'campus', collegeId: college.id, limit: 20, offset: 0 }),
    ]).then(([campusData, postPage]) => {
      if (!active) return;
      setOverview(campusData);
      setPosts(postPage.items || []);
    }).catch(() => {
      if (!active) return;
      setOverview({ college, student_created_communities: [], official_spaces: [], pinned_announcements: [], upcoming_events: [] });
      setPosts([]);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedSlug, college]);

  const questions = posts.filter((post) => post.category === 'QUESTION_QA');
  const feedPosts = posts.filter((post) => post.category !== 'QUESTION_QA');
  const teams = overview?.student_created_communities || [];

  return <div className="mx-auto max-w-5xl space-y-7">
    <header className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-[var(--accent)]">Campus</p><h1 className="mt-2 text-3xl font-semibold">{college.name}</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">{college.city} · Campus community</p></div><div className="flex flex-wrap gap-2"><Link href="/build" className="text-link">Find a team <ArrowRight size={15} /></Link><Link href="/events" className="text-link"><CalendarDays size={15} /> Events</Link></div></div>
      <label className="block max-w-sm text-sm text-[var(--text-secondary)]">Choose a campus<select value={selectedSlug} onChange={(event) => setSelectedSlug(event.target.value)} className="celestial-input mt-1 w-full">{BENGALURU_COLLEGES.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>
    </header>

    <nav className="flex gap-2 border-b border-[var(--separator)]" aria-label="Campus sections">
      {([{ key: 'feed', label: 'Feed' }, { key: 'qa', label: 'Q&A' }, { key: 'teams', label: 'Teams' }] as const).map((item) => <button key={item.key} onClick={() => setTab(item.key)} aria-pressed={tab === item.key} className={`min-h-11 border-b-2 px-4 text-sm ${tab === item.key ? 'border-[var(--accent)] text-[var(--text)]' : 'border-transparent text-[var(--text-secondary)]'}`}>{item.label}</button>)}
    </nav>

    {loading ? <div className="space-y-3"><div className="skeleton-shimmer h-28" /><div className="skeleton-shimmer h-28" /></div> : <>
      {tab === 'feed' && (feedPosts.length === 0 ? <div className="rounded-2xl bg-[var(--surface)] p-8 text-center"><MessageSquare size={26} className="mx-auto mb-3 text-[var(--text-muted)]" /><h2 className="text-xl font-semibold">Nothing here yet</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">Be the first to share something with this campus.</p><Link href="/city" className="text-link mt-4">Open City <ArrowRight size={15} /></Link></div> : <div className="space-y-3">{feedPosts.map((post) => <article key={post.id} className="rounded-2xl bg-[var(--surface)] p-5"><p className="text-sm font-semibold">{post.title || 'Campus post'}</p><p className="mt-2 text-sm text-[var(--text-secondary)]">{post.body}</p><p className="mt-3 text-xs text-[var(--text-muted)]">{post.author_name || 'Student'} · {new Date(post.created_at).toLocaleDateString()}</p></article>)}</div>)}
      {tab === 'qa' && (questions.length === 0 ? <div className="rounded-2xl bg-[var(--surface)] p-8 text-center"><h2 className="text-xl font-semibold">No campus questions yet</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">Ask a question or help someone with an answer.</p><Link href="/commons" className="text-link mt-4">Open Q&A <ArrowRight size={15} /></Link></div> : <div className="space-y-3">{questions.map((post) => <article key={post.id} className="rounded-2xl bg-[var(--surface)] p-5"><p className="text-sm font-semibold">{post.title || post.body}</p><p className="mt-2 text-sm text-[var(--text-secondary)]">{post.body}</p><p className="mt-3 text-xs text-[var(--text-muted)]">{post.author_name || 'Student'} · {post.comments_count} replies</p></article>)}</div>)}
      {tab === 'teams' && (teams.length === 0 ? <div className="rounded-2xl bg-[var(--surface)] p-8 text-center"><Users size={26} className="mx-auto mb-3 text-[var(--text-muted)]" /><h2 className="text-xl font-semibold">No teams listed yet</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">Find or start a project with students across Bengaluru.</p><Link href="/build" className="text-link mt-4">Explore projects <ArrowRight size={15} /></Link></div> : <div className="grid gap-3 md:grid-cols-2">{teams.map((team: any) => <article key={team.id} className="rounded-2xl bg-[var(--surface)] p-5"><h2 className="font-semibold">{team.name}</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">{team.description}</p><p className="mt-3 text-xs text-[var(--text-muted)]">{team.member_count} members</p></article>)}</div>)}
    </>}
  </div>;
}
