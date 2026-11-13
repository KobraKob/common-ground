'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Compass, Plus, Users, X } from 'lucide-react';
import { isAuthenticated } from '@/lib/api';
import { useCreateCircleMutation, useInterestCirclesQuery, useJoinCircleMutation } from '@/lib/queries';

export default function CirclesPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [message, setMessage] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const circlesQuery = useInterestCirclesQuery();
  const joinMutation = useJoinCircleMutation();
  const createMutation = useCreateCircleMutation();
  const circles = circlesQuery.data || [];
  useEffect(() => setAuthenticated(isAuthenticated()), []);
  async function join(id: string) {
    setMessage('');
    try { const result = await joinMutation.mutateAsync(id); setMessage(result?.message || 'Your membership request was processed.'); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Could not join this circle.'); }
  }
  async function createCircle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage('');
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    try {
      await createMutation.mutateAsync({ name: name.trim(), slug, description: description.trim(), community_type: 'CROSS_CAMPUS_INTEREST', visibility: 'PUBLIC' });
      setName(''); setDescription(''); setShowCreate(false); setMessage('Your circle is live.');
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Could not create this circle.'); }
  }
  return <div className="mx-auto max-w-5xl space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[var(--accent)]">Circles</p><h1 className="mt-2 text-3xl font-semibold">Find your people.</h1><p className="mt-2 max-w-xl">Interest-based communities that bring students together across campuses.</p></div>{authenticated ? <button onClick={() => setShowCreate(!showCreate)} className="btn-primary"><Plus size={17} /> Create a circle</button> : <Link href="/login" className="btn-primary">Sign in to create</Link>}</header>
    {message && <p role="status" className="rounded-xl bg-[var(--surface)] p-3 text-sm">{message}</p>}
    {showCreate && <form onSubmit={createCircle} className="space-y-4 rounded-2xl bg-[var(--surface)] p-5"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Create an interest circle</h2><button type="button" aria-label="Close circle form" onClick={() => setShowCreate(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--surface-2)]"><X size={18} /></button></div><label className="block text-sm">Circle name<input required minLength={2} maxLength={150} className="celestial-input mt-1 w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Bengaluru photography circle" /></label><label className="block text-sm">What brings members together?<textarea required minLength={10} rows={3} className="celestial-input mt-1 w-full" value={description} onChange={(e) => setDescription(e.target.value)} /></label><p className="text-xs text-[var(--text-muted)]">New circles are public and cross-campus. Official college endorsement is never implied.</p><button disabled={createMutation.isPending} type="submit" className="btn-primary">{createMutation.isPending ? 'Creating…' : 'Create circle'}</button></form>}
    {circlesQuery.error && <p role="alert" className="rounded-xl bg-[var(--surface)] p-3 text-sm text-[var(--danger)]">Circles could not be loaded. Try again shortly.</p>}
    {circlesQuery.isLoading ? <div className="skeleton-shimmer h-36" /> : circles.length === 0 ? <div className="rounded-2xl bg-[var(--surface)] p-8 text-center"><Compass size={28} className="mx-auto mb-3 text-[var(--text-muted)]" /><h2 className="text-xl font-semibold">No public circles yet</h2><p className="mt-2 text-sm">Start the first interest community and invite students from other campuses.</p>{authenticated && <button onClick={() => setShowCreate(true)} className="btn-primary mt-5">Create a circle</button>}</div> : <div className="grid gap-4 md:grid-cols-2">{circles.map((circle) => <article key={circle.id} className="rounded-2xl bg-[var(--surface)] p-5"><div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><Users size={16} /> {circle.member_count} members</div><h2 className="mt-3 text-xl font-semibold">{circle.name}</h2><p className="mt-2 text-sm">{circle.description}</p><span className="mt-4 inline-block rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs">{circle.visibility.replaceAll('_', ' ')}</span>{authenticated ? <button disabled={joinMutation.isPending} onClick={() => join(circle.id)} className="btn-primary mt-4 w-full">{joinMutation.isPending ? 'Joining…' : 'Join circle'}</button> : <Link href="/login" className="btn-primary mt-4 w-full">Sign in to join</Link>}</article>)}</div>}
  </div>;
}
