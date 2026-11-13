'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { getActiveProfile, isAuthenticated } from '@/lib/api';
import { useCreateProjectTaskMutation, useProjectQuery, useProjectTasksQuery, useUpdateProjectTaskMutation } from '@/lib/queries';

const columns = [{ key: 'TODO', label: 'To do' }, { key: 'IN_PROGRESS', label: 'In progress' }, { key: 'DONE', label: 'Done' }] as const;

export default function ProjectWorkspacePage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [authenticated, setAuthenticated] = useState(false);
  const [userId, setUserId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskError, setTaskError] = useState('');
  const projectQuery = useProjectQuery(projectId);
  const tasksQuery = useProjectTasksQuery(projectId, authenticated);
  const createTaskMutation = useCreateProjectTaskMutation(projectId);
  const updateTaskMutation = useUpdateProjectTaskMutation(projectId);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    setUserId(getActiveProfile()?.user_id || '');
  }, []);

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    setTaskError('');
    try {
      await createTaskMutation.mutateAsync({ title: taskTitle.trim(), status: 'TODO' });
      setTaskTitle('');
    } catch (cause) {
      setTaskError(cause instanceof Error ? cause.message : 'Task could not be created.');
    }
  }

  const project = projectQuery.data;
  const tasks = tasksQuery.data || [];
  if (projectQuery.isLoading) return <div className="mx-auto max-w-5xl space-y-3"><div className="skeleton-shimmer h-10 w-2/5" /><div className="skeleton-shimmer h-32" /></div>;
  if (projectQuery.error || !project) return <div className="mx-auto max-w-xl rounded-2xl bg-[var(--surface)] p-7"><h1 className="text-2xl font-semibold">Project not found</h1><Link href="/build" className="text-link mt-4">Back to projects</Link></div>;

  return <div className="mx-auto max-w-5xl space-y-7">
    <Link href="/build" className="text-link"><ArrowLeft size={16} /> Back to projects</Link>
    <header className="rounded-2xl bg-[var(--surface)] p-6"><p className="text-sm font-semibold text-[var(--accent)]">{project.stage.replaceAll('_', ' ')}</p><h1 className="mt-2 text-3xl font-semibold">{project.title}</h1><p className="mt-2 text-lg">{project.pitch}</p><p className="mt-4 text-sm">{project.description}</p><div className="mt-4 flex flex-wrap gap-2">{project.skills_needed.map((skill) => <span key={skill} className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs">{skill}</span>)}</div><p className="mt-4 text-xs text-[var(--text-muted)]">Started by {project.creator_name || 'A student'} · {project.members_count} members</p></header>
    <section className="space-y-4"><div><h2 className="text-2xl font-semibold">Project workspace</h2><p className="mt-1 text-sm">Coordinate work with accepted project members.</p></div>
      {!authenticated ? <div className="rounded-2xl bg-[var(--surface)] p-6"><p className="text-sm">Sign in to access the project workspace.</p><Link href="/login" className="btn-primary mt-4">Sign in</Link></div>
      : tasksQuery.isLoading ? <div className="skeleton-shimmer h-36" />
      : tasksQuery.isError ? <div className="rounded-2xl bg-[var(--surface)] p-6"><h3 className="text-lg font-semibold">Workspace access is limited</h3><p className="mt-2 text-sm">Only accepted project members can view tasks. Send a join request from the project list to ask to collaborate.</p><Link href="/build" className="text-link mt-3">Find projects <ArrowLeft size={15} /></Link></div>
      : <>
        {taskError && <p role="alert" className="text-sm text-[var(--danger)]">{taskError}</p>}
        <form onSubmit={createTask} className="flex flex-wrap gap-2 rounded-2xl bg-[var(--surface)] p-4"><input required minLength={1} maxLength={200} value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Add a task" aria-label="New task title" className="celestial-input min-w-[200px] flex-1" /><button disabled={createTaskMutation.isPending} type="submit" className="btn-primary"><Plus size={16} /> {createTaskMutation.isPending ? 'Adding…' : 'Add task'}</button></form>
        <div className="grid gap-4 md:grid-cols-3">{columns.map((column) => <section key={column.key} className="min-h-44 rounded-2xl bg-[var(--surface)] p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{column.label}</h3><span className="text-xs text-[var(--text-muted)]">{tasks.filter((task) => task.status === column.key).length}</span></div><div className="space-y-2">{tasks.filter((task) => task.status === column.key).map((task) => <article key={task.id} className="rounded-xl bg-[var(--surface-2)] p-3"><p className="text-sm font-medium">{task.title}</p><p className="mt-2 text-xs text-[var(--text-muted)]">{task.assignee_id === userId ? 'Assigned to you' : 'Project member'}</p><label className="mt-2 block text-xs text-[var(--text-muted)]">Move task<select aria-label={`Status for ${task.title}`} className="celestial-input mt-1 w-full" value={task.status} disabled={updateTaskMutation.isPending} onChange={(event) => updateTaskMutation.mutate({ taskId: task.id, status: event.target.value }, { onError: (cause) => setTaskError(cause instanceof Error ? cause.message : 'Task could not be updated.') })}><option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option></select></label></article>)}</div></section>)}</div>
      </>}
    </section>
  </div>;
}
