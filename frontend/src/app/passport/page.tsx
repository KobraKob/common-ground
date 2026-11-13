'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Award, BookOpen, BriefcaseBusiness, CalendarCheck, GraduationCap, ShieldCheck, Sparkles, Users, UserRound } from 'lucide-react';
import { getMyContributions, getMyProfile, getMyProjects, isAuthenticated, type MyContributions } from '@/lib/api';
import type { ProjectItem, StudentProfile } from '@/types';

const emptyContributions: MyContributions = {
  posts_created: 0,
  questions_asked: 0,
  useful_answers: 0,
  tasks_marked_done: 0,
  communities: [],
  events_attended: [],
  attendance_note: 'Events appear only after their organizer confirms attendance. An RSVP alone is not counted as attendance.',
};

export default function PassportPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [contributions, setContributions] = useState<MyContributions>(emptyContributions);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const authenticated = isAuthenticated();
    Promise.all([
      getMyProfile(),
      authenticated ? getMyProjects() : Promise.resolve([]),
      authenticated ? getMyContributions() : Promise.resolve(emptyContributions),
    ]).then(([person, work, activity]) => {
      if (!active) return;
      setProfile(person);
      setProjects(work || []);
      setContributions(activity || emptyContributions);
    }).catch(() => {
      if (active) setError('Some contribution records could not be loaded. Refresh to try again.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <div className="cg-page"><div className="h-48 animate-pulse rounded-2xl bg-[var(--cg-elevated)]" aria-label="Loading Campus Passport"/></div>;
  if (!profile) return <div className="cg-page"><section className="cg-surface mx-auto max-w-xl p-8 text-center"><UserRound size={28} className="mx-auto text-[var(--cg-accent)]"/><h1 className="mt-4 text-2xl font-semibold">Your Campus Passport</h1><p className="mt-2 text-sm cg-muted">Sign in to see your verified identity, skills and confirmed contributions.</p><Link href="/login" className="btn-campus-amber mt-5 inline-flex min-h-11 items-center px-5">Sign in</Link></section></div>;

  const stats = [
    { label: 'Accepted project teams', value: projects.length, icon: BriefcaseBusiness },
    { label: 'Confirmed event attendance', value: contributions.events_attended.length, icon: CalendarCheck },
    { label: 'Communities joined', value: contributions.communities.length, icon: Users },
    { label: 'Useful answers', value: contributions.useful_answers, icon: BookOpen },
    { label: 'Tasks marked done', value: contributions.tasks_marked_done, icon: Award },
  ];

  return <div className="cg-page space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="cg-eyebrow">YOUR COMMONGROUND RECORD</p><h1 className="mt-2 text-4xl font-semibold">Campus Passport</h1><p className="mt-2 max-w-2xl text-sm cg-muted">A record assembled from your verified profile, accepted project memberships, organizer-confirmed event attendance and activity in CommonGround.</p></div>
      <Link href="/profile" className="cg-link inline-flex min-h-11 items-center text-sm">Edit profile <ArrowUpRight size={16} className="ml-1"/></Link>
    </header>

    {error && <p role="alert" className="cg-surface p-4 text-sm">{error}</p>}

    <section className="cg-surface flex flex-wrap items-center gap-5 p-6 sm:p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--cg-elevated)] text-2xl font-semibold text-[var(--cg-accent)]">{profile.display_name.slice(0,1).toUpperCase()}</div>
      <div className="min-w-0 flex-1"><h2 className="text-2xl font-semibold">{profile.display_name}</h2><p className="mt-1 text-sm cg-muted">@{profile.handle} · {profile.college_name || 'Campus not set'}</p><p className="mt-2 flex items-center gap-2 text-xs cg-muted"><ShieldCheck size={15} className="text-[var(--cg-success)]"/>{profile.verification_stage.replace(/_/g, ' ').toLowerCase()}</p></div>
      <div className="rounded-xl bg-[var(--cg-elevated)] px-4 py-3"><p className="text-xs cg-muted">Projects contributed to</p><p className="mt-1 text-2xl font-semibold tabular-nums">{projects.length}</p></div>
    </section>

    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Contribution summary">
      {stats.map(({label,value,icon:Icon})=><article key={label} className="cg-surface p-4 sm:p-5"><Icon size={18} className="text-[var(--cg-accent)]"/><p className="mt-3 text-2xl font-semibold tabular-nums">{value.toLocaleString()}</p><p className="mt-1 text-xs leading-5 cg-muted">{label}</p></article>)}
    </section>

    <div className="grid gap-4 lg:grid-cols-2">
      <section className="cg-surface p-6"><div className="flex items-center gap-2"><GraduationCap className="text-[var(--cg-accent)]"/><h2 className="text-lg font-semibold">Student identity</h2></div><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="cg-muted">Institution</dt><dd className="text-right">{profile.college_name || 'Not provided'}</dd></div><div className="flex justify-between gap-4"><dt className="cg-muted">Course / branch</dt><dd className="text-right">{profile.course_branch || 'Not provided'}</dd></div><div className="flex justify-between gap-4"><dt className="cg-muted">Graduation year</dt><dd className="text-right">{profile.graduation_year || 'Not provided'}</dd></div></dl></section>
      <section className="cg-surface p-6"><div className="flex items-center gap-2"><Sparkles className="text-[var(--cg-accent)]"/><h2 className="text-lg font-semibold">Skills and interests</h2></div><p className="mt-4 text-xs cg-muted">These profile details help students find collaborators with relevant experience.</p><div className="mt-3 flex flex-wrap gap-2">{[...profile.skills,...profile.interests].map((item,index)=><span key={item+index} className="rounded-full bg-[var(--cg-elevated)] px-3 py-1.5 text-xs">{item}</span>)}</div>{profile.skills.length+profile.interests.length===0 && <p className="mt-3 text-sm cg-muted">No skills or interests added yet.</p>}</section>
    </div>

    <section className="space-y-4"><div className="flex items-center gap-2"><BriefcaseBusiness className="text-[var(--cg-accent)]"/><h2 className="text-xl font-semibold">Project contributions</h2></div>
      {projects.length ? <div className="grid gap-3 sm:grid-cols-2">{projects.map((project)=><article key={project.id} className="cg-surface p-5"><p className="cg-eyebrow">{project.stage.replace(/_/g, ' ')}</p><h3 className="mt-2 font-semibold">{project.title}</h3><p className="mt-1 text-xs cg-muted">Your role: {project.my_role || (project.creator_id === profile.user_id ? 'Project creator' : 'Accepted collaborator')}</p><p className="mt-2 text-sm cg-muted">{project.pitch}</p></article>)}</div> : <div className="cg-surface p-6"><Award size={22} className="text-[var(--cg-subtle)]"/><p className="mt-3 font-medium">No accepted project contributions yet.</p><p className="mt-1 text-sm cg-muted">Create a project or request to join a team. Accepted memberships appear here.</p><Link href="/build" className="cg-link mt-3 inline-flex min-h-11 items-center text-sm">Explore Build <ArrowUpRight size={15} className="ml-1"/></Link></div>}
    </section>

    <div className="grid gap-4 lg:grid-cols-2">
      <section className="cg-surface p-6"><div className="flex items-center gap-2"><CalendarCheck className="text-[var(--cg-accent)]"/><h2 className="text-lg font-semibold">Confirmed event attendance</h2></div><p className="mt-2 text-xs leading-5 cg-muted">{contributions.attendance_note}</p>
        {contributions.events_attended.length ? <ul className="mt-4 space-y-3">{contributions.events_attended.map((event)=><li key={event.id} className="border-b border-[var(--cg-border)] pb-3 last:border-0"><p className="text-sm font-medium">{event.title}</p><p className="mt-1 text-xs cg-muted">Event date: {new Date(event.starts_at).toLocaleDateString()} · Confirmed: {new Date(event.attended_at).toLocaleDateString()}</p></li>)}</ul> : <p className="mt-4 text-sm cg-muted">No organizer-confirmed attendance records yet.</p>}
      </section>
      <section className="cg-surface p-6"><div className="flex items-center gap-2"><Users className="text-[var(--cg-accent)]"/><h2 className="text-lg font-semibold">Community participation</h2></div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-[var(--cg-elevated)] p-3"><p className="text-xl font-semibold tabular-nums">{contributions.posts_created}</p><p className="mt-1 text-xs cg-muted">Posts</p></div><div className="rounded-xl bg-[var(--cg-elevated)] p-3"><p className="text-xl font-semibold tabular-nums">{contributions.questions_asked}</p><p className="mt-1 text-xs cg-muted">Questions</p></div><div className="rounded-xl bg-[var(--cg-elevated)] p-3"><p className="text-xl font-semibold tabular-nums">{contributions.useful_answers}</p><p className="mt-1 text-xs cg-muted">Useful answers</p></div></div>
        {contributions.communities.length ? <ul className="mt-4 space-y-2">{contributions.communities.slice(0,8).map((community)=><li key={community.id} className="flex items-center justify-between gap-3 text-sm"><span className="truncate">{community.name}</span><span className="shrink-0 text-xs cg-muted">{new Date(community.joined_at).toLocaleDateString()}</span></li>)}</ul> : <p className="mt-4 text-sm cg-muted">You have not joined any communities yet.</p>}
      </section>
    </div>
  </div>;
}
