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
    label: 'New',
    title: 'New account',
    description: 'Recently joined. College affiliation is self-reported until institutional verification is completed.',
    badgeClass: 'bg-[var(--surface-2)] border-transparent text-[var(--text-secondary)]',
    icon: ShieldAlert,
    iconColor: 'text-[var(--text-muted)]',
  },
  STAGE_2_COMMUNITY_VALIDATED: {
    label: 'Vouched',
    title: 'Peer vouched',
    description: 'A peer endorsement has been recorded for this account.',
    badgeClass: 'bg-[var(--surface-2)] border-transparent text-[var(--text-secondary)]',
    icon: CheckCircle2,
    iconColor: 'text-[var(--accent)]',
  },
  STAGE_3_INSTITUTIONAL_VERIFIED: {
    label: 'Verified',
    title: 'Institutionally verified',
    description: 'Institutional verification has been completed through an approved review process.',
    badgeClass: 'bg-[var(--surface-2)] border-transparent text-[var(--text)]',
    icon: ShieldCheck,
    iconColor: 'text-[var(--success)]',
  },
  STAGE_4_OFFICIAL_PARTNER: {
    label: 'Institutional partner',
    title: 'Authorized institutional account',
    description: 'This account has been authorized to represent a college or department.',
    badgeClass: 'bg-[var(--surface-2)] border-transparent text-[var(--text-secondary)]',
    icon: Building2,
    iconColor: 'text-[var(--text-secondary)]',
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
