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
    <header className="cg-page-hero">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="cg-eyebrow">{badgeText}</p>
        {shortCode && <span className="text-xs font-medium tracking-wide cg-muted">{shortCode}</span>}
      </div>

      <div className="mt-3 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <h1>{title}</h1>
          {subtitle && <p className="mt-3 text-sm sm:text-base">{subtitle}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs cg-muted">
            {showActiveCount && activeCount !== undefined && (
              <span className="inline-flex items-center gap-1.5"><Users size={14} aria-hidden="true"/>{activeCount} students active</span>
            )}
            <span className="inline-flex items-center gap-1.5">
              {isOfficial ? <ShieldCheck size={14} aria-hidden="true"/> : <ShieldAlert size={14} aria-hidden="true"/>}
              {isOfficial ? 'Official partner space' : 'Student-led space'}
            </span>
          </div>
        </div>
        {actionSlot && <div className="flex shrink-0 flex-wrap items-center gap-2">{actionSlot}</div>}
      </div>
    </header>
  );
}
