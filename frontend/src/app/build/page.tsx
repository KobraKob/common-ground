'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, Users, X } from 'lucide-react';
import { getActiveProfile, isAuthenticated } from '@/lib/api';
import { useCreateProjectMutation, useJoinProjectMutation, useProjectsQuery } from '@/lib/queries';
import type { ProjectItem, StudentProfile } from '@/types';

export default function BuildPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [joiningId, setJoiningId] = useState('');
  const [joinNote, setJoinNote] = useState('');
  const [joinRole, setJoinRole] = useState('Collaborator');
  const [form, setForm] = useState({ title: '', pitch: '', description: '', skills: '', roles: '' });
  const projectsQuery = useProjectsQuery();
  const createProjectMutation = useCreateProjectMutation();
  const joinProjectMutation = useJoinProjectMutation();
  const projects = projectsQuery.data || [];
  const loading = projectsQuery.isLoading;
  const saving = createProjectMutation.isPending || joinProjectMutation.isPending;

  useEffect(() => { setAuthenticated(isAuthenticated()); setProfile(getActiveProfile()); }, []);
  const skills = useMemo(() => new Set((profile?.skills || []).map((skill) => skill.toLowerCase())), [profile]);
  const rankedProjects = useMemo(() => [...projects].sort((a, b) => {
    const score = (project: ProjectItem) => project.skills_needed.filter((skill) => skills.has(skill.toLowerCase())).length;
    return score(b) - score(a);
  }), [projects, skills]);

  async function submitProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    try {
      await createProjectMutation.mutateAsync({
        title: form.title.trim(), pitch: form.pitch.trim(), description: form.description.trim(),
        stage: 'RECRUITING', skills_needed: form.skills.split(',').map((v) => v.trim()).filter(Boolean),
        open_roles: form.roles.split(',').map((v) => v.trim()).filter(Boolean),
        is_cross_campus_open: true, repo_or_demo_links: [],
      });
      setForm({ title: '', pitch: '', description: '', skills: '', roles: '' }); setShowCreate(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Project could not be created.'); }
  }

  async function submitJoin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!joiningId) return; setError('');
    try {
      await joinProjectMutation.mutateAsync({ projectId: joiningId, roleTitle: joinRole, pitchNote: joinNote });
      setJoiningId(''); setJoinNote('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Your request could not be sent.'); }
  }

  const queryError = projectsQuery.error instanceof Error ? projectsQuery.error.message : '';
  return <div className="mx-auto max-w-5xl space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[var(--accent)]">Build</p><h1 className="mt-2 text-3xl font-semibold">Make something together.</h1><p className="mt-2 max-w-xl">Find collaborators across Bengaluru, or put your own idea out into the network.</p></div><div className="flex flex-wrap items-center gap-3"><Link href="/circles" className="text-link">Explore circles <ArrowRight size={16} /></Link>{authenticated ? <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}><Plus size={17} /> Start a project</button> : <Link href="/login" className="btn-primary">Sign in to build <ArrowRight size={17} /></Link>}</div></header>
    {(error || queryError) && <p role="alert" className="rounded-xl bg-[var(--surface)] p-4 text-sm text-[var(--danger)]">{error || queryError}</p>}
    {showCreate && <form onSubmit={submitProject} className="space-y-4 rounded-2xl bg-[var(--surface)] p-5"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Start a project</h2><button type="button" aria-label="Close project form" onClick={() => setShowCreate(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--surface-2)]"><X size={18} /></button></div>
      <label className="block text-sm">Project name<input required minLength={2} maxLength={200} className="celestial-input mt-1 w-full" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
      <label className="block text-sm">One-line pitch<input required minLength={5} maxLength={300} className="celestial-input mt-1 w-full" value={form.pitch} onChange={(e) => setForm({ ...form, pitch: e.target.value })} /></label>
      <label className="block text-sm">What are you building?<textarea required minLength={10} rows={4} className="celestial-input mt-1 w-full" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
      <label className="block text-sm">Skills needed<input className="celestial-input mt-1 w-full" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="React, design, research" /></label>
      <label className="block text-sm">Open roles<input className="celestial-input mt-1 w-full" value={form.roles} onChange={(e) => setForm({ ...form, roles: e.target.value })} placeholder="Frontend, researcher" /></label>
      <button disabled={saving} className="btn-primary" type="submit">{saving ? 'Creating…' : 'Publish project'}</button></form>}
    {joiningId && <form onSubmit={submitJoin} className="space-y-3 rounded-2xl bg-[var(--surface)] p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Request to join</h2><button type="button" aria-label="Cancel join request" onClick={() => setJoiningId('')} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--surface-2)]"><X size={18} /></button></div><label className="block text-sm">Role<input required className="celestial-input mt-1 w-full" value={joinRole} onChange={(e) => setJoinRole(e.target.value)} /></label><label className="block text-sm">Why would you like to contribute?<textarea required minLength={5} className="celestial-input mt-1 w-full" rows={3} value={joinNote} onChange={(e) => setJoinNote(e.target.value)} /></label><button disabled={saving} type="submit" className="btn-primary">{saving ? 'Sending…' : 'Send request'}</button></form>}
    {loading ? <div className="space-y-3"><div className="skeleton-shimmer h-28" /><div className="skeleton-shimmer h-28" /></div> : rankedProjects.length === 0 ? <div className="rounded-2xl bg-[var(--surface)] p-8 text-center"><Users className="mx-auto mb-3 text-[var(--text-muted)]" size={28} /><h2 className="text-xl font-semibold">No projects yet</h2><p className="mx-auto mt-2 max-w-md text-sm">Be the first to share an idea and invite students from other campuses.</p>{authenticated && <button onClick={() => setShowCreate(true)} className="btn-primary mt-5">Start a project</button>}</div> : <section className="grid gap-4 md:grid-cols-2">{rankedProjects.map((project) => { const matchingSkills = project.skills_needed.filter((skill) => skills.has(skill.toLowerCase())); return <article key={project.id} className="rounded-2xl bg-[var(--surface)] p-5"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-[var(--accent)]">{project.stage.replaceAll('_', ' ')}</span><span className="text-xs text-[var(--text-muted)]">{project.members_count} members</span></div><h2 className="mt-3 text-xl font-semibold"><Link href={`/build/${project.id}`} className="hover:text-[var(--accent)]">{project.title}</Link></h2><p className="mt-2 text-sm">{project.pitch}</p><p className="mt-3 text-sm text-[var(--text-secondary)]">{project.description}</p>{matchingSkills.length > 0 && <p className="mt-3 text-xs text-[var(--accent)]">Matches your skills: {matchingSkills.join(', ')}</p>}<div className="mt-4 flex flex-wrap gap-2">{project.skills_needed.map((skill) => <span key={skill} className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs">{skill}</span>)}</div>{project.open_roles.length > 0 && <p className="mt-3 text-xs text-[var(--text-muted)]">Looking for: {project.open_roles.join(', ')}</p>}<p className="mt-3 text-xs text-[var(--text-muted)]">Started by {project.creator_name || 'A student'}{project.creator_college_name ? ` · ${project.creator_college_name}` : ''}</p>{authenticated && project.creator_id !== profile?.user_id && <button onClick={() => { setJoiningId(project.id); setJoinRole(project.open_roles[0] || 'Collaborator'); }} className="btn-primary mt-4 w-full">Request to join</button>}</article>; })}</section>}
  </div>;
}
