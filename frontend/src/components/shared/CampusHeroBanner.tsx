import React from 'react';

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

export function CampusHeroBanner({ title, badgeText, subtitle, actionSlot }: CampusHeroBannerProps) {
  return <header className="rounded-2xl bg-[var(--surface)] p-6 sm:p-8">
    {badgeText && <p className="text-sm font-semibold text-[var(--accent)]">{badgeText}</p>}
    <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">{subtitle}</p>}
      </div>
      {actionSlot}
    </div>
  </header>;
}
