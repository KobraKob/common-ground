import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <article className="cg-page max-w-3xl space-y-8">
      <header className="space-y-4">
        <p className="cg-eyebrow">About CommonGround</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">A bigger campus starts with connection.</h1>
        <p className="text-lg leading-8 cg-muted">
          CommonGround helps students discover people, communities, knowledge and projects beyond their own college.
        </p>
      </header>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Built around student life</h2>
        <p className="leading-7 cg-muted">
          Explore campus conversations, find collaborators, share useful academic knowledge and discover events across Bengaluru.
        </p>
        <p className="leading-7 cg-muted">
          College affiliation is shown transparently. A selected college is self-reported until the account completes the relevant verification process. Institutional verification does not mean a college endorses the platform.
        </p>
      </section>
      <Link href="/discover" className="cg-link inline-flex min-h-11 items-center text-sm font-semibold">
        Explore the campus network <ArrowRight size={15} className="ml-2" aria-hidden="true"/>
      </Link>
    </article>
  );
}
