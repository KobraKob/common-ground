import Link from 'next/link';

export function GlobalFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-[var(--cg-border)] px-4 pt-7 pb-24 md:pb-7 text-xs cg-muted">
      <span>CommonGround · Bengaluru</span>
      <nav aria-label="Legal and product information" className="flex flex-wrap items-center gap-5">
        <Link href="/privacy" className="min-h-11 inline-flex items-center hover:text-[var(--cg-text)]">Privacy</Link>
        <Link href="/terms" className="min-h-11 inline-flex items-center hover:text-[var(--cg-text)]">Terms</Link>
        <Link href="/discover" className="min-h-11 inline-flex items-center hover:text-[var(--cg-text)]">Discover</Link>
      </nav>
    </footer>
  );
}
