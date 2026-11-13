import React from 'react';
import Link from 'next/link';
import { Compass, Search, ArrowLeft, Building2, BookOpen, Layers } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full p-8 sm:p-10 rounded-xl celestial-card border border-white/10 bg-[#12151F]/90 shadow-2xl text-center space-y-6">
        {/* Radar Icon */}
        <div className="w-16 h-16 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center mx-auto text-[#FBBF24] shadow-[0_0_24px_rgba(245,158,11,0.2)]">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        {/* Status & Title */}
        <div className="space-y-2">
          <span className="neo-badge text-[10px] bg-amber-500/15 text-[#FDE68A] border-amber-400/30">
            ERROR 404 // QUADRANT NOT FOUND
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F8F7FF] tracking-tight">
            Lost in the Bengaluru Mesh
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-sans leading-relaxed max-w-sm mx-auto">
            The page, channel, or campus vault you were looking for doesn&apos;t exist or has moved to an updated semester coordinate.
          </p>
        </div>

        {/* Quick Route Shortcuts */}
        <div className="grid grid-cols-2 gap-2 text-left pt-2">
          <Link
            href="/city"
            className="p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-400/40 hover:bg-amber-500/5 transition-all group"
          >
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white mb-0.5 group-hover:text-amber-300">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>City Feed</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Cross-campus updates & spotlight
            </p>
          </Link>

          <Link
            href="/campus"
            className="p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-400/40 hover:bg-amber-500/5 transition-all group"
          >
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white mb-0.5 group-hover:text-amber-300">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Campus Radar</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              RVCE, PESU, BMSCE & Christ
            </p>
          </Link>

          <Link
            href="/commons"
            className="p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-400/40 hover:bg-amber-500/5 transition-all group"
          >
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white mb-0.5 group-hover:text-amber-300">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Commons</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Course Q&amp;A and verified notes
            </p>
          </Link>

          <Link
            href="/build"
            className="p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-400/40 hover:bg-amber-500/5 transition-all group"
          >
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white mb-0.5 group-hover:text-amber-300">
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>Build Teams</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Hackathon teammates & projects
            </p>
          </Link>
        </div>

        {/* Return Button */}
        <div className="pt-2">
          <Link
            href="/"
            className="btn-campus-amber inline-flex items-center gap-2 text-xs font-mono font-bold px-6 py-2.5 shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to CommonGround Base</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
