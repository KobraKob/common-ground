'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Root application failed', { digest: error.digest }); }, [error]);
  return <html lang="en"><body style={{ margin: 0, background: '#000', color: '#f5f5f7', fontFamily: 'system-ui,sans-serif' }}><main style={{ minHeight: '100vh', display: 'grid', placeContent: 'center', padding: 24, textAlign: 'center' }}><h1>CommonGround could not load.</h1><p>Please try again.</p><button onClick={reset} style={{ minHeight: 44, border: 0, borderRadius: 999, padding: '0 24px', background: '#0a84ff', color: '#fff' }}>Try again</button></main></body></html>;
}
