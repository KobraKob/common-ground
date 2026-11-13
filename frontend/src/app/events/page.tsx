'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, MapPin, Plus, Video, X } from 'lucide-react';
import { getActiveProfile, isAuthenticated } from '@/lib/api';
import { useCreateEventMutation, useEventsQuery, useRsvpEventMutation } from '@/lib/queries';

export default function EventsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [collegeId, setCollegeId] = useState<string | undefined>();
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', startsAt: '', endsAt: '', venue: '', isOnline: false, crossCampus: true });
  const eventsQuery = useEventsQuery();
  const createMutation = useCreateEventMutation();
  const rsvpMutation = useRsvpEventMutation();
  const events = (eventsQuery.data || []).filter((event) => new Date(event.ends_at) > new Date());

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    setCollegeId(getActiveProfile()?.college_id);
  }, []);

  async function createEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (new Date(form.endsAt) <= new Date(form.startsAt)) {
      setError('The end time must be after the start time.');
      return;
    }
    try {
      await createMutation.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim(),
        starts_at: new Date(form.startsAt).toISOString(),
        ends_at: new Date(form.endsAt).toISOString(),
        venue_or_link: form.venue.trim(),
        is_online: form.isOnline,
        is_cross_campus: form.crossCampus,
        college_id: collegeId,
      });
      setShowCreate(false);
      setForm({ title: '', description: '', startsAt: '', endsAt: '', venue: '', isOnline: false, crossCampus: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Event could not be created.');
    }
  }

  async function rsvp(eventId: string, status: 'GOING' | 'INTERESTED') {
    setError('');
    try {
      await rsvpMutation.mutateAsync({ eventId, status });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your response could not be saved.');
    }
  }

  return <div className="mx-auto max-w-5xl space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[var(--accent)]">Events</p><h1 className="mt-2 text-3xl font-semibold">What's happening around you?</h1><p className="mt-2 max-w-xl">Find workshops, meetups and student events across Bengaluru.</p></div>{authenticated ? <button onClick={() => setShowCreate(!showCreate)} className="btn-primary"><Plus size={17} /> Create event</button> : <Link href="/login" className="btn-primary">Sign in to RSVP</Link>}</header>
    {error && <p role="alert" className="rounded-xl bg-[var(--surface)] p-3 text-sm text-[var(--danger)]">{error}</p>}
    {showCreate && <form onSubmit={createEvent} className="space-y-4 rounded-2xl bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Create an event</h2><button type="button" aria-label="Close event form" onClick={() => setShowCreate(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--surface-2)]"><X size={18} /></button></div>
      <label className="block text-sm">Event name<input required minLength={2} maxLength={200} className="celestial-input mt-1 w-full" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
      <label className="block text-sm">Description<textarea required minLength={10} rows={3} className="celestial-input mt-1 w-full" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
      <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm">Starts<input required type="datetime-local" className="celestial-input mt-1 w-full" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></label><label className="block text-sm">Ends<input required type="datetime-local" className="celestial-input mt-1 w-full" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></label></div>
      <label className="block text-sm">Venue or meeting link<input required className="celestial-input mt-1 w-full" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isOnline} onChange={(e) => setForm({ ...form, isOnline: e.target.checked })} /> Online event</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.crossCampus} onChange={(e) => setForm({ ...form, crossCampus: e.target.checked })} /> Open to students across campuses</label>
      <button type="submit" disabled={createMutation.isPending} className="btn-primary">{createMutation.isPending ? 'Publishing…' : 'Publish event'}</button>
    </form>}
    {eventsQuery.isLoading ? <div className="space-y-3"><div className="skeleton-shimmer h-32" /><div className="skeleton-shimmer h-32" /></div> : eventsQuery.error ? <p role="alert" className="rounded-xl bg-[var(--surface)] p-5 text-sm">Events could not be loaded. Try again shortly.</p> : events.length === 0 ? <div className="rounded-2xl bg-[var(--surface)] p-8 text-center"><CalendarDays size={28} className="mx-auto mb-3 text-[var(--text-muted)]" /><h2 className="text-xl font-semibold">No upcoming events listed</h2><p className="mt-2 text-sm">When students publish events, they will appear here.</p></div> : <div className="grid gap-4 md:grid-cols-2">{events.map((event) => <article key={event.id} className="rounded-2xl bg-[var(--surface)] p-5"><div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]"><span className="inline-flex items-center gap-1"><CalendarDays size={14} /> {new Date(event.starts_at).toLocaleString()}</span><span>·</span><span>{event.is_cross_campus ? 'Cross-campus' : 'Campus event'}</span></div><h2 className="mt-3 text-xl font-semibold">{event.title}</h2><p className="mt-2 text-sm">{event.description}</p><div className="mt-4 flex items-center gap-2 text-sm text-[var(--text-secondary)]">{event.is_online ? <Video size={16} /> : <MapPin size={16} />}<span>{event.venue_or_link}</span></div><p className="mt-3 text-xs text-[var(--text-muted)]">Organised by {event.organizer_name || 'A student'} · {event.rsvp_count} responses</p>{authenticated ? <div className="mt-4 flex gap-2"><button disabled={rsvpMutation.isPending} onClick={() => rsvp(event.id, 'GOING')} className="btn-primary flex-1">Going</button><button disabled={rsvpMutation.isPending} onClick={() => rsvp(event.id, 'INTERESTED')} className="rounded-full bg-[var(--surface-2)] px-4 py-2 text-sm">Interested</button></div> : <Link href="/login" className="btn-primary mt-4 w-full">Sign in to RSVP</Link>}</article>)}</div>}
  </div>;
}
