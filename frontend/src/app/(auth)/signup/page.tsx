'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';
import { getColleges, signupUser } from '@/lib/api';
import { BENGALURU_COLLEGES, detectCollegeFromEmail } from '@/constants/colleges';
import { College } from '@/types';
import { TrustBadge } from '@/components/shared/TrustBadge';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campusParam = searchParams.get('campus');

  const [colleges, setColleges] = useState<College[]>(BENGALURU_COLLEGES);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pre-select campus if passed in URL query param
  useEffect(() => {
    async function loadColleges() {
      const list = await getColleges();
      if (list && list.length > 0) setColleges(list);

      if (campusParam) {
        const found = (list || BENGALURU_COLLEGES).find(
          (c) => c.slug.toLowerCase() === campusParam.toLowerCase()
        );
        if (found) setSelectedCollegeId(found.id);
      }
    }
    loadColleges();
  }, [campusParam]);

  // Intelligent domain detection:
  // When user enters name@rvce.edu.in -> detects RVCE & unlocks Verified Student status automatically!
  const detectedCollege = detectCollegeFromEmail(email);

  useEffect(() => {
    if (detectedCollege) {
      setSelectedCollegeId(detectedCollege.id);
    }
  }, [detectedCollege]);

  // Auto-suggest display name from email if not already typed
  const handleEmailChange = (val: string) => {
    setEmail(val);
    const prefix = val.split('@')[0].trim();
    if (prefix && (!displayName || displayName === val.slice(0, -1))) {
      const formatted = prefix
        .replace(/[._0-9]/g, ' ')
        .trim()
        .replace(/\b\w/g, (l) => l.toUpperCase());
      if (formatted) setDisplayName(formatted);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    const resolvedCollegeId = detectedCollege?.id || selectedCollegeId || colleges[0]?.id;
    const resolvedName = displayName.trim() || cleanEmail.split('@')[0] || 'Student Builder';
    const cleanHandle = cleanEmail
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 30) || `student_${Math.floor(Math.random() * 9000 + 1000)}`;

    setIsSubmitting(true);
    try {
      const res = await signupUser({
        email: cleanEmail,
        password,
        handle: cleanHandle,
        display_name: resolvedName,
        college_id: resolvedCollegeId,
        skills: [],
        interests: [],
      });

      setSuccessMsg(`Welcome to CommonGround, @${res.profile.handle}! Directing you to the live feed...`);
      setTimeout(() => {
        router.push('/city');
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.detail || err?.message || 'Failed to create student account. Please try another email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isInstitutional = !!detectedCollege;

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <div className="celestial-card p-6 sm:p-8 border border-white/10 bg-[#12151F]/95 rounded-xl relative overflow-hidden shadow-2xl backdrop-blur-2xl">
        {/* Amber accent warmth */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 group mb-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-[#FBBF24] font-display font-extrabold text-base shadow-[0_0_15px_rgba(251,191,36,0.25)] transition-transform group-hover:scale-105">
              CG
            </div>
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F8F7FF] tracking-tight">
            Join <span className="text-[#FBBF24]">CommonGround</span>
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Connect across Bengaluru&apos;s student network in 30 seconds
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-400/30 flex items-center gap-2 text-rose-300 text-xs font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center gap-2 text-emerald-300 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Two-Field Fast Signup Form (Apple HIG Principle) */}
        <form onSubmit={handleSignup} className="space-y-4">
          {/* 1. Email Field with Instant Campus Detection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300">
                College or Personal Email
              </label>
              {isInstitutional && (
                <span className="text-[10px] font-mono text-emerald-300 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{detectedCollege.short_name} Verified</span>
                </span>
              )}
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="you@rvce.edu.in (or personal email)"
                className="celestial-input w-full text-xs font-mono py-2.5 pl-10 pr-3 text-[#F8F7FF] placeholder:text-slate-500 rounded-xl border border-white/10 bg-[#0E1017] focus:border-amber-400"
                required
                autoFocus
              />
            </div>

            {/* Smart Detection Feedback Pill */}
            {detectedCollege ? (
              <div className="mt-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-between text-[11px] font-mono text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{detectedCollege.name} detected</span>
                </span>
                <TrustBadge stage="STAGE_3_INSTITUTIONAL_VERIFIED" size="sm" interactive={false} />
              </div>
            ) : email.includes('@') ? (
              <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-400/25 flex items-center justify-between text-[11px] font-mono text-amber-300">
                <span>Personal email (Provisional status)</span>
                <TrustBadge stage="STAGE_1_PROVISIONAL" size="sm" interactive={false} />
              </div>
            ) : null}
          </div>

          {/* If personal email or no detected college, choose campus simply */}
          {!detectedCollege && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Select Your Bengaluru Campus:
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedCollegeId}
                  onChange={(e) => setSelectedCollegeId(e.target.value)}
                  className="celestial-input w-full text-xs font-mono py-2.5 pl-10 pr-8 text-[#F8F7FF] cursor-pointer appearance-none rounded-xl border border-white/10 bg-[#0E1017] focus:border-amber-400"
                >
                  {colleges.map((col) => (
                    <option key={col.id} value={col.id} className="bg-[#0E1017] text-white">
                      {col.name} ({col.short_name})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 2. Password Field (Single field with show/hide toggle as per Apple HIG) */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="celestial-input w-full text-xs font-mono py-2.5 pl-10 pr-10 text-[#F8F7FF] placeholder:text-slate-500 rounded-xl border border-white/10 bg-[#0E1017] focus:border-amber-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Optional Display Name (Auto-suggested from email, easily editable) */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Your Name <span className="text-[10px] text-slate-400 lowercase font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Aarav Patel"
              className="celestial-input w-full text-xs font-mono py-2 px-3 text-[#F8F7FF] placeholder:text-slate-500 rounded-xl border border-white/10 bg-[#0E1017] focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-campus-amber w-full py-3 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 font-bold shadow-lg mt-2 rounded-xl"
          >
            <span>{isSubmitting ? 'Creating Account...' : 'Get Started Free'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/10 text-center">
          <p className="text-xs font-mono text-slate-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-[#FBBF24] hover:underline font-semibold"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto py-12 text-center text-xs font-mono text-slate-400">
        Loading signup...
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
