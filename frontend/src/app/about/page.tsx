import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return <main className="mx-auto max-w-3xl space-y-8 px-5 py-16">
    <div><p className="text-sm font-semibold text-[var(--accent)]">About</p><h1 className="mt-2 text-3xl font-semibold">A bigger campus starts with a connection.</h1><p className="mt-4 text-lg text-[var(--text-secondary)]">CommonGround helps students meet, build and learn with people beyond their own college.</p></div>
    <section className="space-y-3"><h2 className="text-xl font-semibold">What we're building</h2><p className="text-[var(--text-secondary)]">A shared city feed, campus communities, student Q&A, cross-campus projects, interest circles and events. The goal is to make collaboration across Bengaluru colleges easier to discover and safer to join.</p></section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Built around student agency</h2><p className="text-[var(--text-secondary)]">Profiles show their recorded identity status. Project workspaces are limited to accepted members. Moderation actions are recorded. The product is still being developed, and some workflows are not yet available.</p></section>
    <section id="contact" className="space-y-3"><h2 className="text-xl font-semibold">Contact</h2><p className="text-[var(--text-secondary)]">A verified support contact will be published before public launch.</p></section>
    <Link href="/campuses" className="text-link">Explore campuses <ArrowRight size={16} /></Link>
  </main>;
}
