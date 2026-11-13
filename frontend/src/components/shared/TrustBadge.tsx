'use client';

import React from 'react';
import { VerificationStage } from '@/types';
import { ShieldCheck, ShieldAlert, CheckCircle2, Building2, Sparkles } from 'lucide-react';

interface TrustBadgeProps {
  stage: VerificationStage;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function TrustBadge({ stage, size = 'md', showLabel = true }: TrustBadgeProps) {
  switch (stage) {
    case 'STAGE_1_PROVISIONAL':
      return (
        <span 
          title="Provisional Student: Self-reported college affiliation without institutional email verification"
          className={`neo-badge bg-amber-500/15 border border-amber-400/45 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)] ${
            size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
          }`}
        >
          <ShieldAlert className={size === 'sm' ? 'w-3 h-3 text-amber-400' : 'w-3.5 h-3.5 text-amber-400'} />
          {showLabel && <span>Provisional Student</span>}
        </span>
      );

    case 'STAGE_2_COMMUNITY_VALIDATED':
      return (
        <span 
          title="Peer-Validated Student: Validated through campus ambassadors and trusted student vouches"
          className={`neo-badge bg-sky-500/15 border border-sky-400/45 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.2)] ${
            size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
          }`}
        >
          <CheckCircle2 className={size === 'sm' ? 'w-3 h-3 text-sky-400' : 'w-3.5 h-3.5 text-sky-400'} />
          {showLabel && <span>Peer-Validated</span>}
        </span>
      );

    case 'STAGE_3_INSTITUTIONAL_VERIFIED':
      return (
        <span 
          title="Verified Student: Authenticated with official .edu.in or .ac.in institutional college email"
          className={`neo-badge bg-purple-500/20 border border-purple-400/50 text-purple-100 shadow-[0_0_14px_rgba(168,85,247,0.35)] font-semibold ${
            size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
          }`}
        >
          <ShieldCheck className={size === 'sm' ? 'w-3 h-3 text-[#FBBF24]' : 'w-3.5 h-3.5 text-[#FBBF24]'} />
          {showLabel && (
            <span className="flex items-center gap-1">
              Verified Student
              <span className="text-[#FDE68A] text-[10px]">✦</span>
            </span>
          )}
        </span>
      );

    case 'STAGE_4_OFFICIAL_PARTNER':
      return (
        <span 
          title="Official Institution: Verified department or university administration account"
          className={`neo-badge bg-gradient-to-r from-amber-500/25 to-purple-600/25 border border-amber-300/60 text-amber-100 shadow-[0_0_15px_rgba(251,191,36,0.25)] font-bold ${
            size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
          }`}
        >
          <Building2 className={size === 'sm' ? 'w-3 h-3 text-amber-300' : 'w-3.5 h-3.5 text-amber-300'} />
          {showLabel && <span>Official Institution</span>}
        </span>
      );

    default:
      return null;
  }
}
