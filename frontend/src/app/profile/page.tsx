'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  User, 
  ShieldCheck, 
  Lock, 
  Mail, 
  CheckCircle2, 
  UserX, 
  AlertTriangle,
  Send,
  Flag,
  Sparkles,
  X,
  Building2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { getMyProfile, blockUser } from '@/lib/api';
import { StudentProfile } from '@/types';
import { TrustBadge } from '@/components/shared/TrustBadge';
import { ReportModal } from '@/components/shared/ReportModal';
import { StudentHoloCard } from '@/components/profile';

export default function ProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Verification request form
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [instEmail, setInstEmail] = useState('');
  const [verifySubmitted, setVerifySubmitted] = useState(false);

  // Privacy toggles
  const [visibility, setVisibility] = useState('PUBLIC');
  const [dmPermission, setDmPermission] = useState('SAME_CAMPUS_OR_COMMUNITY');

  // Report modal
  const [reportTarget, setReportTarget] = useState<{ id: string; type: any; title: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const prof = await getMyProfile();
        if (prof) {
          setProfile(prof);
          setVisibility(prof.profile_visibility);
          setDmPermission(prof.dm_permission);
        }
      } catch (err) {
        console.warn('Could not load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRequestVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instEmail.trim()) return;
    setVerifySubmitted(true);
    setTimeout(() => {
      setVerifySubmitted(false);
      setShowVerifyModal(false);
      alert('Verification OTP link dispatched to your institutional student email.');
    }, 1200);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 animate-pulse">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs font-mono text-slate-400">
          Syncing student identity and trust verification...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto py-16 text-center celestial-card p-8 rounded-xl border border-white/10 bg-[#12151F] shadow-2xl space-y-4">
        <User className="w-12 h-12 text-[#FBBF24] mx-auto" />
        <h2 className="font-display text-xl font-bold text-white">Sign in to view your profile</h2>
        <p className="text-xs font-mono text-slate-400">
          Access your verified credentials, course badges, and privacy controls.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link href="/login" className="btn-campus-amber text-xs font-mono px-5 py-2 font-bold">
            Sign In
          </Link>
          <Link href="/signup" className="px-5 py-2 rounded-xl text-xs font-mono border border-white/10 hover:bg-white/[0.04] text-white transition-all">
            Join Free
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Student Identity Showcase & Holographic Pass */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: 3D Holographic Student ID Card */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative group w-full flex justify-center">
            <StudentHoloCard
              profile={profile}
              contactText={profile.verification_stage === 'STAGE_3_INSTITUTIONAL_VERIFIED' ? 'Verified' : 'Verify Email'}
              onContactClick={() => {
                if (profile.verification_stage !== 'STAGE_3_INSTITUTIONAL_VERIFIED') {
                  setShowVerifyModal(true);
                }
              }}
            />
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-3 flex items-center gap-1.5 text-center">
            <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
            <span>Interactive Holographic Student Pass (Tilt &amp; Hover)</span>
          </div>
        </div>

        {/* Right: Institutional Credentials, Bio, Skills & Quick Actions */}
        <div className="lg:col-span-7 space-y-5">
          <div className="celestial-card p-6 md:p-8 rounded-xl border border-white/10 bg-[#12151F] space-y-4">\n          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs cg-muted">Your identity and privacy settings</p>
            <Link href="/passport" className="cg-link inline-flex min-h-11 items-center text-sm font-medium">View Campus Passport <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-display text-2xl md:text-3xl font-extrabold text-[#F8F7FF]">
                    {profile.display_name}
                  </h1>
                  <TrustBadge stage={profile.verification_stage} />
                </div>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  @{profile.handle} • {profile.college_name || 'RV College of Engineering'}
                </p>
              </div>

              {profile.verification_stage !== 'STAGE_3_INSTITUTIONAL_VERIFIED' && (
                <button
                  onClick={() => setShowVerifyModal(true)}
                  className="btn-campus-amber shrink-0 text-xs font-mono px-4 py-2 font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Verify College Email</span>
                </button>
              )}
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold mb-1">
                Institutional Course Branch
              </div>
              <div className="text-sm font-sans font-bold text-white">
                {profile.course_branch}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                Class of {profile.graduation_year} • Bengaluru Student Directory
              </div>
            </div>

            {profile.bio && (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/10 font-sans">
                {profile.bio}
              </p>
            )}

            {/* Skills Badges */}
            <div className="pt-3 border-t border-white/10">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2.5 font-semibold">
                Verified Skill Stacks
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <span
                    key={s}
                    className="neo-badge text-[10px] bg-white/5 border-white/10 text-slate-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Stage Trust Architecture Visualizer */}
      <div className="celestial-card p-6 md:p-8 rounded-xl border border-white/10 bg-[#12151F] space-y-4">
        <div>
          <h3 className="font-display text-lg font-bold text-[#F8F7FF] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span>The 4-Stage Trust Architecture</span>
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            CommonGround enforces strict honesty in student affiliations to protect cross-campus trust.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 pt-1">
          {[
            {
              stage: 'STAGE_1_PROVISIONAL' as const,
              title: 'Stage 1: Provisional',
              badge: 'Self-Reported',
              desc: 'Open onboarding. Self-reported Bengaluru college without official verification.',
              active: profile.verification_stage === 'STAGE_1_PROVISIONAL',
            },
            {
              stage: 'STAGE_2_COMMUNITY_VALIDATED' as const,
              title: 'Stage 2: Peer-Validated',
              badge: 'Campus Rep Invite',
              desc: 'Validated through trusted student representatives or peer cohort invites.',
              active: profile.verification_stage === 'STAGE_2_COMMUNITY_VALIDATED',
            },
            {
              stage: 'STAGE_3_INSTITUTIONAL_VERIFIED' as const,
              title: 'Stage 3: Verified Student',
              badge: 'Institutional Email',
              desc: 'Authenticated with .edu.in / .ac.in student OTP or manual ID check.',
              active: profile.verification_stage === 'STAGE_3_INSTITUTIONAL_VERIFIED',
            },
            {
              stage: 'STAGE_4_OFFICIAL_PARTNER' as const,
              title: 'Stage 4: Official Partner',
              badge: 'Authorized Admin',
              desc: 'Official college department accounts. Never implied for student-led hubs.',
              active: profile.verification_stage === 'STAGE_4_OFFICIAL_PARTNER',
            },
          ].map((item) => (
            <div
              key={item.title}
              className={`p-4 rounded-xl border transition-all ${
                item.active
                  ? 'border-amber-400/80 bg-amber-500/15 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                  : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <TrustBadge stage={item.stage} size="sm" showLabel={false} />
                {item.active && (
                  <span className="neo-badge text-[8px] bg-amber-400 text-black font-bold">
                    CURRENT
                  </span>
                )}
              </div>
              <div className="text-xs font-mono font-bold text-[#F8F7FF] mb-1">
                {item.title}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy & Safety Controls */}
      <div className="celestial-card p-6 md:p-8 rounded-xl border border-white/10 bg-[#12151F] space-y-4">
        <div>
          <h3 className="font-display text-lg font-bold text-[#F8F7FF] flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <span>Privacy Visibility &amp; Direct Message Governance</span>
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Configure boundary settings for public directory search and private message delivery.
          </p>
        </div>

        <div className="space-y-3.5 pt-1">
          {/* Profile Visibility */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
            <div>
              <div className="text-xs font-mono font-bold text-[#F8F7FF]">
                Profile Visibility
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Control who can view your course branch, graduation year, and skills in directory search.
              </p>
            </div>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="celestial-input text-xs font-mono py-1.5 px-3 rounded-xl border border-white/10 bg-[#0E1017] text-white cursor-pointer shrink-0 focus:border-amber-400"
            >
              <option value="PUBLIC">Public (All Bengaluru Students)</option>
              <option value="CAMPUS_ONLY">Campus Only (My College Peers)</option>
              <option value="SHARED_COMMUNITIES_ONLY">Shared Communities Only</option>
            </select>
          </div>

          {/* DM Permission */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
            <div>
              <div className="text-xs font-mono font-bold text-[#F8F7FF]">
                Direct Message (1-to-1) Permission
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Server-side enforcement of who can initiate new private conversations with you.
              </p>
            </div>
            <select
              value={dmPermission}
              onChange={(e) => setDmPermission(e.target.value)}
              className="celestial-input text-xs font-mono py-1.5 px-3 rounded-xl border border-white/10 bg-[#0E1017] text-white cursor-pointer shrink-0 focus:border-amber-400"
            >
              <option value="EVERYONE">Everyone across Bengaluru</option>
              <option value="SAME_CAMPUS_OR_COMMUNITY">Same Campus or Shared Clubs</option>
              <option value="NONE">No Incoming Direct Messages</option>
            </select>
          </div>
        </div>
      </div>

      {/* Verify Institutional Email Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="celestial-card w-full max-w-md p-6 rounded-xl border border-white/10 bg-[#12151F] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#F8F7FF]">
                Verify Institutional Email
              </h3>
              <button onClick={() => setShowVerifyModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Enter your college email address ending in .edu.in or .ac.in to unlock the Stage 3 Verified Student badge.
            </p>

            {verifySubmitted ? (
              <div className="p-4 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 rounded-xl text-center text-xs font-mono flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verification link dispatched. Please check your student inbox!</span>
              </div>
            ) : (
              <form onSubmit={handleRequestVerification} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                    College Email Address
                  </label>
                  <input
                    type="email"
                    value={instEmail}
                    onChange={(e) => setInstEmail(e.target.value)}
                    placeholder="e.g., student.name@rvce.edu.in"
                    className="celestial-input w-full text-xs font-mono p-2.5 rounded-xl border border-white/10 bg-[#0E1017] text-white focus:border-amber-400"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowVerifyModal(false)}
                    className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-campus-amber text-xs font-mono px-4 py-2 font-bold"
                  >
                    Send OTP Verification
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Universal Report Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          targetTitle={reportTarget.title}
        />
      )}
    </div>
  );
}
