'use client';

import React, { useEffect } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Layout Error Caught]:', error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="bg-[#0A0C12] text-[#F8F7FF] antialiased min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-xl border border-rose-500/30 bg-[#12151F] text-center shadow-2xl space-y-5">
          <div className="w-14 h-14 rounded-xl bg-rose-500/10 border border-rose-400/30 flex items-center justify-center mx-auto text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
            <AlertOctagon className="w-7 h-7" />
          </div>

          <div>
            <span className="neo-badge text-[10px] bg-rose-500/15 text-rose-300 border-rose-400/30">
              CORE SYSTEM RECOVERY
            </span>
            <h1 className="text-xl font-bold text-white mt-2 mb-1.5 font-display">
              Critical Layout Interruption
            </h1>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              The root layout crashed before rendering. Recover the session by reloading the application shell.
            </p>
          </div>

          {error?.digest && (
            <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-[10px] font-mono text-slate-400 select-all break-all">
              Digest: {error.digest}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => reset()}
              className="btn-campus-amber w-full py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
