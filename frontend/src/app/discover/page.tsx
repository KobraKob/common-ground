'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, CalendarDays, Compass, ExternalLink, Layers3, MapPin, Users } from 'lucide-react';
import { getColleges, getCommunities, getEvents, getProjects, joinCommunity, rsvpEvent } from '@/lib/api';
import type { College, Community, EventItem, ProjectItem } from '@/types';

type Section = 'campuses' | 'circles' | 'projects' | 'events';

export default function DiscoverPage() {
  const [section, setSection] = useState<Section>('campuses');
  const [colleges, setColleges] = useState<College[]>([]);
  const [circles, setCircles] = useState<Community[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let live = true;
    Promise.all([getColleges(), getCommunities(), getProjects(), getEvents()])
      .then(([campusData, circleData, projectData, eventData]) => {
        if (!live) return;
        setColleges(campusData || []);
        setCircles((circleData || []).filter((item) => item.community_type === 'CROSS_CAMPUS_INTEREST'));
        setProjects(projectData || []);
        setEvents(eventData || []);
      })
      .catch(() => { if (live) setNotice('Some discovery data could not be loaded. Try again in a moment.'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  const upcoming = useMemo(() => events.filter((event) => new Date(event.ends_at) >= new Date()), [events]);
  const tabs: { id: Section; label: string }[] = [
    { id: 'campuses', label: 'Campuses' }, { id: 'circles', label: 'Circles' },
    { id: 'projects', label: 'Projects' }, { id: 'events', label: 'Events' },
  ];

  async function joinCircle(circle: Community) {
    setBusyId(circle.id); setNotice('');
    try { await joinCommunity(circle.id); setNotice(`Joined ${circle.name}.`); }
    catch { setNotice('Could not join this circle. Sign in and try again.'); }
    finally { setBusyId(''); }
  }
  async function rsvp(event: EventItem) {
    setBusyId(event.id); setNotice('');
    try { await rsvpEvent(event.id, 'GOING'); setNotice(`Your RSVP for ${event.title} was recorded.`); }
    catch { setNotice('Could not record your RSVP. Sign in and try again.'); }
    finally { setBusyId(''); }
  }

  return (
    <div className="cg-page space-y-8">
      <header className="max-w-3xl space-y-3">
        <p className="cg-eyebrow">DISCOVER COMMON GROUND</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Find your people. Build beyond your campus.</h1>
        <p className="max-w-2xl text-base leading-7 cg-muted">Explore participating colleges, interest circles, student projects and upcoming events across Bengaluru. Listings come from the live CommonGround services.</p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-[var(--cg-border)] pb-3" role="tablist" aria-label="Discovery categories">
        {tabs.map((tab) => <button key={tab.id} role="tab" aria-selected={section === tab.id} onClick={() => setSection(tab.id)}
          className={`min-h-11 rounded-full px-4 text-sm font-medium transition-colors ${section === tab.id ? 'bg-[var(--cg-accent)] text-white' : 'bg-[var(--cg-elevated)] text-[var(--cg-muted)] hover:text-[var(--cg-text)]'}`}>{tab.label}</button>)}
      </div>

      {notice && <p role="status" className="rounded-xl border border-[var(--cg-border)] bg-[var(--cg-surface)] px-4 py-3 text-sm">{notice}</p>}
      {loading ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading discovery"><div className="h-36 animate-pulse rounded-2xl bg-[var(--cg-elevated)]"/><div className="h-36 animate-pulse rounded-2xl bg-[var(--cg-elevated)]"/><div className="h-36 animate-pulse rounded-2xl bg-[var(--cg-elevated)]"/></div> : (
        <>
          {section === 'campuses' && <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {colleges.map((campus) => <article key={campus.id} className="cg-surface p-5 space-y-4">
              <div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cg-elevated)] text-[var(--cg-accent)]"><Building2 size={20}/></span>{campus.is_official_partner && <span className="text-xs text-[var(--cg-success)]">Official partner</span>}</div>
              <div><h2 className="text-lg font-semibold">{campus.name}</h2><p className="mt-1 flex items-center gap-1 text-sm cg-muted"><MapPin size={14}/>{campus.city}, {campus.state}</p></div>
              <div className="flex gap-4 text-xs cg-muted"><span>{campus.member_count ?? '—'} students</span><span>{campus.community_count ?? '—'} communities</span></div>
              <Link className="cg-link inline-flex min-h-11 items-center text-sm font-medium" href={`/campus?college=${encodeURIComponent(campus.slug)}`}>Explore campus <ExternalLink size={14} className="ml-2"/></Link>
            </article>)}
          </section>}

          {section === 'circles' && <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {circles.map((circle) => <article key={circle.id} className="cg-surface flex flex-col p-5">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cg-elevated)] text-[var(--cg-accent)]"><Users size={20}/></span>
              <h2 className="text-lg font-semibold">{circle.name}</h2><p className="mt-2 flex-1 text-sm leading-6 cg-muted">{circle.description}</p>
              <p className="mt-4 text-xs cg-muted">{circle.member_count} members · Cross-campus circle</p>
              <button disabled={busyId === circle.id} onClick={() => joinCircle(circle)} className="mt-4 min-h-11 rounded-full bg-[var(--cg-accent)] px-4 text-sm font-semibold text-white disabled:opacity-50">{busyId === circle.id ? 'Joining…' : 'Join circle'}</button>
            </article>)}
            {circles.length === 0 && <Empty title="No public circles yet" body="Interest circles will appear here as students create them. Explore campus communities in the meantime."/>}
          </section>}

          {section === 'projects' && <section className="grid gap-3 lg:grid-cols-2">
            {projects.map((project) => <article key={project.id} className="cg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="cg-eyebrow">{project.stage.replaceAll('_',' ')}</span>{project.is_cross_campus_open && <span className="text-xs text-[var(--cg-success)]">Open across campuses</span>}</div>
              <h2 className="mt-3 text-xl font-semibold">{project.title}</h2><p className="mt-2 text-sm cg-muted">{project.pitch}</p>
              <div className="mt-4 flex flex-wrap gap-2">{project.skills_needed.slice(0,5).map((skill) => <span key={skill} className="rounded-full bg-[var(--cg-elevated)] px-3 py-1 text-xs">{skill}</span>)}</div>
              {project.open_roles.length > 0 && <p className="mt-4 text-sm"><strong>Looking for:</strong> {project.open_roles.join(', ')}</p>}
              <p className="mt-3 text-xs cg-muted">Started by {project.creator_name || 'a student'}{project.creator_college_name ? ` · ${project.creator_college_name}` : ''}</p>
              <Link href="/build" className="cg-link mt-4 inline-flex min-h-11 items-center text-sm font-medium">View collaboration space <ExternalLink size={14} className="ml-2"/></Link>
            </article>)}
            {projects.length === 0 && <Empty title="No projects recruiting right now" body="New student projects will show up here when teams open roles."/>}
          </section>}

          {section === 'events' && <section className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((event) => <article key={event.id} className="cg-surface p-5">
              <div className="flex items-center gap-2 text-sm cg-muted"><CalendarDays size={16}/>{new Date(event.starts_at).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}</div>
              <h2 className="mt-3 text-lg font-semibold">{event.title}</h2><p className="mt-2 text-sm leading-6 cg-muted">{event.description}</p>
              <p className="mt-3 text-xs cg-muted">{event.is_online ? 'Online' : event.venue_or_link} · {event.rsvp_count} going</p>
              <button disabled={busyId === event.id} onClick={() => rsvp(event)} className="mt-4 min-h-11 rounded-full bg-[var(--cg-accent)] px-4 text-sm font-semibold text-white disabled:opacity-50">{busyId === event.id ? 'Saving…' : 'RSVP'}</button>
            </article>)}
            {upcoming.length === 0 && <Empty title="No upcoming events listed" body="When student groups publish workshops, hackathons and campus events, they will appear here."/>}
          </section>}
        </>
      )}
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return <div className="cg-surface col-span-full p-8 text-center"><Layers3 size={24} className="mx-auto text-[var(--cg-subtle)]"/><h2 className="mt-3 font-semibold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm cg-muted">{body}</p></div>;
}
