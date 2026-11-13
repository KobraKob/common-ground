'use client';

import { useEffect } from 'react';

export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export function reportMetric(metric: WebVitalsMetric) {
  if (process.env.NODE_ENV !== 'production') {
    const color = metric.rating === 'good' ? '#34D399' : metric.rating === 'poor' ? '#F43F5E' : '#FBBF24';
    console.log(
      `%c[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`,
      `color: ${color}; font-weight: bold; font-family: monospace;`
    );
  }
}

/**
 * Initializes Core Web Vitals observation (LCP, CLS, INP/FID, FCP, TTFB)
 */
export function initWebVitals() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    // 1. First Contentful Paint (FCP)
    const paintObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          const val = entry.startTime;
          reportMetric({
            name: 'FCP',
            value: val,
            rating: val < 1800 ? 'good' : val < 3000 ? 'needs-improvement' : 'poor',
          });
        }
      }
    });
    paintObserver.observe({ type: 'paint', buffered: true });

    // 2. Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        const val = lastEntry.startTime;
        reportMetric({
          name: 'LCP',
          value: val,
          rating: val < 2500 ? 'good' : val < 4000 ? 'needs-improvement' : 'poor',
        });
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // 3. Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value || 0;
        }
      }
      reportMetric({
        name: 'CLS',
        value: clsValue,
        rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
      });
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (err) {
    // Ignore observer registration failures in unsupported browser environments
  }
}

/**
 * Client-side hook to initialize web vitals observation
 */
export function usePerformanceMonitoring() {
  useEffect(() => {
    initWebVitals();
  }, []);
}
