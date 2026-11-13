'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Application route failed', { digest: error.digest }); }, [error]);
  return <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 text-center"><h1 className="text-3xl font-semibold">Something went wrong.</h1><p className="text-sm text-[var(--text-secondary)]">The page could not be loaded. Try again, or return to CommonGround.</p><div className="flex flex-wrap justify-center gap-3"><button onClick={reset} className="btn-primary">Try again</button><Link href="/" className="text-link">Go home</Link></div>{error.digest && <p className="text-xs text-[var(--text-muted)]">Reference: {error.digest}</p>}</main>;
}
