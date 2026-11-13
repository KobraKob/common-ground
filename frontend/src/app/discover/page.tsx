'use client';

import type { FormEvent } from 'react';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Building2, CalendarDays, ExternalLink, Layers3, MapPin, Users } from 'lucide-react';
import { getColleges, getCommunities, getEvents, getProjects, getMyProfile, getPosts, joinCommunity, createCommunity, rsvpEvent, isAuthenticated } from '@/lib/api';
import type { College, Community, EventItem, Post, ProjectItem, StudentProfile } from '@/types';
import { CampusNetworkMap } from '@/components/discover/CampusNetworkMap';

type Section = 'campuses' | 'circles' | 'projects' | 'events' | 'opportunities';
type DiscoveryData = { colleges: College[]; circles: Community[]; projects: ProjectItem[]; events: EventItem[]; opportunities: Post[]; profile: StudentProfile | null };

export default function DiscoverPage() {
  const [section, setSection] = useState<Section>('campuses');
  const queryClient = useQueryClient();
  const discoveryQuery = useQuery<DiscoveryData>({
    queryKey: ['discover', 'hub'],
    queryFn: async () => {
      const [campusData, circleData, projectData, eventData, myProfile, opportunityData] = await Promise.all([
        getColleges(),
        getCommunities(),
        getProjects(),
        getEvents(),
        isAuthenticated() ? getMyProfile().catch(() => null) : Promise.resolve(null),
        getPosts('opportunities'),
      ]);
      return {
        colleges: campusData || [],
        circles: (circleData || []).filter((item) => item.community_type === 'CROSS_CAMPUS_INTEREST'),
        projects: projectData || [],
        events: eventData || [],
        profile: myProfile || null,
        opportunities: (opportunityData || []).filter((item) => item.category === 'OPPORTUNITY'),
      };
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const { colleges = [], circles = [], projects = [], events = [], opportunities = [], profile = null } = discoveryQuery.data || {};
  const loading = discoveryQuery.isLoading;
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');
  const [matchSkillsOnly, setMatchSkillsOnly] = useState(false);
  const [showCircleForm, setShowCircleForm] = useState(false);
  const [circleName, setCircleName] = useState('');
  const [circleDescription, setCircleDescription] = useState('');

  const upcoming = useMemo(() => events.filter((event) => new Date(event.ends_at) >= new Date()), [events]);
  const matchingProjects = useMemo(() => projects.filter((project) => {
    if (!profile?.skills?.length) return false;
    const skillSet = new Set(profile.skills.map((skill) => skill.toLowerCase()));
    return project.skills_needed.some((skill) => skillSet.has(skill.toLowerCase()));
  }), [projects, profile]);
  const visibleProjects = matchSkillsOnly ? matchingProjects : projects;
  const matchingOpportunities = useMemo(() => opportunities.filter((item) => {
    if (!profile?.skills?.length) return false;
    const skills = new Set(profile.skills.map((skill) => skill.toLowerCase()));
    return (item.tags || []).some((tag) => skills.has(tag.toLowerCase()));
  }), [opportunities, profile]);
  const visibleOpportunities = matchSkillsOnly ? matchingOpportunities : opportunities;
  const tabs: { id: Section; label: string }[] = [
    { id: 'campuses', label: 'Campuses' }, { id: 'circles', label: 'Circles' },
    { id: 'projects', label: 'Projects' }, { id: 'events', label: 'Events' }, { id: 'opportunities', label: 'Opportunities' },
  ];

  async function joinCircle(circle: Community) {
    setBusyId(circle.id); setNotice('');
    try { await joinCommunity(circle.id); await queryClient.invalidateQueries({ queryKey: ['discover', 'hub'] }); setNotice(`Joined ${circle.name}.`); }
    catch { setNotice('Could not join this circle. Sign in and try again.'); }
    finally { setBusyId(''); }
  }
  async function rsvp(event: EventItem) {
    setBusyId(event.id); setNotice('');
    try { await rsvpEvent(event.id, 'GOING'); await queryClient.invalidateQueries({ queryKey: ['discover', 'hub'] }); setNotice(`Your RSVP for ${event.title} was recorded.`); }
    catch { setNotice('Could not record your RSVP. Sign in and try again.'); }
    finally { setBusyId(''); }
  }

  async function handleCreateCircle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = circleName.trim();
    const cleanDescription = circleDescription.trim();
    if (cleanName.length < 2 || !cleanDescription) return;
    setBusyId('create'); setNotice('');
    const slug = cleanName.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 7);
    try {
      const created = await createCommunity({ name: cleanName, slug, description: cleanDescription, community_type: 'CROSS_CAMPUS_INTEREST', visibility: 'PUBLIC' });
      queryClient.setQueryData<DiscoveryData>(['discover', 'hub'], (current) => current ? { ...current, circles: [created, ...current.circles] } : current);
      setCircleName(''); setCircleDescription(''); setShowCircleForm(false);
      setNotice('Your circle is live. Invite students who share the interest.');
    } catch { setNotice('Could not create the circle. Sign in and try again.'); }
    finally { setBusyId(''); }
  }

  return (
    <div className="cg-page space-y-8">
      <header className="max-w-3xl space-y-3">
        <p className="cg-eyebrow">DISCOVER COMMON GROUND</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Find your people. Build beyond your campus.</h1>
        <p className="max-w-2xl text-base leading-7 cg-muted">Explore participating colleges, interest circles, student projects and upcoming events across Bengaluru. Listings come from the live CommonGround services.</p>
      </header>

      <section aria-label="Campus intelligence snapshot" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Campuses', colleges.length], ['Interest circles', circles.length], ['Projects listed', projects.length], ['Upcoming events', upcoming.length], ['Opportunities', opportunities.length]].map(([label, value]) => <div key={label} className="cg-surface p-4"><p className="text-xs cg-muted">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p></div>)}
      </section>

      <div className="flex flex-wrap gap-2 border-b border-[var(--cg-border)] pb-3" role="tablist" aria-label="Discovery categories">
        {tabs.map((tab) => <button key={tab.id} role="tab" aria-selected={section === tab.id} onClick={() => setSection(tab.id)}
          className={`min-h-11 rounded-full px-4 text-sm font-medium transition-colors ${section === tab.id ? 'bg-[var(--cg-accent)] text-white' : 'bg-[var(--cg-elevated)] text-[var(--cg-muted)] hover:text-[var(--cg-text)]'}`}>{tab.label}</button>)}
      </div>

      {discoveryQuery.isError && <p role="alert" className="rounded-xl border border-[var(--cg-border)] bg-[var(--cg-surface)] px-4 py-3 text-sm">Some discovery data could not be loaded. Refresh to try again.</p>}
      {notice && <p role="status" className="rounded-xl border border-[var(--cg-border)] bg-[var(--cg-surface)] px-4 py-3 text-sm">{notice}</p>}
      {loading ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading discovery"><div className="h-36 animate-pulse rounded-2xl bg-[var(--cg-elevated)]"/><div className="h-36 animate-pulse rounded-2xl bg-[var(--cg-elevated)]"/><div className="h-36 animate-pulse rounded-2xl bg-[var(--cg-elevated)]"/></div> : (
        <>
          {section === 'campuses' && <section className="space-y-4">
            <CampusNetworkMap colleges={colleges}/>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {colleges.map((campus) => <article key={campus.id} className="cg-surface p-5 space-y-4">
              <div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cg-elevated)] text-[var(--cg-accent)]"><Building2 size={20}/></span>{campus.is_official_partner && <span className="text-xs text-[var(--cg-success)]">Official partner</span>}</div>
              <div><h2 className="text-lg font-semibold">{campus.name}</h2><p className="mt-1 flex items-center gap-1 text-sm cg-muted"><MapPin size={14}/>{campus.city}, {campus.state}</p></div>
              <div className="flex gap-4 text-xs cg-muted"><span>{campus.member_count ?? '—'} students</span><span>{campus.community_count ?? '—'} communities</span></div>
              <div className="flex flex-wrap gap-4"><Link className="cg-link inline-flex min-h-11 items-center text-sm font-medium" href={`/campus?college=${encodeURIComponent(campus.slug)}`}>Explore campus <ExternalLink size={14} className="ml-2"/></Link><a className="cg-link inline-flex min-h-11 items-center text-sm font-medium" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(campus.name + ', ' + campus.city)}`} target="_blank" rel="noreferrer">Open map <ExternalLink size={14} className="ml-2"/></a></div>
            </article>)}
            </div>
          </section>}

          {section === 'circles' && <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">CommonGround Circles</h2><p className="text-sm cg-muted">Small interest-led communities connecting students across colleges.</p></div><button type="button" onClick={() => setShowCircleForm(!showCircleForm)} className="min-h-11 rounded-full bg-[var(--cg-accent)] px-4 text-sm font-semibold text-white">{showCircleForm ? 'Close form' : 'Create a circle'}</button></div>
            {showCircleForm && <form onSubmit={handleCreateCircle} className="cg-surface grid gap-3 p-5 sm:grid-cols-2"><label className="text-sm font-medium">Circle name<input required minLength={2} maxLength={150} value={circleName} onChange={(e) => setCircleName(e.target.value)} placeholder="Bengaluru Photography Circle" className="celestial-input mt-2 w-full px-3"/></label><label className="text-sm font-medium sm:row-span-2">What is this circle about?<textarea required value={circleDescription} onChange={(e) => setCircleDescription(e.target.value)} rows={3} placeholder="Describe the shared interest and what members can do together." className="celestial-input mt-2 w-full resize-y px-3 py-2"/></label><div className="flex items-end"><button disabled={busyId === 'create'} className="min-h-11 rounded-full bg-[var(--cg-accent)] px-5 text-sm font-semibold text-white disabled:opacity-50">{busyId === 'create' ? 'Creating…' : 'Create public circle'}</button></div></form>}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {circles.map((circle) => <article key={circle.id} className="cg-surface flex flex-col p-5">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cg-elevated)] text-[var(--cg-accent)]"><Users size={20}/></span>
              <h2 className="text-lg font-semibold">{circle.name}</h2><p className="mt-2 flex-1 text-sm leading-6 cg-muted">{circle.description}</p>
              <p className="mt-4 text-xs cg-muted">{circle.member_count} members · Cross-campus circle</p>
              <button disabled={busyId === circle.id} onClick={() => joinCircle(circle)} className="mt-4 min-h-11 rounded-full bg-[var(--cg-accent)] px-4 text-sm font-semibold text-white disabled:opacity-50">{busyId === circle.id ? 'Joining…' : 'Join circle'}</button>
            </article>)}
            {circles.length === 0 && <Empty title="No public circles yet" body="Create the first interest-led community and invite students from other campuses."/>}
            </div>
          </section>}

          {section === 'projects' && <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Projects that need collaborators</h2><p className="text-sm cg-muted">Match project skill requirements against the skills on your profile.</p></div><button type="button" aria-pressed={matchSkillsOnly} onClick={() => setMatchSkillsOnly(!matchSkillsOnly)} className={`min-h-11 rounded-full px-4 text-sm font-medium ${matchSkillsOnly ? 'bg-[var(--cg-accent)] text-white' : 'bg-[var(--cg-elevated)]'}`}>{matchSkillsOnly ? 'Showing skill matches' : 'Match my skills'} ({matchingProjects.length})</button></div>
            <div className="grid gap-3 lg:grid-cols-2">
            {visibleProjects.map((project) => <article key={project.id} className="cg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="cg-eyebrow">{project.stage.replace(/_/g, ' ')}</span>{project.is_cross_campus_open && <span className="text-xs text-[var(--cg-success)]">Open across campuses</span>}</div>
              <h2 className="mt-3 text-xl font-semibold">{project.title}</h2><p className="mt-2 text-sm cg-muted">{project.pitch}</p>
              <div className="mt-4 flex flex-wrap gap-2">{project.skills_needed.slice(0,5).map((skill) => <span key={skill} className="rounded-full bg-[var(--cg-elevated)] px-3 py-1 text-xs">{skill}</span>)}</div>
              {project.open_roles.length > 0 && <p className="mt-4 text-sm"><strong>Looking for:</strong> {project.open_roles.join(', ')}</p>}
              <p className="mt-3 text-xs cg-muted">Started by {project.creator_name || 'a student'}{project.creator_college_name ? ` · ${project.creator_college_name}` : ''}</p>
              <Link href="/build" className="cg-link mt-4 inline-flex min-h-11 items-center text-sm font-medium">View collaboration space <ExternalLink size={14} className="ml-2"/></Link>
            </article>)}
            {visibleProjects.length === 0 && <Empty title={matchSkillsOnly ? "No direct skill matches yet" : "No projects recruiting right now"} body={matchSkillsOnly ? "Add skills to your profile or browse all projects to discover more." : "New student projects will show up here when teams open roles."}/>}
            </div>
          </section>}


          {section === 'opportunities' && <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Student opportunities</h2><p className="text-sm cg-muted">Browse verified and community-submitted opportunities. Match tags against skills on your profile.</p></div><button type="button" aria-pressed={matchSkillsOnly} onClick={() => setMatchSkillsOnly(!matchSkillsOnly)} className={`min-h-11 rounded-full px-4 text-sm font-medium ${matchSkillsOnly ? 'bg-[var(--cg-accent)] text-white' : 'bg-[var(--cg-elevated)]'}`}>{matchSkillsOnly ? 'Showing skill matches' : 'Match my skills'} ({matchingOpportunities.length})</button></div>
            <div className="grid gap-3 lg:grid-cols-2">
              {visibleOpportunities.map((item) => {
                const externalUrl = item.opportunity_meta?.external_url;
                let safeUrl: string | null = null;
                if (externalUrl) { try { const parsed = new URL(externalUrl); if (parsed.protocol === 'https:' || parsed.protocol === 'http:') safeUrl = parsed.href; } catch {} }
                return <article key={item.id} className="cg-surface p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs"><span className="cg-eyebrow">{item.opportunity_meta?.verification_label?.replace(/_/g, ' ') || 'COMMUNITY SUBMITTED'}</span>{item.opportunity_meta?.deadline && <span className="cg-muted">Deadline: {new Date(item.opportunity_meta.deadline).toLocaleDateString()}</span>}</div>
                  <h3 className="mt-3 text-lg font-semibold">{item.title || item.body.slice(0, 80)}</h3><p className="mt-2 text-sm leading-6 cg-muted">{item.body}</p>
                  <div className="mt-4 flex flex-wrap gap-2">{(item.tags || []).map((tag) => <span key={tag} className="rounded-full bg-[var(--cg-elevated)] px-3 py-1 text-xs">{tag}</span>)}</div>
                  {safeUrl && <a href={safeUrl} target="_blank" rel="noreferrer" className="cg-link mt-4 inline-flex min-h-11 items-center text-sm font-medium">View opportunity <ExternalLink size={14} className="ml-2"/></a>}
                </article>;
              })}
              {visibleOpportunities.length === 0 && <Empty title={matchSkillsOnly ? 'No direct skill matches yet' : 'No opportunities listed yet'} body={matchSkillsOnly ? 'Add skills to your profile or browse all opportunities to discover more.' : 'Community-submitted opportunities will appear here when students share them.'}/>}
            </div>
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
