'use client';

import { useAdminPerformanceMetricsQuery } from '@/lib/queries';

export default function PerformancePage() {
  const query = useAdminPerformanceMetricsQuery();
  if (query.isLoading) return <div className="mx-auto max-w-5xl space-y-3"><div className="skeleton-shimmer h-24" /><div className="skeleton-shimmer h-48" /></div>;
  if (query.error || !query.data) return <div className="mx-auto max-w-xl rounded-2xl bg-[var(--surface)] p-7"><h1 className="text-2xl font-semibold">Performance metrics unavailable</h1><p className="mt-2 text-sm">This dashboard is limited to platform moderators and administrators.</p></div>;
  const metrics = query.data;
  return <div className="mx-auto max-w-5xl space-y-8">
    <header><p className="text-sm font-semibold text-[var(--accent)]">Performance</p><h1 className="mt-2 text-3xl font-semibold">Service health at a glance.</h1><p className="mt-2 text-sm">Process-local request metrics. Data resets when the API process restarts and is not a substitute for persistent observability.</p></header>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Requests', metrics.total_requests], ['Errors', metrics.total_errors], ['Error rate', `${metrics.error_rate_pct}%`], ['Slow requests', metrics.slow_requests_count]].map(([label, value]) => <article key={String(label)} className="rounded-2xl bg-[var(--surface)] p-5"><p className="text-sm text-[var(--text-secondary)]">{label}</p><p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p></article>)}</section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Slowest routes</h2>{(metrics.bottlenecks || []).length === 0 ? <p className="rounded-xl bg-[var(--surface)] p-5 text-sm">No route latency samples yet.</p> : <div className="overflow-x-auto rounded-2xl bg-[var(--surface)]"><table className="w-full text-left text-sm"><thead><tr className="border-b border-[var(--separator)] text-[var(--text-muted)]"><th className="p-4">Route</th><th className="p-4">Calls</th><th className="p-4">Average</th><th className="p-4">P95</th><th className="p-4">Errors</th></tr></thead><tbody>{metrics.bottlenecks.map((route: any) => <tr key={route.route} className="border-b border-[var(--separator)] last:border-0"><td className="p-4 font-mono text-xs">{route.route}</td><td className="p-4 tabular-nums">{route.calls}</td><td className="p-4 tabular-nums">{route.avg_ms} ms</td><td className="p-4 tabular-nums">{route.p95_ms} ms</td><td className="p-4 tabular-nums">{route.errors}</td></tr>)}</tbody></table></div>}</section>
    <p className="text-xs text-[var(--text-muted)]">Auto-refreshes every 30 seconds · Uptime {metrics.uptime_seconds}s</p>
  </div>;
}
