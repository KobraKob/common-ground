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
    label: 'Self-reported',
    title: 'Self-reported affiliation',
    description: 'Joined with a personal email. College affiliation has not been institutionally confirmed.',
    badgeClass: 'bg-[var(--cg-elevated)] border-[var(--cg-border)] text-[var(--cg-muted)]',
    icon: ShieldAlert,
    iconColor: 'text-[var(--cg-muted)]',
  },
  STAGE_2_COMMUNITY_VALIDATED: {
    label: 'Vouched',
    title: 'Community vouched',
    description: 'Confirmed by trusted campus representatives or a verified peer invitation.',
    badgeClass: 'bg-sky-500/10 border-sky-500/25 text-[var(--cg-info)]',
    icon: CheckCircle2,
    iconColor: 'text-[var(--cg-info)]',
  },
  STAGE_3_INSTITUTIONAL_VERIFIED: {
    label: 'Verified',
    title: 'Institutionally verified student',
    description: 'Institutional college email confirmed. This does not imply college endorsement.',
    badgeClass: 'bg-emerald-500/10 border-emerald-500/25 text-[var(--cg-success)] font-semibold',
    icon: ShieldCheck,
    iconColor: 'text-emerald-400',
  },
  STAGE_4_OFFICIAL_PARTNER: {
    label: 'Official',
    title: 'Official institution account',
    description: 'An account authorized by a college, department or student council.',
    badgeClass: 'bg-[var(--cg-elevated)] border-[var(--cg-border)] text-[var(--cg-text)] font-semibold',
    icon: Building2,
    iconColor: 'text-[var(--cg-text)]',
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
    sm: 'text-xs px-2 py-0.5 gap-1',
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
          interactive ? 'min-h-11 cursor-pointer hover:border-[var(--cg-accent)]' : 'min-h-11 cursor-default'
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
          <div className="absolute left-0 top-full mt-2 z-50 w-64 p-4 rounded-xl bg-[var(--cg-surface)] border border-[var(--cg-border)] shadow-2xl text-left animate-entrance">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 font-display text-xs font-semibold text-[var(--cg-text)]">
                <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
                <span>{config.title}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(false);
                }}
                className="text-[var(--cg-muted)] hover:text-[var(--cg-text)] p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] font-sans cg-muted leading-relaxed">
              {config.description}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
