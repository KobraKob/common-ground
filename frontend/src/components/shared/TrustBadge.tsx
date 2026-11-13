'use client';

import React, { useState } from 'react';
import { VerificationStage } from '@/types';
import { ShieldCheck, ShieldAlert, CheckCircle2, Building2, Info, X } from 'lucide-react';

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
    badgeClass: 'bg-amber-500/15 border-amber-400/40 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
    icon: ShieldAlert,
    iconColor: 'text-amber-400',
  },
  STAGE_2_COMMUNITY_VALIDATED: {
    label: 'Peer-Validated',
    title: 'Peer-Validated Student',
    description: 'Vouched for by campus club leads, ambassadors, or trusted peer invite codes.',
    badgeClass: 'bg-sky-500/15 border-sky-400/40 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.15)]',
    icon: CheckCircle2,
    iconColor: 'text-sky-400',
  },
  STAGE_3_INSTITUTIONAL_VERIFIED: {
    label: 'Verified Student',
    title: 'Institutional Verified Student',
    description: 'Cryptographically authenticated with an official college email (.edu.in or .ac.in).',
    badgeClass: 'bg-purple-500/20 border-purple-400/50 text-purple-100 shadow-[0_0_14px_rgba(168,85,247,0.25)] font-semibold',
    icon: ShieldCheck,
    iconColor: 'text-amber-300',
  },
  STAGE_4_OFFICIAL_PARTNER: {
    label: 'Official Institution',
    title: 'Official Campus Account',
    description: 'Verified department, college administration, or authorized student council.',
    badgeClass: 'bg-gradient-to-r from-amber-500/20 to-purple-600/20 border-amber-300/50 text-amber-100 shadow-[0_0_15px_rgba(251,191,36,0.2)] font-bold',
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
          interactive ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'
        }`}
        title={config.title}
      >
        <Icon className={`${iconSizes} ${config.iconColor} shrink-0`} />
        {showLabel && (
          <span className="truncate">
            {config.label}
            {stage === 'STAGE_3_INSTITUTIONAL_VERIFIED' && (
              <span className="text-[#FDE68A] ml-1">✦</span>
            )}
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
          <div className="absolute left-0 top-full mt-1.5 z-50 w-64 p-3.5 rounded-2xl bg-[#0F082A]/95 border border-purple-400/35 shadow-[0_12px_32px_rgba(0,0,0,0.65)] backdrop-blur-2xl text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 font-display text-xs font-bold text-[#F8F7FF]">
                <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
                <span>{config.title}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(false);
                }}
                className="text-[#7C6FA6] hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] font-sans text-[#C4B5FD] leading-relaxed">
              {config.description}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
