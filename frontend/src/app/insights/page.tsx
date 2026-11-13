'use client';

import { useEffect, useState } from 'react';
import { Activity, CalendarDays, FolderKanban, Users, Network, ShieldAlert } from 'lucide-react';
import { getAnalyticsSummary } from '@/lib/api';

type Summary = {
  period_days: number;
  generated_at: string;
  active_students_24h: number;
  active_students_7d: number;
  tracked_events: number;
  cross_campus_interactions: number;
  projects_created: number;
  events_created: number;
  public_communities: number;
  event_rsvps: number;
  searches: number;
  search_to_profile_open_rate: number | null;
  average_feed_load_ms: number | null;
  feed_load_samples: number;
  top_interests: { topic: string; students: number }[];
  active_communities: { id: string; name: string; posts_in_period: number }[];
  minimum_cohort_size: number;
  measurement_note: string;
};

export default function InsightsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalyticsSummary(30).then(setSummary).catch((reason) => {
      setError(reason?.status === 403 ? 'This dashboard is restricted to CommonGround moderators.' : 'Analytics are temporarily unavailable.');
    }).finally(() => setLoading(false));
  }, []);

  const metrics = summary ? [
    { label: 'Tracked active students · 24h', value: summary.active_students_24h, icon: Users },
    { label: 'Tracked active students · 7d', value: summary.active_students_7d, icon: Activity },
    { label: 'Cross-campus collaborations', value: summary.cross_campus_interactions, icon: Network },
    { label: 'Projects created · 30d', value: summary.projects_created, icon: FolderKanban },
    { label: 'Events created · 30d', value: summary.events_created, icon: CalendarDays },
    { label: 'Public communities', value: summary.public_communities, icon: Users },
    { label: 'Event registrations · 30d', value: summary.event_rsvps, icon: CalendarDays },
    { label: 'Searches · 30d', value: summary.searches, icon: Activity },
  ] : [];

  return <div className="cg-page space-y-8">
    <header><p className="cg-eyebrow">MODERATOR TOOLING</p><h1 className="mt-2 text-4xl font-semibold">Campus Intelligence</h1><p className="mt-2 max-w-2xl text-sm cg-muted">Aggregated product activity. No individual student activity or private content is shown.</p></header>
    {loading && <div className="h-40 animate-pulse rounded-2xl bg-[var(--cg-elevated)]"/>}
    {error && <div role="alert" className="cg-surface flex items-center gap-3 p-5 text-sm"><ShieldAlert className="text-[var(--cg-danger)]"/>{error}</div>}
    {summary && <>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{metrics.map(({label,value,icon:Icon})=><article key={label} className="cg-surface p-5"><div className="flex items-center justify-between gap-3"><p className="text-sm cg-muted">{label}</p><Icon size={18} className="text-[var(--cg-accent)]"/></div><p className="mt-4 text-3xl font-semibold tabular-nums">{value.toLocaleString()}</p></article>)}</section>
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="cg-surface p-5"><h2 className="font-semibold">Discovery quality</h2><p className="mt-3 text-3xl font-semibold tabular-nums">{summary.search_to_profile_open_rate === null ? '—' : `${summary.search_to_profile_open_rate}%`}</p><p className="mt-1 text-sm cg-muted">Search users who also opened a profile during this period. This is overlap, not proof of causation.</p></article>
        <article className="cg-surface p-5"><h2 className="font-semibold">Feed response</h2><p className="mt-3 text-3xl font-semibold tabular-nums">{summary.average_feed_load_ms === null ? '—' : `${summary.average_feed_load_ms.toLocaleString()} ms`}</p><p className="mt-1 text-sm cg-muted">Average browser-reported feed load across {summary.feed_load_samples.toLocaleString()} samples.</p></article>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="cg-surface p-5"><h2 className="font-semibold">Shared interests</h2><p className="mt-1 text-xs cg-muted">Only topics shared by at least {summary.minimum_cohort_size} public profiles are shown.</p>{summary.top_interests.length ? <ul className="mt-4 space-y-3">{summary.top_interests.map((item)=><li key={item.topic} className="flex items-center justify-between gap-4 text-sm"><span>{item.topic}</span><span className="tabular-nums cg-muted">{item.students} students</span></li>)}</ul> : <p className="mt-4 text-sm cg-muted">Not enough public profile data yet.</p>}</article>
        <article className="cg-surface p-5"><h2 className="font-semibold">Active public communities</h2><p className="mt-1 text-xs cg-muted">Communities with at least {summary.minimum_cohort_size} visible posts in this period.</p>{summary.active_communities.length ? <ul className="mt-4 space-y-3">{summary.active_communities.map((item)=><li key={item.id} className="flex items-center justify-between gap-4 text-sm"><span>{item.name}</span><span className="tabular-nums cg-muted">{item.posts_in_period} posts</span></li>)}</ul> : <p className="mt-4 text-sm cg-muted">No communities meet the reporting threshold yet.</p>}</article>
      </section>
      <section className="cg-surface p-5"><h2 className="font-semibold">Measurement notes</h2><p className="mt-2 text-sm leading-6 cg-muted">{summary.measurement_note}</p><p className="mt-3 text-xs cg-muted">Last generated: {new Date(summary.generated_at).toLocaleString()}</p></section>
    </>}
  </div>;
}
