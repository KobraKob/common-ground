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
      setErrorMsg('Please enter your email or student handle');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password');
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
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.detail || err?.message || 'Invalid credentials. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <div className="celestial-card p-6 sm:p-8 border border-purple-400/30 relative overflow-hidden shadow-2xl backdrop-blur-2xl">
        {/* Glow corner accent */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 group mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2E1065] to-[#120836] border border-amber-400/40 flex items-center justify-center text-[#FBBF24] font-display font-extrabold text-base shadow-[0_0_15px_rgba(251,191,36,0.35)] transition-transform group-hover:scale-105">
              CG
            </div>
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F8F7FF] tracking-tight">
            Sign In to <span className="text-celestial-gradient">CommonGround</span>
          </h1>
          <p className="text-xs font-mono text-[#C4B5FD] mt-1">
            Access Bengaluru's Cross-Campus Student Network
          </p>
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

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1.5">
              Email or Student Handle
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={loginTerm}
                onChange={(e) => setLoginTerm(e.target.value)}
                placeholder="handle or student@rvce.edu.in"
                className="celestial-input w-full text-xs font-mono py-2.5 pl-9 pr-3 text-[#F8F7FF]"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD]">
                Password
              </label>
              <span className="text-[10px] font-mono text-[#7C6FA6] cursor-pointer hover:text-amber-300 transition-colors">
                Forgot password?
              </span>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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

          <button
            type="submit"
            disabled={loading}
            className="btn-campus-amber w-full py-2.5 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 font-bold shadow-lg mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Campus Radar'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-purple-500/20 text-center">
          <p className="text-xs font-mono text-[#C4B5FD]">
            New to CommonGround?{' '}
            <Link
              href="/signup"
              className="text-[#FDE68A] hover:underline font-semibold"
            >
              Create student account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
