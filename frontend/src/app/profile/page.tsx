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
  Flag
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xs font-mono animate-pulse text-gray-500">
          Loading Student Profile...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="neo-card p-6 bg-white dark:bg-[#151726] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#CCCFFA] via-[#C5E17A] to-[#CCCFFA]" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#1A1C29] text-[#C5E17A] flex items-center justify-center font-mono font-bold text-2xl border-2 border-[#C5E17A]">
              {profile.display_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="neo-heading text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  {profile.display_name}
                </h1>
                <TrustBadge stage={profile.verification_stage} />
              </div>
              <p className="text-xs font-mono text-gray-500">
                @{profile.handle} • {profile.college_name || 'RV College of Engineering'}
              </p>
              <p className="text-xs font-mono text-[#6366F1] dark:text-[#C5E17A] mt-0.5">
                {profile.course_branch} (Graduating {profile.graduation_year})
              </p>
            </div>
          </div>

          {profile.verification_stage !== 'STAGE_3_INSTITUTIONAL_VERIFIED' && (
            <button
              onClick={() => setShowVerifyModal(true)}
              className="neo-pill-btn neo-pill-btn-primary shrink-0 text-xs"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Verify College Email</span>
            </button>
          )}
        </div>

        {profile.bio && (
          <p className="text-xs text-gray-700 dark:text-gray-300 mt-4 leading-relaxed max-w-2xl">
            {profile.bio}
          </p>
        )}

        {/* Skills and Goals */}
        <div className="mt-4 pt-4 border-t border-[#CCCFFA]/50 dark:border-[#282C47]/50 flex flex-wrap gap-2">
          {profile.skills.map((s) => (
            <span key={s} className="neo-badge text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* 4-Stage Trust Architecture Visualizer (Section 3.1) */}
      <div className="neo-card p-6 bg-white dark:bg-[#151726]">
        <h3 className="neo-heading text-lg font-bold text-gray-900 dark:text-white mb-2">
          The 4-Stage Trust Architecture
        </h3>
        <p className="text-xs text-gray-500 font-mono mb-4">
          CommonGround enforces strict honesty in student affiliations to protect cross-campus trust.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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
              className={`p-3.5 rounded border transition-all ${
                item.active
                  ? 'border-[#C5E17A] bg-[#C5E17A]/10 shadow-sm'
                  : 'border-[#CCCFFA]/60 dark:border-[#282C47]/60 bg-gray-50/50 dark:bg-[#0E0F1A]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <TrustBadge stage={item.stage} size="sm" showLabel={false} />
                {item.active && (
                  <span className="neo-badge text-[8px] bg-[#C5E17A] text-[#0E0F1A] font-bold">
                    CURRENT
                  </span>
                )}
              </div>
              <div className="text-xs font-mono font-bold text-gray-900 dark:text-white mb-1">
                {item.title}
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy & Safety Controls (Rule 3.3) */}
      <div className="neo-card p-6 bg-white dark:bg-[#151726]">
        <h3 className="neo-heading text-lg font-bold text-gray-900 dark:text-white mb-4">
          Privacy Visibility & Direct Message Governance
        </h3>

        <div className="space-y-4">
          {/* Profile Visibility */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded border border-[#CCCFFA]/60 dark:border-[#282C47]/60">
            <div>
              <div className="text-xs font-mono font-bold text-gray-900 dark:text-white">
                Profile Visibility
              </div>
              <p className="text-xs text-gray-500">
                Control who can view your course branch, graduation year, and skills in directory search.
              </p>
            </div>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="neo-pill-btn text-xs font-mono bg-white dark:bg-[#0E0F1A]"
            >
              <option value="PUBLIC">Public (All Bengaluru Students)</option>
              <option value="CAMPUS_ONLY">Campus Only (My College Peers)</option>
              <option value="SHARED_COMMUNITIES_ONLY">Shared Communities Only</option>
            </select>
          </div>

          {/* DM Permission */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded border border-[#CCCFFA]/60 dark:border-[#282C47]/60">
            <div>
              <div className="text-xs font-mono font-bold text-gray-900 dark:text-white">
                Direct Message (1-to-1) Permission
              </div>
              <p className="text-xs text-gray-500">
                Server-side enforcement of who can initiate new private conversations with you.
              </p>
            </div>
            <select
              value={dmPermission}
              onChange={(e) => setDmPermission(e.target.value)}
              className="neo-pill-btn text-xs font-mono bg-white dark:bg-[#0E0F1A]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="neo-card w-full max-w-md p-6 bg-white dark:bg-[#151726] border border-[#CCCFFA] dark:border-[#282C47]">
            <h3 className="neo-heading text-xl font-bold text-gray-900 dark:text-white mb-1">
              Verify Institutional Email
            </h3>
            <p className="text-xs font-mono text-gray-500 mb-4">
              Enter your college email address ending in .edu.in or .ac.in to unlock the Stage 3 Verified Student badge.
            </p>

            {verifySubmitted ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded text-center text-xs font-mono">
                Verification link dispatched. Please check your student inbox!
              </div>
            ) : (
              <form onSubmit={handleRequestVerification} className="space-y-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-600 dark:text-gray-300 mb-1">
                    College Email Address:
                  </label>
                  <input
                    type="email"
                    value={instEmail}
                    onChange={(e) => setInstEmail(e.target.value)}
                    placeholder="e.g., student.name@rvce.edu.in"
                    className="w-full text-xs font-mono p-2.5 rounded border border-[#CCCFFA] dark:border-[#282C47] bg-[#F5F6FD] dark:bg-[#0E0F1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#C5E17A]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowVerifyModal(false)}
                    className="neo-pill-btn bg-transparent text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="neo-pill-btn neo-pill-btn-primary text-xs"
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
