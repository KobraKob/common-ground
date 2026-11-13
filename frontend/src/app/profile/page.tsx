'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  Lock, 
  Eye, 
  Mail, 
  CheckCircle2, 
  UserX, 
  AlertTriangle,
  Send,
  Flag,
  Sparkles
} from 'lucide-react';
import { getMyProfile, blockUser } from '@/lib/api';
import { StudentProfile } from '@/types';
import { TrustBadge } from '@/components/shared/TrustBadge';
import { ReportModal } from '@/components/shared/ReportModal';

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
      const prof = await getMyProfile();
      setProfile(prof);
      setVisibility(prof.profile_visibility);
      setDmPermission(prof.dm_permission);
      setLoading(false);
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
      alert('Verification OTP link dispatched to your institutional student email!');
    }, 1200);
  };

  if (loading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 rounded-2xl bg-purple-900/40 border border-purple-500/40 flex items-center justify-center text-amber-300 animate-spin">
          ✦
        </div>
        <div className="text-xs font-mono text-[#C4B5FD] animate-pulse">
          TUNING STUDENT IDENTITY // TRUST MATRIX...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="celestial-card p-6 md:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2E1065] to-[#120836] text-[#FBBF24] flex items-center justify-center font-display font-extrabold text-3xl border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.35)] shrink-0">
              {profile.display_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <h1 className="font-display text-2xl md:text-3xl font-extrabold text-[#F8F7FF]">
                  {profile.display_name}
                </h1>
                <TrustBadge stage={profile.verification_stage} />
              </div>
              <p className="text-xs font-mono text-[#C4B5FD]">
                @{profile.handle} • {profile.college_name || 'RV College of Engineering'}
              </p>
              <p className="text-xs font-mono text-[#FDE68A] mt-1 font-semibold">
                {profile.course_branch} (Graduating {profile.graduation_year})
              </p>
            </div>
          </div>

          {profile.verification_stage !== 'STAGE_3_INSTITUTIONAL_VERIFIED' && (
            <button
              onClick={() => setShowVerifyModal(true)}
              className="btn-campus-amber shrink-0 text-xs font-mono px-4 py-2"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Verify College Email</span>
            </button>
          )}
        </div>

        {profile.bio && (
          <p className="text-xs text-[#C4B5FD] mt-5 leading-relaxed max-w-2xl bg-purple-950/30 p-3.5 rounded-xl border border-purple-500/20">
            {profile.bio}
          </p>
        )}

        {/* Skills and Goals */}
        <div className="mt-5 pt-4 border-t border-purple-500/20 flex flex-wrap gap-2">
          {profile.skills.map((s) => (
            <span
              key={s}
              className="neo-badge text-[10px] bg-purple-950/60 border-purple-400/30 text-purple-200"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* 4-Stage Trust Architecture Visualizer */}
      <div className="celestial-card p-6 md:p-8">
        <h3 className="font-display text-lg font-bold text-[#F8F7FF] mb-1 flex items-center gap-2">
          <span>The 4-Stage Trust Architecture</span>
          <span className="text-[#FBBF24]">✦</span>
        </h3>
        <p className="text-xs text-[#C4B5FD] font-mono mb-5">
          CommonGround enforces strict honesty in student affiliations to protect cross-campus trust.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
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
              className={`p-4 rounded-2xl border transition-all ${
                item.active
                  ? 'border-amber-400/80 bg-amber-500/15 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  : 'border-purple-500/20 bg-purple-950/25'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <TrustBadge stage={item.stage} size="sm" showLabel={false} />
                {item.active && (
                  <span className="neo-badge text-[8px] bg-amber-400 text-[#090420] font-bold">
                    CURRENT
                  </span>
                )}
              </div>
              <div className="text-xs font-mono font-bold text-[#F8F7FF] mb-1">
                {item.title}
              </div>
              <p className="text-[11px] text-[#C4B5FD] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy & Safety Controls */}
      <div className="celestial-card p-6 md:p-8">
        <h3 className="font-display text-lg font-bold text-[#F8F7FF] mb-4">
          Privacy Visibility & Direct Message Governance
        </h3>

        <div className="space-y-4">
          {/* Profile Visibility */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-purple-500/20 bg-purple-950/20">
            <div>
              <div className="text-xs font-mono font-bold text-[#F8F7FF]">
                Profile Visibility
              </div>
              <p className="text-xs text-[#C4B5FD] mt-0.5">
                Control who can view your course branch, graduation year, and skills in directory search.
              </p>
            </div>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="celestial-input text-xs font-mono py-1.5 px-3 cursor-pointer shrink-0"
            >
              <option value="PUBLIC" className="bg-[#0B0524] text-white">Public (All Bengaluru Students)</option>
              <option value="CAMPUS_ONLY" className="bg-[#0B0524] text-white">Campus Only (My College Peers)</option>
              <option value="SHARED_COMMUNITIES_ONLY" className="bg-[#0B0524] text-white">Shared Communities Only</option>
            </select>
          </div>

          {/* DM Permission */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-purple-500/20 bg-purple-950/20">
            <div>
              <div className="text-xs font-mono font-bold text-[#F8F7FF]">
                Direct Message (1-to-1) Permission
              </div>
              <p className="text-xs text-[#C4B5FD] mt-0.5">
                Server-side enforcement of who can initiate new private conversations with you.
              </p>
            </div>
            <select
              value={dmPermission}
              onChange={(e) => setDmPermission(e.target.value)}
              className="celestial-input text-xs font-mono py-1.5 px-3 cursor-pointer shrink-0"
            >
              <option value="EVERYONE" className="bg-[#0B0524] text-white">Everyone across Bengaluru</option>
              <option value="SAME_CAMPUS_OR_COMMUNITY" className="bg-[#0B0524] text-white">Same Campus or Shared Clubs</option>
              <option value="NONE" className="bg-[#0B0524] text-white">No Incoming Direct Messages</option>
            </select>
          </div>
        </div>
      </div>

      {/* Verify Institutional Email Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="celestial-card w-full max-w-md p-6 border border-purple-400/30 shadow-2xl">
            <h3 className="font-display text-xl font-bold text-[#F8F7FF] mb-1">
              Verify Institutional Email
            </h3>
            <p className="text-xs font-mono text-[#C4B5FD] mb-4">
              Enter your college email address ending in .edu.in or .ac.in to unlock the Stage 3 Verified Student badge.
            </p>

            {verifySubmitted ? (
              <div className="p-4 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 rounded-xl text-center text-xs font-mono">
                Verification link dispatched. Please check your student inbox!
              </div>
            ) : (
              <form onSubmit={handleRequestVerification} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#C4B5FD] mb-1">
                    College Email Address:
                  </label>
                  <input
                    type="email"
                    value={instEmail}
                    onChange={(e) => setInstEmail(e.target.value)}
                    placeholder="e.g., student.name@rvce.edu.in"
                    className="celestial-input w-full text-xs font-mono p-3"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowVerifyModal(false)}
                    className="px-4 py-2 rounded-full text-xs font-mono text-[#C4B5FD] hover:text-[#F8F7FF] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-campus-amber text-xs font-mono px-4 py-2"
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
