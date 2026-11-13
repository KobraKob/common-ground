'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BookOpen, CalendarClock, Check, ShieldCheck, UserRound, Users } from 'lucide-react';
import {
  createMentorshipRequest,
  getMentors,
  getMyMentorshipProfile,
  getMyMentorshipRequests,
  isAuthenticated,
  updateMentorshipRequest,
  updateMyMentorshipProfile,
  type MentorDirectoryItem,
  type MentorshipProfileData,
  type MentorshipRequests,
} from '@/lib/api';

const emptyProfile: MentorshipProfileData = {
  is_available: false,
  topics: [],
  bio: '',
  availability_note: '',
  format: 'ONLINE',
};

type MentorshipHub = {
  mentors: MentorDirectoryItem[];
  profile: MentorshipProfileData;
  requests: MentorshipRequests;
};

export default function MentorshipPage() {
  const queryClient = useQueryClient();
  const [signedIn, setSignedIn] = useState(false);
  const [topicFilter, setTopicFilter] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [topicsText, setTopicsText] = useState('');
  const [bio, setBio] = useState('');
  const [availabilityNote, setAvailabilityNote] = useState('');
  const [format, setFormat] = useState<MentorshipProfileData['format']>('ONLINE');
  const [requestTarget, setRequestTarget] = useState<MentorDirectoryItem | null>(null);
  const [requestNote, setRequestNote] = useState('');
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => { setSignedIn(isAuthenticated()); }, []);

  const hubQuery = useQuery<MentorshipHub>({
    queryKey: ['mentorship', 'hub'],
    enabled: signedIn,
    queryFn: async () => {
      const [mentors, profile, requests] = await Promise.all([
        getMentors(),
        getMyMentorshipProfile(),
        getMyMentorshipRequests(),
      ]);
      return { mentors, profile, requests };
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    const profile = hubQuery.data?.profile;
    if (!profile) return;
    setIsAvailable(profile.is_available);
    setTopicsText(profile.topics.join(', '));
    setBio(profile.bio);
    setAvailabilityNote(profile.availability_note);
    setFormat(profile.format);
  }, [hubQuery.data?.profile]);

  const mentors = hubQuery.data?.mentors ?? [];
  const requests = hubQuery.data?.requests ?? { incoming: [], outgoing: [] };
  const filteredMentors = useMemo(() => {
    const term = topicFilter.trim().toLowerCase();
    if (!term) return mentors;
    return mentors.filter((mentor) =>
      [...mentor.topics, ...mentor.skills].some((item) => item.toLowerCase().includes(term))
    );
  }, [mentors, topicFilter]);

  async function saveMentorshipProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyId('profile');
    setNotice('');
    try {
      await updateMyMentorshipProfile({
        is_available: isAvailable,
        topics: topicsText.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 12),
        bio: bio.trim(),
        availability_note: availabilityNote.trim(),
        format,
      });
      await queryClient.invalidateQueries({ queryKey: ['mentorship', 'hub'] });
      setNotice(isAvailable ? 'Your opt-in mentor profile is saved.' : 'Your mentor profile is hidden from discovery.');
    } catch (error: any) {
      setNotice(error?.detail || 'Could not save your mentorship profile. Check that your student profile is public.');
    } finally { setBusyId(''); }
  }

  async function sendRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requestTarget || requestNote.trim().length < 10) return;
    setBusyId(requestTarget.user_id);
    setNotice('');
    try {
      await createMentorshipRequest(requestTarget.user_id, requestNote.trim());
      setRequestTarget(null);
      setRequestNote('');
      await queryClient.invalidateQueries({ queryKey: ['mentorship', 'hub'] });
      setNotice('Mentorship request sent. The student can accept or decline it.');
    } catch (error: any) {
      setNotice(error?.detail || 'Could not send this request. Their contact settings may restrict it.');
    } finally { setBusyId(''); }
  }

  async function updateRequest(id: string, status: 'ACCEPTED' | 'DECLINED' | 'CANCELLED') {
    setBusyId(id);
    setNotice('');
    try {
      await updateMentorshipRequest(id, status);
      await queryClient.invalidateQueries({ queryKey: ['mentorship', 'hub'] });
      setNotice(status === 'ACCEPTED' ? 'Request accepted. Continue the conversation through CommonGround Messages.' : status === 'DECLINED' ? 'Request declined.' : 'Request cancelled.');
    } catch (error: any) {
      setNotice(error?.detail || 'Could not update this request.');
    } finally { setBusyId(''); }
  }

  if (!signedIn) return <div className="cg-page"><section className="cg-surface mx-auto max-w-xl p-8 text-center"><UserRound size={28} className="mx-auto text-[var(--cg-accent)]"/><h1 className="mt-4 text-2xl font-semibold">Peer mentorship</h1><p className="mt-2 text-sm cg-muted">Sign in to discover students who have chosen to offer peer guidance.</p><Link href="/login" className="btn-campus-amber mt-5 inline-flex min-h-11 items-center px-5">Sign in</Link></section></div>;

  if (hubQuery.isLoading) return <div className="cg-page"><div className="h-48 animate-pulse rounded-2xl bg-[var(--cg-elevated)]" aria-label="Loading mentorship"/></div>;

  return <div className="cg-page space-y-8">
    <header className="max-w-3xl space-y-3"><p className="cg-eyebrow">LEARN FROM EACH OTHER</p><h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Peer mentorship, by choice.</h1><p className="text-base leading-7 cg-muted">Find students willing to share experience in a subject or skill. Mentors appear only after explicitly opting in. Requests respect each student's contact settings.</p></header>
    {notice && <p role="status" className="cg-surface p-4 text-sm">{notice}</p>}
    {hubQuery.isError && <p role="alert" className="cg-surface p-4 text-sm">Mentorship data could not be loaded. Refresh to try again.</p>}

    <section className="cg-surface p-6 sm:p-7">
      <div className="flex items-start gap-3"><ShieldCheck className="mt-1 text-[var(--cg-accent)]"/><div><h2 className="text-xl font-semibold">Your mentor profile</h2><p className="mt-1 text-sm cg-muted">Opt in only if you want other students to request guidance. You can hide your profile at any time.</p></div></div>
      <form onSubmit={saveMentorshipProfile} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium sm:col-span-2"><input type="checkbox" checked={isAvailable} onChange={(event)=>setIsAvailable(event.target.checked)} className="h-5 w-5 accent-[var(--cg-accent)]"/>Make my profile discoverable as an available mentor</label>
        <label className="text-sm font-medium sm:col-span-2">Topics you can help with<input value={topicsText} onChange={(event)=>setTopicsText(event.target.value)} maxLength={500} placeholder="Python, interview preparation, product design" className="celestial-input mt-2 min-h-11 w-full px-3"/></label>
        <label className="text-sm font-medium sm:col-span-2">Short introduction<textarea value={bio} onChange={(event)=>setBio(event.target.value)} maxLength={500} rows={3} placeholder="Share the experience you can offer. Avoid private contact details." className="celestial-input mt-2 w-full px-3 py-2"/></label>
        <label className="text-sm font-medium">Preferred format<select value={format} onChange={(event)=>setFormat(event.target.value as MentorshipProfileData['format'])} className="celestial-input mt-2 min-h-11 w-full px-3"><option value="ONLINE">Online</option><option value="IN_PERSON">In person</option><option value="BOTH">Either</option></select></label>
        <label className="text-sm font-medium">Availability note<input value={availabilityNote} onChange={(event)=>setAvailabilityNote(event.target.value)} maxLength={160} placeholder="Weekday evenings, twice a month" className="celestial-input mt-2 min-h-11 w-full px-3"/></label>
        <div className="sm:col-span-2"><button disabled={busyId==='profile'} className="min-h-11 rounded-full bg-[var(--cg-accent)] px-5 text-sm font-semibold text-white disabled:opacity-50">{busyId==='profile'?'Saving…':'Save mentor preferences'}</button></div>
      </form>
      <p className="mt-4 text-xs leading-5 cg-muted">Your student profile must be Public to appear in mentor discovery. Do not publish phone numbers, personal email addresses or sensitive information.</p>
    </section>

    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><div className="flex items-center gap-2"><Users className="text-[var(--cg-accent)]"/><h2 className="text-xl font-semibold">Available mentors</h2></div><p className="mt-1 text-sm cg-muted">Students who have actively opted in to receive requests.</p></div><label className="text-sm">Filter by topic or skill<input value={topicFilter} onChange={(event)=>setTopicFilter(event.target.value)} placeholder="e.g. Python" className="celestial-input mt-1 min-h-11 w-full px-3 sm:w-56"/></label></div>
      {filteredMentors.length ? <div className="grid gap-3 md:grid-cols-2">{filteredMentors.map((mentor)=><article key={mentor.user_id} className="cg-surface flex flex-col p-5">
        <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{mentor.display_name}</h3><p className="mt-1 text-xs cg-muted">@{mentor.handle}{mentor.college_name ? ` · ${mentor.college_name}` : ''}</p></div><span className="rounded-full bg-[var(--cg-elevated)] px-3 py-1 text-xs">{mentor.format.replace('_',' ').toLowerCase()}</span></div>
        {mentor.bio && <p className="mt-4 text-sm leading-6">{mentor.bio}</p>}
        <p className="mt-3 text-xs cg-muted">{mentor.availability_note || 'Availability discussed after a request is accepted.'}</p>
        <div className="mt-4 flex flex-wrap gap-2">{[...mentor.topics,...mentor.skills].slice(0,8).map((item,index)=><span key={item+index} className="rounded-full bg-[var(--cg-elevated)] px-3 py-1 text-xs">{item}</span>)}</div>
        <button type="button" onClick={()=>{setRequestTarget(mentor);setRequestNote('');}} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--cg-accent)] px-4 text-sm font-semibold text-white">Request mentorship <ArrowRight size={15}/></button>
      </article>)}</div> : <div className="cg-surface p-8 text-center"><BookOpen size={24} className="mx-auto text-[var(--cg-subtle)]"/><p className="mt-3 font-medium">No matching mentors found.</p><p className="mt-1 text-sm cg-muted">Try another topic, or check back as more students opt in.</p></div>}
    </section>

    <section className="grid gap-4 lg:grid-cols-2">
      <div className="cg-surface p-5"><h2 className="font-semibold">Requests sent to you</h2><div className="mt-3 space-y-3">{requests.incoming.length ? requests.incoming.map((item)=><article key={item.id} className="rounded-xl bg-[var(--cg-elevated)] p-4"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{item.display_name}</p><span className="text-xs cg-muted">{item.status.toLowerCase()}</span></div><p className="mt-2 text-sm cg-muted">{item.note}</p>{item.status==='PENDING' && <div className="mt-3 flex gap-2"><button disabled={busyId===item.id} onClick={()=>updateRequest(item.id,'ACCEPTED')} className="inline-flex min-h-10 items-center gap-1 rounded-full bg-[var(--cg-accent)] px-3 text-xs font-semibold text-white"><Check size={13}/>Accept</button><button disabled={busyId===item.id} onClick={()=>updateRequest(item.id,'DECLINED')} className="min-h-10 rounded-full border border-[var(--cg-border)] px-3 text-xs">Decline</button></div>}</article>) : <p className="text-sm cg-muted">No incoming requests.</p>}</div></div>
      <div className="cg-surface p-5"><h2 className="font-semibold">Requests you sent</h2><div className="mt-3 space-y-3">{requests.outgoing.length ? requests.outgoing.map((item)=><article key={item.id} className="rounded-xl bg-[var(--cg-elevated)] p-4"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{item.display_name}</p><span className="text-xs cg-muted">{item.status.toLowerCase()}</span></div><p className="mt-2 text-sm cg-muted">{item.note}</p>{item.status==='PENDING' && <button disabled={busyId===item.id} onClick={()=>updateRequest(item.id,'CANCELLED')} className="mt-3 min-h-10 rounded-full border border-[var(--cg-border)] px-3 text-xs">Cancel request</button>}</article>) : <p className="text-sm cg-muted">No outgoing requests.</p>}</div></div>
    </section>

    <section className="rounded-2xl border border-[var(--cg-border)] p-5"><div className="flex items-start gap-3"><CalendarClock className="mt-1 text-[var(--cg-accent)]"/><div><h2 className="font-semibold">Keep it safe and respectful</h2><p className="mt-1 text-sm leading-6 cg-muted">Mentorship is voluntary. Requests can be declined or cancelled. Keep early conversations inside CommonGround, do not share sensitive personal information, and use the platform's block and report controls if an interaction feels unsafe.</p><Link href="/messages" className="cg-link mt-2 inline-flex min-h-10 items-center text-sm">Open Messages <ArrowRight size={14} className="ml-1"/></Link></div></div></section>

    {requestTarget && <div role="dialog" aria-modal="true" aria-labelledby="mentor-request-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><form onSubmit={sendRequest} className="cg-surface w-full max-w-lg space-y-4 p-6"><h2 id="mentor-request-title" className="text-xl font-semibold">Request guidance from {requestTarget.display_name}</h2><p className="text-sm cg-muted">Explain what you want help with. The mentor can accept or decline.</p><label className="block text-sm font-medium">Your request<textarea required minLength={10} maxLength={500} rows={4} value={requestNote} onChange={(event)=>setRequestNote(event.target.value)} placeholder="I am learning Python and would appreciate advice on building my first project." className="celestial-input mt-2 w-full px-3 py-2"/></label><p className="text-xs cg-muted">Do not include personal contact details or sensitive information.</p><div className="flex justify-end gap-2"><button type="button" onClick={()=>setRequestTarget(null)} className="min-h-11 rounded-full px-4 text-sm">Cancel</button><button disabled={busyId===requestTarget.user_id} className="min-h-11 rounded-full bg-[var(--cg-accent)] px-5 text-sm font-semibold text-white">{busyId===requestTarget.user_id?'Sending…':'Send request'}</button></div></form></div>}
  </div>;
}
