'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/queryClient';
import { usePerformanceMonitoring } from '@/lib/monitoring';
import { isAuthenticated, trackAnalyticsEvent } from '@/lib/api';

const trackedSurfaces = new Set(['city', 'campus', 'commons', 'build', 'discover', 'messages', 'profile', 'passport']);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => getQueryClient());
  const pathname = usePathname();
  usePerformanceMonitoring();

  useEffect(() => {
    if (!isAuthenticated()) return;
    const firstSegment = pathname.split('/').filter(Boolean)[0] || 'landing';
    const surface = trackedSurfaces.has(firstSegment) ? firstSegment : 'landing';
    void trackAnalyticsEvent('page_view', surface as Parameters<typeof trackAnalyticsEvent>[1]);
  }, [pathname]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
