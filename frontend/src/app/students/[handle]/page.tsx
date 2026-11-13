'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowUpRight, BookOpen, Flag, GraduationCap, ShieldCheck, UserRound, UserX } from 'lucide-react';
import { blockUser, getMyProfile, getStudentProfile, isAuthenticated } from '@/lib/api';
import type { StudentProfile } from '@/types';
import { TrustBadge } from '@/components/shared/TrustBadge';
import { ReportModal } from '@/components/shared/ReportModal';

export default function PublicStudentProfilePage() {
  const params = useParams<{ handle: string }>();
  const handle = typeof params.handle === 'string' ? params.handle : '';
  const [signedIn, setSignedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const authenticated = isAuthenticated();
    setSignedIn(authenticated);
    if (authenticated) getMyProfile().then((profile) => setCurrentUserId(profile?.user_id || '')).catch(() => setCurrentUserId(''));
  }, []);

  const profileQuery = useQuery<StudentProfile>({
    queryKey: ['student-profile', handle],
    queryFn: () => getStudentProfile(handle),
    enabled: Boolean(handle),
    staleTime: 60_000,
  });
  const profile = profileQuery.data;
  const isSelf = Boolean(profile && currentUserId && profile.user_id === currentUserId);

  async function confirmBlock() {
    if (!profile) return;
    try {
      await blockUser(profile.user_id);
      setBlocked(true);
      setShowBlockConfirm(false);
      setNotice('This student is now blocked. Their profile and contact are hidden from your account.');
    } catch (error: any) {
      setNotice(error?.detail || 'Could not block this student.');
    }
  }

  if (profileQuery.isLoading) return <div className="cg-page"><div className="h-48 animate-pulse rounded-2xl bg-[var(--cg-elevated)]" aria-label="Loading student profile"/></div>;
  if (profileQuery.isError || !profile) {
    const status = (profileQuery.error as any)?.status;
    const message = status === 403
      ? 'This profile is restricted by the student’s visibility settings.'
      : status === 404
        ? 'This student profile is unavailable.'
        : 'The student profile could not be loaded.';
    return <div className="cg-page"><section className="cg-surface mx-auto max-w-xl p-8 text-center"><UserRound size={28} className="mx-auto text-[var(--cg-subtle)]"/><h1 className="mt-4 text-2xl font-semibold">Profile unavailable</h1><p className="mt-2 text-sm cg-muted">{message}</p><Link href="/discover" className="cg-link mt-5 inline-flex min-h-11 items-center">Back to discovery <ArrowUpRight size={15} className="ml-1"/></Link></section></div>;
  }

  return <div className="cg-page max-w-4xl space-y-6">
    <Link href="/discover" className="cg-link inline-flex min-h-11 items-center text-sm"><ArrowLeft size={15} className="mr-2"/>Back to discovery</Link>
    {notice && <p role="status" className="cg-surface p-4 text-sm">{notice}</p>}
    {blocked ? <section className="cg-surface p-8 text-center"><UserX size={28} className="mx-auto text-[var(--cg-subtle)]"/><h1 className="mt-4 text-xl font-semibold">Student blocked</h1><p className="mt-2 text-sm cg-muted">You will no longer see this student's profile or receive contact from them.</p><Link href="/discover" className="cg-link mt-4 inline-flex min-h-11 items-center">Return to discovery</Link></section> : <>
      <section className="cg-surface flex flex-wrap items-start gap-5 p-6 sm:p-8">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--cg-elevated)] text-2xl font-semibold text-[var(--cg-accent)]">{profile.display_name.slice(0,1).toUpperCase()}</div>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold">{profile.display_name}</h1><TrustBadge stage={profile.verification_stage} size="sm"/></div><p className="mt-1 text-sm cg-muted">@{profile.handle}{profile.college_name ? ` · ${profile.college_name}` : ''}</p>{profile.bio && <p className="mt-4 max-w-2xl text-sm leading-6">{profile.bio}</p>}</div>
        {signedIn && !isSelf && <div className="flex gap-2"><button type="button" onClick={()=>setShowReport(true)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--cg-border)] px-3 text-xs"><Flag size={14}/>Report</button><button type="button" onClick={()=>setShowBlockConfirm(true)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--cg-border)] px-3 text-xs"><UserX size={14}/>Block</button></div>}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="cg-surface p-6"><div className="flex items-center gap-2"><GraduationCap className="text-[var(--cg-accent)]"/><h2 className="font-semibold">Education</h2></div><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="cg-muted">Institution</dt><dd className="text-right">{profile.college_name || 'Not provided'}</dd></div>{profile.course_branch && <div className="flex justify-between gap-3"><dt className="cg-muted">Course</dt><dd className="text-right">{profile.course_branch}</dd></div>}{profile.graduation_year && <div className="flex justify-between gap-3"><dt className="cg-muted">Graduation year</dt><dd className="text-right">{profile.graduation_year}</dd></div>}</dl></section>
        <section className="cg-surface p-6"><div className="flex items-center gap-2"><BookOpen className="text-[var(--cg-accent)]"/><h2 className="font-semibold">Skills and interests</h2></div><div className="mt-4 flex flex-wrap gap-2">{[...profile.skills,...profile.interests].map((item,index)=><span key={item+index} className="rounded-full bg-[var(--cg-elevated)] px-3 py-1.5 text-xs">{item}</span>)}</div>{profile.skills.length+profile.interests.length===0 && <p className="mt-3 text-sm cg-muted">No skills or interests listed.</p>}</section>
      </div>
      <section className="cg-surface flex flex-wrap items-center justify-between gap-4 p-5"><div><div className="flex items-center gap-2"><ShieldCheck size={17} className="text-[var(--cg-accent)]"/><h2 className="font-semibold">Privacy and contact</h2></div><p className="mt-1 text-sm cg-muted">{profile.dm_permission === 'NONE' ? 'This student does not accept new direct contact.' : profile.dm_permission === 'SAME_CAMPUS_OR_COMMUNITY' ? 'Contact is limited by this student’s campus and shared-community settings.' : 'This student accepts contact requests from other students.'}</p></div><Link href="/messages" className="cg-link inline-flex min-h-11 items-center text-sm">Open Messages <ArrowUpRight size={15} className="ml-1"/></Link></section>
    </>}

    {showBlockConfirm && <div role="dialog" aria-modal="true" aria-labelledby="block-confirm-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><section className="cg-surface w-full max-w-md space-y-4 p-6"><h2 id="block-confirm-title" className="text-xl font-semibold">Block {profile.display_name}?</h2><p className="text-sm cg-muted">Blocking hides profiles and prevents direct contact in both directions. You can manage blocked users in your account settings.</p><div className="flex justify-end gap-2"><button type="button" onClick={()=>setShowBlockConfirm(false)} className="min-h-11 rounded-full px-4 text-sm">Cancel</button><button type="button" onClick={confirmBlock} className="min-h-11 rounded-full bg-[var(--cg-danger)] px-4 text-sm font-semibold text-white">Block student</button></div></section></div>}
    {profile && <ReportModal isOpen={showReport} onClose={()=>setShowReport(false)} targetType="USER" targetId={profile.user_id} targetTitle={profile.display_name}/>}
  </div>;
}
