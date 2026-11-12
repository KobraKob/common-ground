'use client';

import React from 'react';
import { VerificationStage } from '@/types';
import { ShieldCheck, ShieldAlert, CheckCircle2, Building2 } from 'lucide-react';

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
          title="Self-reported college affiliation without institutional email verification"
          className={`neo-badge bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 ${size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : ''}`}
        >
          <ShieldAlert className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5 text-amber-500'} />
          {showLabel && <span>Provisional Student</span>}
        </span>
      );

    case 'STAGE_2_COMMUNITY_VALIDATED':
      return (
        <span 
          title="Validated through student campus representatives or peer invite codes"
          className={`neo-badge bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30 ${size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : ''}`}
        >
          <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5 text-sky-500'} />
          {showLabel && <span>Peer-Validated</span>}
        </span>
      );

    case 'STAGE_3_INSTITUTIONAL_VERIFIED':
      return (
        <span 
          title="Verified with official .edu.in / .ac.in institutional college email"
          className={`neo-badge bg-[#C5E17A]/15 text-[#1A1C29] dark:text-[#C5E17A] border-[#C5E17A]/60 font-semibold ${size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : ''}`}
        >
          <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5 text-emerald-600 dark:text-[#C5E17A]'} />
          {showLabel && <span>Verified Student</span>}
        </span>
      );

    case 'STAGE_4_OFFICIAL_PARTNER':
      return (
        <span 
          title="Officially authorized administrative college account"
          className={`neo-badge bg-indigo-500/20 text-indigo-900 dark:text-indigo-200 border-indigo-400/60 ${size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : ''}`}
        >
          <Building2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5 text-indigo-500'} />
          {showLabel && <span>Official Institution</span>}
        </span>
      );

    default:
      return null;
  }
}
