'use client';

import React, { useEffect } from 'react';

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
      <body className="bg-[#050214] text-[#F8F7FF] antialiased min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl border border-rose-500/30 bg-[#120836] text-center shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-2 font-mono">
            Application Error
          </h2>
          <p className="text-sm text-purple-200 mb-6 font-sans">
            A critical system error occurred. Please refresh or reset.
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
