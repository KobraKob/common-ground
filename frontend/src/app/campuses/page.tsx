'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Search } from 'lucide-react';
import { BENGALURU_COLLEGES } from '@/constants/colleges';

const networkNodes = [
  { slug: 'rvce', x: 130, y: 86 },
  { slug: 'pesu', x: 325, y: 52 },
  { slug: 'bmsce', x: 510, y: 102 },
  { slug: 'christ', x: 430, y: 250 },
  { slug: 'msrit', x: 210, y: 258 },
  { slug: 'iiitb', x: 575, y: 278 },
];

export default function CampusesPage() {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => BENGALURU_COLLEGES.filter((college) =>
    `${college.name} ${college.short_name}`.toLowerCase().includes(search.toLowerCase())
  ), [search]);

  return <div className="mx-auto max-w-5xl space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-semibold text-[var(--accent)]">Campuses</p><h1 className="mt-2 text-3xl font-semibold">One city. Many campuses.</h1><p className="mt-2 max-w-xl">Explore the colleges connected through CommonGround. This network view is schematic, not a geographic map.</p></div>
      <Link href="/events" className="text-link"><CalendarDays size={17} /> Explore events <ArrowRight size={15} /></Link>
    </header>
    <section className="rounded-2xl bg-[var(--surface)] p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Bengaluru campus network</h2><span className="text-xs text-[var(--text-muted)]">Schematic · Not to scale</span></div>
      <svg viewBox="0 0 700 330" role="img" aria-label="Schematic network connecting six Bengaluru colleges" className="h-auto w-full">
        <g stroke="var(--separator)" strokeWidth="2" fill="none"><path d="M130 86 L325 52 L510 102 L430 250 L210 258 Z" /><path d="M130 86 L510 102 M130 86 L430 250 M325 52 L430 250 M325 52 L575 278 M510 102 L575 278 M210 258 L575 278" strokeDasharray="5 7" /></g>
        {networkNodes.map((node) => {
          const college = BENGALURU_COLLEGES.find((item) => item.slug === node.slug);
          if (!college) return null;
          return <a key={node.slug} href={`/campus/${node.slug}`} aria-label={`Open ${college.name} campus`} className="cursor-pointer">
            <circle cx={node.x} cy={node.y} r="23" fill="var(--surface-2)" stroke="var(--accent)" strokeWidth="2" />
            <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text)">{college.short_name.slice(0, 2)}</text>
            <text x={node.x} y={node.y + 42} textAnchor="middle" fontSize="12" fill="var(--text-secondary)">{college.short_name}</text>
          </a>;
        })}
      </svg>
      <p className="mt-2 text-xs text-[var(--text-muted)]">Lines show the cross-campus network concept. They do not represent travel routes or verified partnerships. Select a campus node to open its page.</p>
    </section>
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Choose a campus</h2><div className="relative w-full max-w-xs"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search colleges" aria-label="Search colleges" className="celestial-input w-full pl-9" /></div></div>
      {filtered.length === 0 ? <p className="rounded-xl bg-[var(--surface)] p-5 text-sm">No campuses match that search.</p> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((college) => <Link key={college.id} href={`/campus/${college.slug}`} className="group flex min-h-[84px] items-center gap-3 rounded-2xl bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--surface-2)]"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] text-sm font-semibold">{college.short_name.slice(0, 2)}</span><span className="min-w-0 flex-1"><strong className="block text-sm">{college.name}</strong><span className="text-xs text-[var(--text-muted)]">{college.city}</span></span><ArrowRight size={16} className="text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent)]" /></Link>)}</div>}
    </section>
  </div>;
}
