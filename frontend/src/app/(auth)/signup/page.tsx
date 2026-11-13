'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  UserCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { getColleges, signupUser } from '@/lib/api';
import { College } from '@/types';

export default function SignupPage() {
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [courseBranch, setCourseBranch] = useState('B.E. Computer Science');
  const [gradYear, setGradYear] = useState(2028);
  const [skills, setSkills] = useState('Python, Next.js, FastAPI');
  const [interests, setInterests] = useState('Hackathons, Robotics, AI');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadColleges() {
      const list = await getColleges();
      setColleges(list);
      if (list.length > 0) setSelectedCollegeId(list[0].id);
    }
    loadColleges();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!displayName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!handle.trim()) {
      setErrorMsg('Please choose a student handle');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please provide a valid email address');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const skillsArr = skills.split(',').map((s) => s.trim()).filter(Boolean);
      const interestsArr = interests.split(',').map((i) => i.trim()).filter(Boolean);

      const res = await signupUser({
        email: email.trim().toLowerCase(),
        password,
        handle: handle.trim().toLowerCase().replace('@', ''),
        display_name: displayName.trim(),
        college_id: selectedCollegeId || undefined,
        course_branch: courseBranch,
        graduation_year: Number(gradYear),
        skills: skillsArr,
        interests: interestsArr,
      });

      setSuccessMsg(`Account created for @${res.profile.handle}! Directing you to the Bengaluru pulse radar...`);
      setTimeout(() => {
        router.push('/city');
      }, 900);
    } catch (err: any) {
      setErrorMsg(err?.detail || err?.message || 'Failed to create student account. Please try another handle or email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCollege = colleges.find((c) => c.id === selectedCollegeId);
  const isInstitutionalEmail = email.toLowerCase().endsWith('.edu.in') || email.toLowerCase().endsWith('.ac.in');

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="celestial-card p-6 md:p-8 border border-purple-400/30 relative overflow-hidden shadow-2xl backdrop-blur-2xl">
        {/* Glow corners */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 group mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2E1065] to-[#120836] border border-amber-400/50 flex items-center justify-center text-[#FBBF24] font-display font-extrabold text-lg shadow-[0_0_20px_rgba(251,191,36,0.35)] transition-transform group-hover:scale-105">
              CG
            </div>
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F8F7FF] tracking-tight">
            Create Your <span className="text-celestial-gradient">Student Account</span>
          </h1>
          <p className="text-xs font-mono text-[#C4B5FD] mt-1">
            Join thousands of student builders across Bengaluru campuses
          </p>
        </div>

        {/* Staged Trust Model Disclosure */}
        <div className={`mb-6 p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 ${
          isInstitutionalEmail
            ? 'bg-emerald-500/10 border-emerald-400/40'
            : 'bg-amber-500/10 border-amber-400/30'
        }`}>
          {isInstitutionalEmail ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs font-mono leading-relaxed">
            <span className={`font-bold uppercase tracking-wider block mb-1 ${
              isInstitutionalEmail ? 'text-emerald-300' : 'text-amber-300'
            }`}>
              {isInstitutionalEmail
                ? '✦ Stage 3: Instant Institutional Verification Detected!'
                : 'Stage 1: Provisional Status Disclosure'}
            </span>
            {isInstitutionalEmail ? (
              <span className="text-emerald-200">
                Your email matches an accredited academic institution domain. You will receive the <strong>"Verified Student"</strong> badge immediately upon registration.
              </span>
            ) : (
              <span className="text-amber-200">
                Registering with personal email grants provisional student access (badge: <strong>"Provisional Student — Self-Reported"</strong>). You can link an institutional <code>.edu.in</code> email at any time to upgrade.
              </span>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-400/30 flex items-center gap-2 text-rose-300 text-xs font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center gap-2 text-emerald-300 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1">
                Full Display Name:
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Aarav Patel"
                className="celestial-input w-full text-xs font-mono py-2.5 px-3 text-[#F8F7FF]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1">
                Unique Student Handle:
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 font-mono text-xs">
                  @
                </span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="aarav_builder"
                  className="celestial-input w-full text-xs font-mono py-2.5 pl-7 pr-3 text-[#F8F7FF]"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1">
              Email Address:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@rvce.edu.in (or personal email)"
                className="celestial-input w-full text-xs font-mono py-2.5 pl-9 pr-3 text-[#F8F7FF]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1">
                Password:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="celestial-input w-full text-xs font-mono py-2.5 pl-9 pr-10 text-[#F8F7FF]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1">
                Confirm Password:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="celestial-input w-full text-xs font-mono py-2.5 pl-9 pr-3 text-[#F8F7FF]"
                  required
                />
              </div>
            </div>
          </div>

          {/* College Selection */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1">
              Select Your Bengaluru College / Campus:
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedCollegeId}
                onChange={(e) => setSelectedCollegeId(e.target.value)}
                className="celestial-input w-full text-xs font-mono py-2.5 pl-9 pr-8 text-[#F8F7FF] cursor-pointer appearance-none bg-[#090420]"
              >
                {colleges.map((col) => (
                  <option key={col.id} value={col.id} className="bg-[#090420] text-white">
                    {col.name} ({col.short_name}) — Bengaluru
                  </option>
                ))}
              </select>
            </div>
            {selectedCollege && (
              <p className="text-[10px] font-mono text-[#7C6FA6] mt-1">
                Accepted institutional domains: {selectedCollege.email_domains.join(', ')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1">
                Course & Major:
              </label>
              <input
                type="text"
                value={courseBranch}
                onChange={(e) => setCourseBranch(e.target.value)}
                placeholder="B.E. Computer Science"
                className="celestial-input w-full text-xs font-mono py-2 px-3 text-[#F8F7FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1">
                Graduation Year:
              </label>
              <select
                value={gradYear}
                onChange={(e) => setGradYear(Number(e.target.value))}
                className="celestial-input w-full text-xs font-mono py-2 px-3 text-[#F8F7FF] bg-[#090420]"
              >
                {[2025, 2026, 2027, 2028, 2029].map((yr) => (
                  <option key={yr} value={yr} className="bg-[#090420] text-white">
                    Class of {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1">
              Skills (comma separated):
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Python, React, Figma, C++, PyTorch"
              className="celestial-input w-full text-xs font-mono py-2 px-3 text-[#F8F7FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1">
              Collaboration Interests:
            </label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="Hackathons, Robotics, Study Groups, Open Source"
              className="celestial-input w-full text-xs font-mono py-2 px-3 text-[#F8F7FF]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-campus-amber w-full py-3 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 font-bold shadow-xl mt-3"
          >
            <span>{isSubmitting ? 'Creating Student Profile...' : 'Complete Registration & Join Pulse'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-purple-500/20 text-center">
          <p className="text-xs font-mono text-[#C4B5FD]">
            Already registered on CommonGround?{' '}
            <Link
              href="/login"
              className="text-[#FDE68A] hover:underline font-semibold"
            >
              Sign in to your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}