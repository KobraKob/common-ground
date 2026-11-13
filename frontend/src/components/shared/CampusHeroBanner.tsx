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
    <div className="relative overflow-hidden rounded-2xl border border-[var(--cg-border)] min-h-[200px] flex flex-col justify-between p-6 sm:p-8 bg-[var(--cg-surface)]">
      {/* Top Bar with Badge */}
      <div className="relative z-10 flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--cg-elevated)] border border-[var(--cg-border)]">
          <span className="w-2 h-2 rounded-full bg-[var(--cg-accent)]" />
          <span className="text-xs font-semibold tracking-wide text-[var(--cg-accent)]">
            {badgeText}
          </span>
        </div>

        {shortCode && (
          <div className="rounded-full px-3 py-1 text-xs bg-[var(--cg-elevated)] text-[var(--cg-muted)] border border-[var(--cg-border)]">
            {shortCode}
          </div>
        )}
      </div>

      {/* Headline & Subtitle */}
      <div className="relative z-10 my-4">
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[var(--cg-text)]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm text-[var(--cg-muted)] font-sans max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Bottom Status & Action Bar */}
      <div className="relative z-10 pt-4 border-t border-[var(--cg-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
          {showActiveCount && activeCount !== undefined && (
            <div className="flex items-center gap-1.5 text-[var(--cg-accent)]">
              <Users className="w-3.5 h-3.5 text-[var(--cg-accent)]" />
              <span>{activeCount} Students in this campus</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[var(--cg-muted)]">
            {isOfficial ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--cg-accent)]" />
                <span className="text-[var(--cg-accent)] font-medium">Official Partner Space</span>
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
