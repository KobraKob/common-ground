'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Award, BriefcaseBusiness, GraduationCap, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { getMyProfile, getProjects } from '@/lib/api';
import type { ProjectItem, StudentProfile } from '@/types';

export default function PassportPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getMyProfile(), getProjects()]).then(([person, work]) => {
      if (!active) return;
      setProfile(person);
      setProjects(work || []);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const myProjects = useMemo(() => profile ? projects.filter((project) => project.creator_id === profile.user_id) : [], [projects, profile]);

  if (loading) return <div className="cg-page"><div className="h-48 animate-pulse rounded-2xl bg-[var(--cg-elevated)]"/></div>;
  if (!profile) return <div className="cg-page"><section className="cg-surface mx-auto max-w-xl p-8 text-center"><UserRound size={28} className="mx-auto text-[var(--cg-accent)]"/><h1 className="mt-4 text-2xl font-semibold">Your Campus Passport</h1><p className="mt-2 text-sm cg-muted">Sign in to see your verified identity, skills and project work in one place.</p><Link href="/login" className="btn-campus-amber mt-5 inline-flex items-center px-5">Sign in</Link></section></div>;

  return <div className="cg-page space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="cg-eyebrow">YOUR COMMONGROUND RECORD</p><h1 className="mt-2 text-4xl font-semibold">Campus Passport</h1><p className="mt-2 max-w-2xl text-sm cg-muted">A portable snapshot of your student identity, capabilities and work. Only information already shared on your profile and projects appears here.</p></div>
      <Link href="/profile" className="cg-link inline-flex min-h-11 items-center text-sm">Edit profile <ArrowUpRight size={16} className="ml-1"/></Link>
    </header>
    <section className="cg-surface flex flex-wrap items-center gap-5 p-6 sm:p-8">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[var(--cg-elevated)] text-2xl font-semibold text-[var(--cg-accent)]">{profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover"/> : profile.display_name.slice(0,1).toUpperCase()}</div>
      <div className="min-w-0 flex-1"><h2 className="text-2xl font-semibold">{profile.display_name}</h2><p className="mt-1 text-sm cg-muted">@{profile.handle} · {profile.college_name || 'Campus not set'}</p><p className="mt-2 flex items-center gap-2 text-xs cg-muted"><ShieldCheck size={15} className="text-[var(--cg-success)]"/>{profile.verification_stage.replaceAll('_',' ').toLowerCase()}</p></div>
      <div className="rounded-xl bg-[var(--cg-elevated)] px-4 py-3"><p className="text-xs cg-muted">Projects created</p><p className="mt-1 text-2xl font-semibold tabular-nums">{myProjects.length}</p></div>
    </section>
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="cg-surface p-6"><div className="flex items-center gap-2"><GraduationCap className="text-[var(--cg-accent)]"/><h2 className="text-lg font-semibold">Student identity</h2></div><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="cg-muted">Institution</dt><dd className="text-right">{profile.college_name || 'Not provided'}</dd></div><div className="flex justify-between gap-4"><dt className="cg-muted">Course / branch</dt><dd className="text-right">{profile.course_branch || 'Not provided'}</dd></div><div className="flex justify-between gap-4"><dt className="cg-muted">Graduation year</dt><dd className="text-right">{profile.graduation_year || 'Not provided'}</dd></div></dl></section>
      <section className="cg-surface p-6"><div className="flex items-center gap-2"><Sparkles className="text-[var(--cg-accent)]"/><h2 className="text-lg font-semibold">Skills and interests</h2></div><p className="mt-4 text-xs cg-muted">Add or update these in your profile to improve collaborator discovery.</p><div className="mt-3 flex flex-wrap gap-2">{[...profile.skills,...profile.interests].map((item,index)=><span key={item+index} className="rounded-full bg-[var(--cg-elevated)] px-3 py-1.5 text-xs">{item}</span>)}</div>{profile.skills.length+profile.interests.length===0 && <p className="mt-3 text-sm cg-muted">No skills or interests added yet.</p>}</section>
    </div>
    <section className="space-y-4"><div className="flex items-center gap-2"><BriefcaseBusiness className="text-[var(--cg-accent)]"/><h2 className="text-xl font-semibold">Your projects</h2></div>
      {myProjects.length ? <div className="grid gap-3 sm:grid-cols-2">{myProjects.map((project)=><article key={project.id} className="cg-surface p-5"><p className="cg-eyebrow">{project.stage}</p><h3 className="mt-2 font-semibold">{project.title}</h3><p className="mt-2 text-sm cg-muted">{project.pitch}</p><div className="mt-3 flex flex-wrap gap-2">{project.skills_needed.map((skill)=><span key={skill} className="rounded-full bg-[var(--cg-elevated)] px-2.5 py-1 text-xs">{skill}</span>)}</div></article>)}</div> : <div className="cg-surface p-6"><Award size={22} className="text-[var(--cg-subtle)]"/><p className="mt-3 font-medium">Your project portfolio starts here.</p><p className="mt-1 text-sm cg-muted">Create or join a team to make your work visible in your passport.</p><Link href="/build" className="cg-link mt-3 inline-flex min-h-11 items-center text-sm">Explore Build <ArrowUpRight size={15} className="ml-1"/></Link></div>}
    </section>
  </div>;
}
