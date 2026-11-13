'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  KeyRound, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { loginUser } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [loginTerm, setLoginTerm] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginTerm.trim()) {
      setErrorMsg('Please enter your college email or student handle.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await loginUser({
        login: loginTerm.trim(),
        password: password,
      });
      setSuccessMsg(`Welcome back, ${res.profile.display_name}!`);
      setTimeout(() => {
        router.push('/city');
      }, 600);
    } catch (err: any) {
      setErrorMsg(err?.detail || err?.message || 'Invalid credentials. Check your email/handle and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <div className="celestial-card p-6 sm:p-8 border border-white/10 bg-[#12151F]/95 rounded-xl relative overflow-hidden shadow-2xl backdrop-blur-2xl space-y-6">
        {/* Subtle amber ambient warmth */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-[#FBBF24] font-display font-extrabold text-base shadow-[0_0_15px_rgba(251,191,36,0.25)] transition-transform group-hover:scale-105">
              CG
            </div>
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F8F7FF] tracking-tight">
            Sign In to <span className="text-[#FBBF24]">CommonGround</span>
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1.5">
            Bengaluru&apos;s verified cross-campus collaboration mesh
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-400/30 flex items-start gap-2.5 text-rose-300 text-xs font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center gap-2 text-emerald-300 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              College Email or Handle
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={loginTerm}
                onChange={(e) => setLoginTerm(e.target.value)}
                placeholder="handle or name@rvce.edu.in"
                className="celestial-input w-full text-xs font-mono py-2.5 pl-10 pr-3 text-[#F8F7FF] rounded-xl border border-white/10 bg-[#0E1017] focus:border-amber-400"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
                Password
              </label>
              <span className="text-[10px] font-mono text-slate-400 hover:text-amber-300 transition-colors cursor-pointer">
                Forgot password?
              </span>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter account password"
                className="celestial-input w-full text-xs font-mono py-2.5 pl-10 pr-10 text-[#F8F7FF] rounded-xl border border-white/10 bg-[#0E1017] focus:border-amber-400"
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

          <button
            type="submit"
            disabled={loading}
            className="btn-campus-amber w-full py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 font-bold shadow-lg mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Campus Radar'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-white/10 text-center">
          <p className="text-xs font-mono text-slate-400">
            New to CommonGround?{' '}
            <Link href="/signup" className="text-amber-400 font-bold hover:underline">
              Create student account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
