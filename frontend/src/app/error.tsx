'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

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
    <div className="min-h-[65vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-xl celestial-card border border-rose-500/30 bg-[#12151F]/95 shadow-2xl text-center space-y-5">
        <div className="w-14 h-14 rounded-xl bg-rose-500/10 border border-rose-400/30 flex items-center justify-center mx-auto text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div>
          <span className="neo-badge text-[10px] bg-rose-500/15 text-rose-300 border-rose-400/30">
            ISOLATED COMPONENT ERROR
          </span>
          <h2 className="font-display text-2xl font-bold text-[#F8F7FF] mt-2 mb-1.5">
            Quadrant Paused Safely
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-sans leading-relaxed">
            An unexpected error interrupted this view. Platform safety guards prevented it from cascading to the rest of the application.
          </p>
        </div>

        {error?.digest && (
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-[11px] font-mono text-slate-400 select-all break-all">
            <span className="text-amber-400 font-bold mr-1">Trace Digest:</span>
            {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto btn-campus-amber text-xs font-mono px-5 py-2.5 flex items-center justify-center gap-2 font-bold shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Operation</span>
          </button>

          <Link
            href="/city"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 text-xs font-mono text-[#F8F7FF] flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-3.5 h-3.5 text-amber-400" />
            <span>Go to City Feed</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
