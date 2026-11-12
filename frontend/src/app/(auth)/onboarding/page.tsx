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
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="neo-card p-6 md:p-8 bg-white dark:bg-[#151726] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#CCCFFA] via-[#C5E17A] to-[#1A1C29]" />

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#1A1C29] text-[#C5E17A] flex items-center justify-center font-mono font-bold text-lg mx-auto mb-3 shadow-sm">
            CG
          </div>
          <h1 className="neo-heading text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            Welcome to Common<em>Ground</em>
          </h1>
          <p className="text-xs font-mono text-gray-500">
            Bengaluru Cross-Campus Network Student Onboarding
          </p>
        </div>

        {/* Explicit Provisional Status Alert (Section 1.2 & 3.1) */}
        <div className="mb-6 p-4 rounded bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs font-mono text-amber-800 dark:text-amber-300 leading-relaxed">
            <span className="font-bold uppercase tracking-wider block mb-1">
              Stage 1: Provisional Status Disclosure
            </span>
            Selecting a college during onboarding grants you provisional student access. Your profile will display <strong>"Provisional Student — Self-Reported"</strong> until you verify via an institutional <code>.edu.in</code> email address or peer invite code.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                Student Handle:
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g. rahul_blr"
                required
                className="w-full text-xs font-mono p-2.5 rounded border border-[#CCCFFA] dark:border-[#282C47] bg-[#F5F6FD] dark:bg-[#0E0F1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#C5E17A]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                Full Display Name:
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full text-xs font-mono p-2.5 rounded border border-[#CCCFFA] dark:border-[#282C47] bg-[#F5F6FD] dark:bg-[#0E0F1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#C5E17A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
              Select Your Bengaluru College:
            </label>
            <select
              value={selectedCollegeId}
              onChange={(e) => setSelectedCollegeId(e.target.value)}
              className="w-full text-xs font-mono p-2.5 rounded border border-[#CCCFFA] dark:border-[#282C47] bg-[#F5F6FD] dark:bg-[#0E0F1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#C5E17A]"
            >
              {colleges.map((c) => (
                <option key={c.id} value={c.id} className="dark:bg-[#151726]">
                  {c.short_name} — {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                Course / Branch:
              </label>
              <input
                type="text"
                value={courseBranch}
                onChange={(e) => setCourseBranch(e.target.value)}
                placeholder="e.g. B.E. Computer Science"
                className="w-full text-xs font-mono p-2.5 rounded border border-[#CCCFFA] dark:border-[#282C47] bg-[#F5F6FD] dark:bg-[#0E0F1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#C5E17A]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                Graduation Year:
              </label>
              <input
                type="number"
                value={gradYear}
                onChange={(e) => setGradYear(Number(e.target.value))}
                min={2025}
                max={2030}
                className="w-full text-xs font-mono p-2.5 rounded border border-[#CCCFFA] dark:border-[#282C47] bg-[#F5F6FD] dark:bg-[#0E0F1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#C5E17A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
              Top Skills (comma-separated):
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Python, Next.js, Figma, Robotics"
              className="w-full text-xs font-mono p-2.5 rounded border border-[#CCCFFA] dark:border-[#282C47] bg-[#F5F6FD] dark:bg-[#0E0F1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#C5E17A]"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="neo-pill-btn neo-pill-btn-primary w-full sm:w-auto py-2.5 px-6"
            >
              <span>{isSubmitting ? 'Entering Campus Hub...' : 'Join CommonGround'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
