'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  UserCheck 
} from 'lucide-react';
import { getColleges, completeOnboarding } from '@/lib/api';
import { College } from '@/types';

export default function OnboardingPage() {
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [courseBranch, setCourseBranch] = useState('B.E. Computer Science');
  const [gradYear, setGradYear] = useState(2028);
  const [skills, setSkills] = useState('Python, Next.js, FastAPI');
  const [interests, setInterests] = useState('Hackathons, Robotics');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadColleges() {
      try {
        const list = await getColleges();
        setColleges(list || []);
        if (list && list.length > 0) setSelectedCollegeId(list[0].id);
      } catch (err) {
        console.warn('Could not load colleges list:', err);
      }
    }
    loadColleges();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim() || !displayName.trim()) return;

    setIsSubmitting(true);
    try {
      const skillsArr = skills.split(',').map((s) => s.trim()).filter(Boolean);
      const interestsArr = interests.split(',').map((i) => i.trim()).filter(Boolean);

      await completeOnboarding({
        handle: handle.trim(),
        display_name: displayName.trim(),
        college_id: selectedCollegeId,
        course_branch: courseBranch,
        graduation_year: Number(gradYear),
        skills: skillsArr,
        interests: interestsArr,
        collaboration_goals: ['Hackathons', 'Side Projects'],
        profile_visibility: 'PUBLIC',
        dm_permission: 'SAME_CAMPUS_OR_COMMUNITY',
      });

      router.push('/campus');
    } catch {
      alert('Failed to complete onboarding. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="celestial-card p-6 md:p-10 border border-white/10 bg-[#12151F]/95 rounded-xl relative overflow-hidden shadow-2xl space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-400/40 text-[#FBBF24] flex items-center justify-center font-display font-extrabold text-xl mx-auto mb-3 shadow-[0_0_20px_rgba(251,191,36,0.25)]">
            CG
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-[#F8F7FF] tracking-tight">
            Complete Student <span className="text-[#FBBF24]">Profile</span>
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Bengaluru Cross-Campus Network Student Onboarding
          </p>
        </div>

        {/* Explicit Provisional Status Alert */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/25 flex items-start gap-3.5">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs font-mono text-amber-200 leading-relaxed font-sans">
            <span className="font-bold uppercase tracking-wider block mb-1 text-amber-300 font-mono text-[11px]">
              Stage 1: Provisional Status Disclosure
            </span>
            Selecting a college during onboarding grants you provisional student access. Your profile will display <strong className="text-white">&quot;Provisional Student — Self-Reported&quot;</strong> until you verify via an institutional <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded">.edu.in</code> email address or peer invite code.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Student Handle
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g. rahul_blr"
                required
                className="celestial-input w-full text-xs font-mono p-3 rounded-xl border border-white/10 bg-[#0E1017] text-white focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Full Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
                className="celestial-input w-full text-xs font-mono p-3 rounded-xl border border-white/10 bg-[#0E1017] text-white focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Select Your Bengaluru College
            </label>
            <select
              value={selectedCollegeId}
              onChange={(e) => setSelectedCollegeId(e.target.value)}
              className="celestial-input w-full text-xs font-mono p-3 rounded-xl border border-white/10 bg-[#0E1017] text-white cursor-pointer focus:border-amber-400"
            >
              {colleges.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0E1017] text-white">
                  {c.short_name} — {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Course / Branch
              </label>
              <input
                type="text"
                value={courseBranch}
                onChange={(e) => setCourseBranch(e.target.value)}
                placeholder="e.g. B.E. Computer Science"
                className="celestial-input w-full text-xs font-mono p-3 rounded-xl border border-white/10 bg-[#0E1017] text-white focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Graduation Year
              </label>
              <input
                type="number"
                value={gradYear}
                onChange={(e) => setGradYear(Number(e.target.value))}
                min={2025}
                max={2030}
                className="celestial-input w-full text-xs font-mono p-3 rounded-xl border border-white/10 bg-[#0E1017] text-white focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Top Skills (comma-separated)
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Python, Next.js, Figma, Robotics"
              className="celestial-input w-full text-xs font-mono p-3 rounded-xl border border-white/10 bg-[#0E1017] text-white focus:border-amber-400"
            />
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-campus-amber w-full sm:w-auto text-xs font-mono py-3 px-8 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <span>{isSubmitting ? 'Entering Campus Hub...' : 'Join CommonGround'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
