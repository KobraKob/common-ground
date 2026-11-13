'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Route Error Caught]:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-3xl celestial-card border border-rose-500/30 bg-[#120836]/90 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-rose-950/60 border border-rose-400/40 flex items-center justify-center mx-auto mb-4 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
          <AlertCircle className="w-8 h-8" />
        </div>

        <h2 className="font-display text-2xl font-bold text-[#F8F7FF] mb-2">
          Page Crashed Safely
        </h2>

        <p className="text-sm text-[#C4B5FD] font-sans mb-6 leading-relaxed">
          An isolated error prevented this view from rendering completely. You can retry or head back to the main campus pulse.
        </p>

        {error?.digest && (
          <div className="mb-6 p-2 rounded-lg bg-black/40 border border-purple-900/50 text-[10px] font-mono text-purple-300 select-all">
            Digest: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto btn-campus-amber text-xs font-mono px-5 py-2.5 flex items-center justify-center gap-2 font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border border-purple-400/30 bg-purple-950/60 hover:bg-purple-900/50 text-xs font-mono text-[#F8F7FF] flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-3.5 h-3.5 text-amber-300" />
            <span>Go to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
