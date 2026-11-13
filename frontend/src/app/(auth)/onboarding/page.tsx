'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
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
      const list = await getColleges();
      setColleges(list);
      if (list.length > 0) setSelectedCollegeId(list[0].id);
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
      alert('Failed to complete onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCollege = colleges.find((c) => c.id === selectedCollegeId);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="celestial-card p-6 md:p-10 border border-purple-400/30 relative overflow-hidden shadow-2xl">
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2E1065] to-[#120836] border border-amber-400/50 text-[#FBBF24] flex items-center justify-center font-display font-extrabold text-xl mx-auto mb-3.5 shadow-[0_0_20px_rgba(251,191,36,0.35)]">
            CG
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-[#F8F7FF] mb-1.5">
            Join the Night <span className="text-celestial-gradient">Commons</span>
          </h1>
          <p className="text-xs font-mono text-[#C4B5FD]">
            Bengaluru Cross-Campus Network Student Onboarding
          </p>
        </div>

        {/* Explicit Provisional Status Alert */}
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-start gap-3.5">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs font-mono text-amber-200 leading-relaxed">
            <span className="font-bold uppercase tracking-wider block mb-1 text-amber-300">
              Stage 1: Provisional Status Disclosure
            </span>
            Selecting a college during onboarding grants you provisional student access. Your profile will display <strong>"Provisional Student — Self-Reported"</strong> until you verify via an institutional <code>.edu.in</code> email address or peer invite code.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1">
                Student Handle:
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g. rahul_blr"
                required
                className="celestial-input w-full text-xs font-mono p-3"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1">
                Full Display Name:
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
                className="celestial-input w-full text-xs font-mono p-3"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1">
              Select Your Bengaluru College:
            </label>
            <select
              value={selectedCollegeId}
              onChange={(e) => setSelectedCollegeId(e.target.value)}
              className="celestial-input w-full text-xs font-mono p-3 cursor-pointer"
            >
              {colleges.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0B0524] text-white">
                  {c.short_name} — {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1">
                Course / Branch:
              </label>
              <input
                type="text"
                value={courseBranch}
                onChange={(e) => setCourseBranch(e.target.value)}
                placeholder="e.g. B.E. Computer Science"
                className="celestial-input w-full text-xs font-mono p-3"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1">
                Graduation Year:
              </label>
              <input
                type="number"
                value={gradYear}
                onChange={(e) => setGradYear(Number(e.target.value))}
                min={2025}
                max={2030}
                className="celestial-input w-full text-xs font-mono p-3"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1">
              Top Skills (comma-separated):
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Python, Next.js, Figma, Robotics"
              className="celestial-input w-full text-xs font-mono p-3"
            />
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-campus-amber w-full sm:w-auto text-xs font-mono py-3 px-8"
            >
              <span>{isSubmitting ? 'Entering Campus Hub...' : 'Join CommonGround'}</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
