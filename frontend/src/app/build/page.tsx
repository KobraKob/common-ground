'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, CheckCircle2, ClipboardList, Plus, Users } from 'lucide-react';
import { createProject, createProjectTask, getMyProfile, getProjectTasks, getProjects, requestToJoinProject } from '@/lib/api';
import type { ProjectItem, StudentProfile, TaskItem } from '@/types';

export default function BuildPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [title, setTitle] = useState('');
  const [pitch, setPitch] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [roles, setRoles] = useState('');
  const [joinProject, setJoinProject] = useState<ProjectItem | null>(null);
  const [joinNote, setJoinNote] = useState('');
  const [joinRole, setJoinRole] = useState('Collaborator');
  const [workspace, setWorkspace] = useState<ProjectItem | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskBusy, setTaskBusy] = useState(false);
  const [filter, setFilter] = useState('ALL');

  async function refresh() {
    const [items, me] = await Promise.all([getProjects(), getMyProfile()]);
    setProjects(items || []);
    setProfile(me || null);
  }

  useEffect(() => {
    let active = true;
    Promise.all([getProjects(), getMyProfile()]).then(([items, me]) => {
      if (!active) return;
      setProjects(items || []);
      setProfile(me || null);
    }).catch(() => { if (active) setNotice('Could not load projects. Check your connection and retry.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleProjects = useMemo(() => filter === 'ALL' ? projects : projects.filter((project) => project.stage === filter), [projects, filter]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (title.trim().length < 2 || pitch.trim().length < 5 || description.trim().length < 10) return;
    setSubmitting(true); setNotice('');
    try {
      const created = await createProject({
        title: title.trim(), pitch: pitch.trim(), description: description.trim(),
        stage: 'RECRUITING',
        skills_needed: skills.split(',').map((item) => item.trim()).filter(Boolean),
        open_roles: roles.split(',').map((item) => item.trim()).filter(Boolean),
        is_cross_campus_open: true,
      });
      setProjects((current) => [created, ...current]);
      setTitle(''); setPitch(''); setDescription(''); setSkills(''); setRoles('');
      setShowCreate(false); setNotice('Project published. Students can now request to join your team.');
    } catch { setNotice('Could not publish the project. Sign in and try again.'); }
    finally { setSubmitting(false); }
  }

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!joinProject || joinNote.trim().length < 5) return;
    setSubmitting(true); setNotice('');
    try {
      await requestToJoinProject(joinProject.id, { pitch_note: joinNote.trim(), role_title: joinRole.trim() || 'Collaborator' });
      setNotice('Your request was sent to the project lead.');
      setJoinProject(null); setJoinNote('');
    } catch (error: any) { setNotice(error?.detail || 'Could not send your request. You may already be a member or need to sign in.'); }
    finally { setSubmitting(false); }
  }

  async function openWorkspace(project: ProjectItem) {
    setWorkspace(project); setTasks([]); setNotice('');
    try { setTasks(await getProjectTasks(project.id)); }
    catch { setNotice('Workspace access is limited to the project lead and accepted collaborators.'); }
  }

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace || taskTitle.trim().length < 2) return;
    setTaskBusy(true);
    try {
      const task = await createProjectTask(workspace.id, taskTitle.trim());
      setTasks((current) => [...current, task]); setTaskTitle('');
    } catch (error: any) { setNotice(error?.detail || 'Only project members can add tasks.'); }
    finally { setTaskBusy(false); }
  }

  return <div className="cg-page space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="cg-eyebrow">CROSS-CAMPUS COLLABORATION</p><h1 className="mt-2 text-4xl font-semibold">Build together.</h1><p className="mt-2 max-w-2xl text-sm leading-6 cg-muted">Find teams, recruit collaborators and turn student ideas into shipped work. Every project listing comes from the live project service.</p></div>
      <button onClick={() => setShowCreate(!showCreate)} className="btn-campus-amber inline-flex min-h-11 items-center gap-2 rounded-full px-5"><Plus size={17}/>{showCreate ? 'Close form' : 'Create a project'}</button>
    </header>

    {notice && <p role="status" className="cg-surface px-4 py-3 text-sm">{notice}</p>}

    {showCreate && <form onSubmit={handleCreate} className="cg-surface grid gap-4 p-5 sm:grid-cols-2">
      <div className="sm:col-span-2"><h2 className="text-xl font-semibold">Start a project</h2><p className="mt-1 text-sm cg-muted">Be specific about the outcome and the people you need.</p></div>
      <label className="text-sm font-medium">Project name<input required minLength={2} maxLength={200} value={title} onChange={(e)=>setTitle(e.target.value)} className="celestial-input mt-2 w-full px-3" placeholder="Open-source campus map"/></label>
      <label className="text-sm font-medium">Short pitch<input required minLength={5} maxLength={300} value={pitch} onChange={(e)=>setPitch(e.target.value)} className="celestial-input mt-2 w-full px-3" placeholder="A simple line explaining what you are building"/></label>
      <label className="text-sm font-medium sm:col-span-2">Project description<textarea required minLength={10} rows={4} value={description} onChange={(e)=>setDescription(e.target.value)} className="celestial-input mt-2 w-full px-3 py-2" placeholder="What problem are you solving? What is the first milestone?"/></label>
      <label className="text-sm font-medium">Skills needed<input value={skills} onChange={(e)=>setSkills(e.target.value)} className="celestial-input mt-2 w-full px-3" placeholder="React, Python, UI design"/></label>
      <label className="text-sm font-medium">Open roles<input value={roles} onChange={(e)=>setRoles(e.target.value)} className="celestial-input mt-2 w-full px-3" placeholder="Frontend developer, Designer"/></label>
      <div className="sm:col-span-2"><button disabled={submitting} className="btn-campus-amber inline-flex min-h-11 items-center gap-2 rounded-full px-5 disabled:opacity-50">{submitting ? 'Publishing…' : 'Publish recruiting project'}<ArrowRight size={16}/></button></div>
    </form>}

    <div className="flex flex-wrap items-center gap-2" aria-label="Filter projects">
      {['ALL','RECRUITING','IDEA','PROTOTYPING','LIVE','COMPLETED'].map((item)=><button key={item} onClick={()=>setFilter(item)} aria-pressed={filter===item} className={`min-h-10 rounded-full px-4 text-xs font-medium ${filter===item ? 'bg-[var(--cg-accent)] text-white' : 'bg-[var(--cg-elevated)] text-[var(--cg-muted)]'}`}>{item === 'ALL' ? 'All projects' : item.charAt(0)+item.slice(1).toLowerCase()}</button>)}
    </div>

    {loading ? <div className="grid gap-3 lg:grid-cols-2"><div className="h-52 animate-pulse rounded-2xl bg-[var(--cg-elevated)]"/><div className="h-52 animate-pulse rounded-2xl bg-[var(--cg-elevated)]"/></div> : visibleProjects.length === 0 ? <div className="cg-surface p-10 text-center"><BriefcaseBusiness size={28} className="mx-auto text-[var(--cg-subtle)]"/><h2 className="mt-4 text-xl font-semibold">No projects in this view</h2><p className="mt-2 text-sm cg-muted">Start a project or switch filters to explore other teams.</p></div> : <section className="grid gap-3 lg:grid-cols-2">
      {visibleProjects.map((project)=><article key={project.id} className="cg-surface flex flex-col p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="cg-eyebrow">{project.stage}</span>{project.is_cross_campus_open && <span className="text-xs text-[var(--cg-success)]">Cross-campus</span>}</div>
        <h2 className="mt-3 text-xl font-semibold">{project.title}</h2><p className="mt-2 text-sm cg-muted">{project.pitch}</p><p className="mt-3 text-sm leading-6">{project.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">{project.skills_needed.map((skill)=><span key={skill} className="rounded-full bg-[var(--cg-elevated)] px-3 py-1 text-xs">{skill}</span>)}</div>
        {project.open_roles.length>0 && <p className="mt-4 text-sm"><strong>Open roles:</strong> {project.open_roles.join(', ')}</p>}
        <div className="mt-4 flex items-center gap-2 text-xs cg-muted"><Users size={15}/>{project.members_count} team members · {project.creator_name || 'Student'}{project.creator_college_name ? ` · ${project.creator_college_name}` : ''}</div>
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          {profile?.user_id !== project.creator_id && ['IDEA','RECRUITING'].includes(project.stage) && <button onClick={()=>setJoinProject(project)} className="min-h-11 rounded-full bg-[var(--cg-accent)] px-4 text-sm font-semibold text-white">Request to join</button>}
          <button onClick={()=>openWorkspace(project)} className="min-h-11 rounded-full border border-[var(--cg-border)] px-4 text-sm font-medium">Open workspace</button>
        </div>
      </article>)}
    </section>}

    {joinProject && <div role="dialog" aria-modal="true" aria-labelledby="join-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><form onSubmit={handleJoin} className="cg-surface w-full max-w-lg space-y-4 p-6"><h2 id="join-title" className="text-xl font-semibold">Request to join {joinProject.title}</h2><label className="block text-sm font-medium">Role you want<input value={joinRole} onChange={(e)=>setJoinRole(e.target.value)} className="celestial-input mt-2 w-full px-3"/></label><label className="block text-sm font-medium">Why should the team work with you?<textarea required minLength={5} rows={4} value={joinNote} onChange={(e)=>setJoinNote(e.target.value)} className="celestial-input mt-2 w-full px-3 py-2"/></label><div className="flex justify-end gap-2"><button type="button" onClick={()=>setJoinProject(null)} className="min-h-11 rounded-full px-4 text-sm">Cancel</button><button disabled={submitting} className="btn-campus-amber min-h-11 rounded-full px-5">{submitting?'Sending…':'Send request'}</button></div></form></div>}

    {workspace && <div role="dialog" aria-modal="true" aria-labelledby="workspace-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><section className="cg-surface max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6"><div className="flex items-start justify-between gap-3"><div><p className="cg-eyebrow">PROJECT WORKSPACE</p><h2 id="workspace-title" className="mt-1 text-2xl font-semibold">{workspace.title}</h2></div><button onClick={()=>setWorkspace(null)} aria-label="Close workspace" className="min-h-11 min-w-11 rounded-full bg-[var(--cg-elevated)]">×</button></div><div className="mt-5 space-y-3"><h3 className="font-semibold">Tasks</h3>{tasks.length ? tasks.map((task)=><div key={task.id} className="flex items-center gap-3 rounded-xl bg-[var(--cg-elevated)] p-3 text-sm"><CheckCircle2 size={17} className="text-[var(--cg-success)]"/><span className="flex-1">{task.title}</span><span className="text-xs cg-muted">{task.status.replace(/_/g,' ')}</span></div>) : <p className="text-sm cg-muted">No tasks yet, or workspace access is unavailable.</p>}<form onSubmit={addTask} className="flex flex-wrap gap-2"><input value={taskTitle} onChange={(e)=>setTaskTitle(e.target.value)} minLength={2} placeholder="Add a task" className="celestial-input min-w-0 flex-1 px-3"/><button disabled={taskBusy} className="min-h-11 rounded-full bg-[var(--cg-accent)] px-4 text-sm font-semibold text-white">{taskBusy?'Adding…':'Add task'}</button></form></div></section></div>}
  </div>;
}
