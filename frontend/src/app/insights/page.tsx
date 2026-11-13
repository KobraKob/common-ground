'use client';

import { useAdminAnalyticsQuery } from '@/lib/queries';

const metricCards = [
  { key: 'daily_active_students', label: 'Daily active students', description: 'Unique students active in the last 24 hours.' },
  { key: 'weekly_active_students', label: 'Weekly active students', description: 'Unique students active in the last seven days.' },
  { key: 'posts_created_30d', label: 'Posts created', description: 'Posts shared in the last 30 days.' },
  { key: 'projects_created_30d', label: 'Projects created', description: 'Projects started in the last 30 days.' },
  { key: 'events_created_30d', label: 'Events created', description: 'Events published in the last 30 days.' },
  { key: 'event_rsvps_30d', label: 'Event RSVPs', description: 'Event registrations in the last 30 days.' },
  { key: 'cross_campus_connections_30d', label: 'Cross-campus connections', description: 'Accepted project collaborations between different colleges.' },
  { key: 'weekly_retention_pct', label: 'Week-over-week return rate', description: 'Share of last week’s active students who returned this week.' },
  { key: 'search_to_connection_rate_pct', label: 'Search-to-connection rate', description: 'Same-user search followed by a collaboration action in the 30-day window.' },
  { key: 'active_interest_communities_30d', label: 'Active interest communities', description: 'Communities with new member activity in the last 30 days.' },
  { key: 'upcoming_events', label: 'Upcoming events', description: 'Events with a future start time.' },
];

export default function InsightsPage() {
  const query = useAdminAnalyticsQuery();
  if (query.isLoading) return <div className="mx-auto max-w-5xl space-y-4"><div className="skeleton-shimmer h-20" /><div className="grid gap-3 md:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-shimmer h-28" />)}</div></div>;
  if (query.error || !query.data) return <div className="mx-auto max-w-xl rounded-2xl bg-[var(--surface)] p-7"><h1 className="text-2xl font-semibold">Insights unavailable</h1><p className="mt-2 text-sm">This dashboard is limited to platform moderators and administrators.</p></div>;
  return <div className="mx-auto max-w-5xl space-y-8">
    <header><p className="text-sm font-semibold text-[var(--accent)]">Platform insights</p><h1 className="mt-2 text-3xl font-semibold">How the network is growing.</h1><p className="mt-2 max-w-2xl text-sm">Aggregated activity only. Counts below five are suppressed to protect small groups. Tracking begins when these event hooks are deployed.</p></header>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{metricCards.map((metric) => { const value = query.data[metric.key]; return <article key={metric.key} className="rounded-2xl bg-[var(--surface)] p-5"><p className="text-sm text-[var(--text-secondary)]">{metric.label}</p><p className="mt-3 text-3xl font-semibold tabular-nums">{value === null || value === undefined ? '—' : `${value.toLocaleString()}${metric.key.endsWith('_pct') ? '%' : ''}`}</p><p className="mt-2 text-xs text-[var(--text-muted)]">{value === null || value === undefined ? 'Not enough activity to display.' : metric.description}</p></article>; })}</div>
    {query.data.campus_activity?.length > 0 && <section className="space-y-3"><h2 className="text-xl font-semibold">Campus activity</h2><div className="overflow-x-auto rounded-2xl bg-[var(--surface)]"><table className="w-full text-left text-sm"><thead><tr className="border-b border-[var(--separator)] text-[var(--text-muted)]"><th className="p-4">Campus</th><th className="p-4">Posts</th><th className="p-4">Projects</th><th className="p-4">Events</th></tr></thead><tbody>{query.data.campus_activity.map((campus: any) => <tr key={campus.college} className="border-b border-[var(--separator)] last:border-0"><td className="p-4 font-medium">{campus.college}</td><td className="p-4 tabular-nums">{campus.posts ?? '—'}</td><td className="p-4 tabular-nums">{campus.projects ?? '—'}</td><td className="p-4 tabular-nums">{campus.events ?? '—'}</td></tr>)}</tbody></table></div></section>}
    <p className="text-xs text-[var(--text-muted)]">Generated {new Date(query.data.generated_at).toLocaleString()} · {query.data.window} window</p><p className="text-xs text-[var(--text-muted)]">{query.data.note}</p>
  </div>;
}
