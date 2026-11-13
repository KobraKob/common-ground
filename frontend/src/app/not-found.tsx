import Link from 'next/link';

export default function NotFoundPage() {
  return <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 text-center"><p className="text-sm font-semibold text-[var(--accent)]">404</p><h1 className="text-3xl font-semibold">We couldn't find that page.</h1><p className="text-sm text-[var(--text-secondary)]">The link may be out of date, or the page may have moved.</p><Link href="/" className="btn-primary">Back to CommonGround</Link></main>;
}
