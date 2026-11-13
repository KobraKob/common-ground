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
    <div className="relative overflow-hidden rounded-3xl border border-purple-400/30 shadow-2xl min-h-[220px] md:min-h-[260px] flex flex-col justify-between p-6 md:p-8 bg-[#090422]">
      {/* Background Reference Image Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-screen scale-105"
        style={{
          backgroundImage: `url('/assets/celestial-campus-nightscape.png')`,
        }}
      />

      {/* Atmospheric High-res SVG Overlay Fallback / Enhancer */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0B0524" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#2E1065" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#050214" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="windowGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#skyGrad)" />

        {/* Lit Campus Window Silhouettes in the distance */}
        <g opacity="0.35" transform="translate(0, 130)">
          <rect x="5%" y="40" width="80" height="70" fill="#0B0524" />
          <rect x="7%" y="48" width="6" height="8" fill="url(#windowGlow)" />
          <rect x="16%" y="48" width="6" height="8" fill="url(#windowGlow)" />
          <rect x="40%" y="20" width="110" height="90" fill="#0B0524" />
          <rect x="42%" y="28" width="7" height="10" fill="url(#windowGlow)" />
          <rect x="52%" y="28" width="7" height="10" fill="url(#windowGlow)" />
          <rect x="80%" y="30" width="90" height="80" fill="#0B0524" />
          <rect x="83%" y="38" width="6" height="9" fill="url(#windowGlow)" />
          <rect x="91%" y="38" width="6" height="9" fill="url(#windowGlow)" />
        </g>
      </svg>

      {/* Legibility Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#07031A] via-[#0E062B]/75 to-transparent pointer-events-none" />

      {/* Top Floating Starlight Pill */}
      <div className="relative z-10 flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#160B3E]/80 border border-purple-400/30 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.25)]">
          <span className="w-2 h-2 rounded-full bg-[#FBBF24] animate-pulse shadow-[0_0_8px_#FBBF24]" />
          <span className="text-[11px] font-mono font-semibold tracking-wider text-[#FDE68A] uppercase">
            {badgeText}
          </span>
        </div>

        {shortCode && (
          <div className="neo-badge text-[10px] bg-[#1F1147]/80 text-[#C4B5FD] border-purple-400/40">
            {shortCode}
          </div>
        )}
      </div>

      {/* Center Headline & Content */}
      <div className="relative z-10 my-3">
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-celestial-gradient drop-shadow-md">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-xs md:text-sm text-[#C4B5FD] font-sans max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="relative z-10 pt-3 border-t border-purple-400/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
          {showActiveCount && activeCount !== undefined && (
            <div className="flex items-center gap-1.5 text-[#FDE68A]">
              <Users className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>{activeCount} Active Students</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[#C4B5FD]">
            {isOfficial ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[#FBBF24]" />
                <span className="text-amber-300">Official Partner Space</span>
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
