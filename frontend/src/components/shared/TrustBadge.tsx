'use client';

import React, { useState } from 'react';
import { VerificationStage } from '@/types';
import { ShieldCheck, ShieldAlert, CheckCircle2, Building2, X } from 'lucide-react';

interface TrustBadgeProps {
  stage: VerificationStage;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  interactive?: boolean;
}

const TIER_DETAILS = {
  STAGE_1_PROVISIONAL: {
    label: 'Provisional',
    title: 'Provisional Student Account',
    description: 'Registered with a personal email. College affiliation is self-reported and pending institutional verification.',
    badgeClass: 'bg-white/5 border-white/15 text-slate-300',
    icon: ShieldAlert,
    iconColor: 'text-amber-400',
  },
  STAGE_2_COMMUNITY_VALIDATED: {
    label: 'Peer-Validated',
    title: 'Peer-Validated Student',
    description: 'Vouched for by campus club leads, ambassadors, or trusted peer invite codes.',
    badgeClass: 'bg-amber-500/10 border-amber-400/30 text-amber-200',
    icon: CheckCircle2,
    iconColor: 'text-amber-400',
  },
  STAGE_3_INSTITUTIONAL_VERIFIED: {
    label: 'Verified Student',
    title: 'Institutional Verified Student',
    description: 'Cryptographically authenticated with an official college email (.edu.in or .ac.in).',
    badgeClass: 'bg-amber-500/15 border-amber-400/50 text-amber-300 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.15)]',
    icon: ShieldCheck,
    iconColor: 'text-amber-400',
  },
  STAGE_4_OFFICIAL_PARTNER: {
    label: 'Official Campus',
    title: 'Official Campus Account',
    description: 'Verified department, college administration, or authorized student council.',
    badgeClass: 'bg-amber-500/20 border-amber-400/60 text-amber-100 font-bold',
    icon: Building2,
    iconColor: 'text-amber-300',
  },
};

export function TrustBadge({
  stage,
  size = 'md',
  showLabel = true,
  interactive = true,
}: TrustBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = TIER_DETAILS[stage] || TIER_DETAILS.STAGE_1_PROVISIONAL;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-xs px-3 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          if (!interactive) return;
          e.preventDefault();
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
        className={`neo-badge inline-flex items-center border transition-all duration-150 ${config.badgeClass} ${sizeClasses} ${
          interactive ? 'cursor-pointer hover:border-amber-400/60' : 'cursor-default'
        }`}
        title={config.title}
      >
        <Icon className={`${iconSizes} ${config.iconColor} shrink-0`} />
        {showLabel && (
          <span className="truncate">
            {config.label}
          </span>
        )}
      </button>

      {/* Accessible Interactive Popover */}
      {showTooltip && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
          />
          <div className="absolute left-0 top-full mt-2 z-50 w-64 p-4 rounded-xl bg-[#12151F] border border-white/15 shadow-2xl backdrop-blur-2xl text-left animate-entrance">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 font-display text-xs font-bold text-white">
                <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
                <span>{config.title}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(false);
                }}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] font-sans text-slate-300 leading-relaxed">
              {config.description}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
