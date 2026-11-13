'use client';

import React from 'react';
import { Users, ShieldAlert, ShieldCheck } from 'lucide-react';

interface CampusHeroBannerProps {
  title: string;
  badgeText?: string;
  subtitle?: string;
  shortCode?: string;
  activeCount?: number;
  showActiveCount?: boolean;
  isOfficial?: boolean;
  actionSlot?: React.ReactNode;
}

export function CampusHeroBanner({
  title,
  badgeText = 'BENGALURU CAMPUS NETWORK',
  subtitle,
  shortCode,
  activeCount,
  showActiveCount = false,
  isOfficial = false,
  actionSlot,
}: CampusHeroBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 shadow-xl min-h-[200px] flex flex-col justify-between p-6 sm:p-8 bg-[#12151F]">
      {/* Subtle Ambient Radial Highlight */}
      <div
        className="absolute -top-24 right-0 w-96 h-96 rounded-full opacity-15 filter blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, transparent 70%)',
        }}
      />

      {/* Top Bar with Badge */}
      <div className="relative z-10 flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#F59E0B]" />
          <span className="text-[11px] font-mono font-semibold tracking-wider text-amber-300 uppercase">
            {badgeText}
          </span>
        </div>

        {shortCode && (
          <div className="neo-badge text-[10px] bg-white/5 text-slate-300 border border-white/10">
            {shortCode}
          </div>
        )}
      </div>

      {/* Headline & Subtitle */}
      <div className="relative z-10 my-4">
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-xs sm:text-sm text-slate-400 font-sans max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Bottom Status & Action Bar */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
          {showActiveCount && activeCount !== undefined && (
            <div className="flex items-center gap-1.5 text-amber-300">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>{activeCount} Active Students</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-slate-300">
            {isOfficial ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300 font-medium">Official Partner Space</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Student-Led Campus Space</span>
              </>
            )}
          </div>
        </div>

        {actionSlot && (
          <div className="flex items-center gap-2">
            {actionSlot}
          </div>
        )}
      </div>
    </div>
  );
}
