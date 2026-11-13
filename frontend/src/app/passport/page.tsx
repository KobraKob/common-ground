'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, BriefcaseBusiness, Users } from 'lucide-react';
import { usePassportQuery } from '@/lib/queries';
import { TrustBadge } from '@/components/shared/TrustBadge';

export default function PassportPage() {
  const passport = usePassportQuery();
  if (passport.isLoading) return <div className="mx-auto max-w-4xl space-y-4"><div className="skeleton-shimmer h-28" /><div className="skeleton-shimmer h-36" /></div>;
  if (passport.error || !passport.data) return <div className="mx-auto max-w-xl rounded-2xl bg-[var(--surface)] p-7 text-center"><h1 className="text-2xl font-semibold">Your passport is unavailable</h1><p className="mt-2 text-sm">Sign in to view your contribution summary.</p><Link href="/login" className="btn-primary mt-5">Sign in</Link></div>;
  const { profile, stats } = passport.data;
  const initials = profile.display_name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const milestones = [
    { label: 'First contribution', complete: stats.posts_shared > 0 },
    { label: 'Joined a project team', complete: stats.projects_joined > 0 },
    { label: 'Joined an interest circle', complete: stats.circles_joined > 0 },
    { label: 'Responded to an event', complete: stats.events_joined > 0 },
  ];
  return <div className="mx-auto max-w-4xl space-y-8">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-[var(--accent)]">Student passport</p><h1 className="mt-2 text-3xl font-semibold">Your work, beyond one campus.</h1><p className="mt-2 max-w-xl">A private summary of contributions recorded on CommonGround.</p></div><Link href="/profile" className="text-link">Edit profile <ArrowUpRight size={16} /></Link></header>
    <section className="flex flex-wrap items-center gap-5 rounded-2xl bg-[var(--surface)] p-6">
      {profile.avatar_url ? <Image src={profile.avatar_url} alt="" width={76} height={76} className="h-20 w-20 rounded-full object-cover" /> : <div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--surface-2)] text-xl font-semibold">{initials}</div>}
      <div className="min-w-0 flex-1"><h2 className="text-2xl font-semibold">{profile.display_name}</h2><p className="text-sm text-[var(--text-secondary)]">@{profile.handle}{profile.college_name ? ` · ${profile.college_name}` : ''}</p>{profile.verification_stage && <div className="mt-2"><TrustBadge stage={profile.verification_stage} size="sm" interactive={false} /></div>}</div>
    </section>
    <section className="grid gap-3 sm:grid-cols-3" aria-label="Contribution summary">
      <div className="rounded-2xl bg-[var(--surface)] p-5"><BookOpen className="text-[var(--accent)]" size={21} /><p className="mt-4 text-3xl font-semibold tabular-nums">{stats.posts_shared}</p><p className="mt-1 text-sm text-[var(--text-secondary)]">Posts shared</p></div>
      <div className="rounded-2xl bg-[var(--surface)] p-5"><BriefcaseBusiness className="text-[var(--accent)]" size={21} /><p className="mt-4 text-3xl font-semibold tabular-nums">{stats.projects_joined}</p><p className="mt-1 text-sm text-[var(--text-secondary)]">Projects joined</p></div>
      <div className="rounded-2xl bg-[var(--surface)] p-5"><Users className="text-[var(--accent)]" size={21} /><p className="mt-4 text-3xl font-semibold tabular-nums">{stats.circles_joined}</p><p className="mt-1 text-sm text-[var(--text-secondary)]">Interest circles</p></div>
    </section>
    <section className="rounded-2xl bg-[var(--surface)] p-6"><h2 className="text-xl font-semibold">Skills and interests</h2><div className="mt-4 flex flex-wrap gap-2">{[...(profile.skills || []), ...(profile.interests || [])].length ? [...new Set([...(profile.skills || []), ...(profile.interests || [])])].map((item) => <span key={item} className="rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-sm">{item}</span>) : <p className="text-sm">Add skills and interests to help other students find you.</p>}</div><Link href="/profile" className="text-link mt-4">Update your profile <ArrowUpRight size={16} /></Link></section>
    <section className="rounded-2xl bg-[var(--surface)] p-6"><h2 className="text-xl font-semibold">Milestones</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{milestones.map((milestone) => <div key={milestone.label} className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)] p-3"><span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${milestone.complete ? 'bg-[var(--text-secondary)]' : 'bg-[var(--text-muted)]'}`} /><span className="text-sm">{milestone.label}</span><span className="ml-auto text-xs text-[var(--text-muted)]">{milestone.complete ? 'Recorded' : 'Not yet'}</span></div>)}</div></section>
    <section className="rounded-2xl bg-[var(--surface)] p-6"><h2 className="text-xl font-semibold">Recent contributions</h2>{stats.recent_activity.length === 0 ? <p className="mt-3 text-sm text-[var(--text-secondary)]">Your contributions will appear here as you take part in the network.</p> : <ol className="mt-4 space-y-3">{stats.recent_activity.map((activity, index) => <li key={`${activity.created_at}-${index}`} className="flex items-center justify-between gap-3 border-b border-[var(--separator)] pb-3 last:border-0"><span className="text-sm">{activity.label}</span><time className="text-xs text-[var(--text-muted)]" dateTime={activity.created_at}>{new Date(activity.created_at).toLocaleDateString()}</time></li>)}</ol>}</section>
  </div>;
}
