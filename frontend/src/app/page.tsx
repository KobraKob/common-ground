import Link from 'next/link';
import { ArrowRight, BookOpen, Building2, CheckCircle2, Compass, Hammer, ShieldCheck, Users } from 'lucide-react';
import { BENGALURU_COLLEGES } from '@/constants/colleges';

const stories = [
  {
    label: 'City',
    title: "See what's happening across Bengaluru.",
    body: 'Photos, short videos and polls from every campus, in one feed.',
    href: '/city',
    action: 'Explore City',
    icon: Compass,
    visualTitle: "What's happening",
    visualItems: ['Campus events and conversations', 'Photos, short videos and polls', 'Updates from across the city'],
  },
  {
    label: 'Build',
    title: 'Find your team in hours, not weeks.',
    body: 'Share an idea or hackathon pitch and meet builders from other colleges.',
    href: '/build',
    action: 'Explore projects',
    icon: Hammer,
    visualTitle: 'Build something together',
    visualItems: ['Project idea and goals', 'Skills and roles needed', 'Requests from interested students'],
  },
  {
    label: 'Q&A',
    title: 'Get answers from students who've been there.',
    body: 'Accepted answers, notes and course discussions, free for every student.',
    href: '/commons',
    action: 'Visit Q&A',
    icon: BookOpen,
    visualTitle: 'Learn from each other',
    visualItems: ['Ask a course question', 'Find notes and useful resources', 'Keep accepted answers searchable'],
  },
];

const verificationLevels = [
  { label: 'Self-reported', detail: 'College affiliation selected, not yet confirmed', icon: Users, className: 'text-[var(--cg-muted)]' },
  { label: 'Vouched', detail: 'Confirmed by trusted campus members', icon: CheckCircle2, className: 'text-sky-400' },
  { label: 'Verified', detail: 'Institutional email confirmed', icon: ShieldCheck, className: 'text-emerald-400' },
  { label: 'Official', detail: 'Authorized college or department account', icon: Building2, className: 'text-[var(--cg-text)]' },
];

export default function LandingPage() {
  return (
    <div className="cg-page space-y-24 sm:space-y-32">
      <section className="mx-auto max-w-4xl py-12 text-center sm:py-20">
        <h1 className="mx-auto max-w-4xl text-5xl font-semibold leading-[1.04] tracking-tight sm:text-7xl">
          Break out of your campus bubble.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 cg-muted sm:text-xl">
          Meet, build and learn with students from every college in Bengaluru.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
          <Link href="/signup" className="btn-campus-amber inline-flex min-h-12 items-center gap-2 rounded-full px-6">
            Join free <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link href="#features" className="cg-link inline-flex min-h-12 items-center text-sm font-semibold">
            See how it works <ArrowRight size={15} className="ml-1.5" aria-hidden="true" />
          </Link>
        </div>
        <p className="mt-5 text-sm cg-muted">
          Free for students at RVCE, PES, BMSCE, Christ, MSRIT and IIIT Bangalore.
        </p>
      </section>

      <section id="features" aria-labelledby="features-heading" className="space-y-10 sm:space-y-16">
        <div className="max-w-2xl">
          <h2 id="features-heading" className="text-3xl font-semibold sm:text-4xl">
            Your campus is a starting point, not a boundary.
          </h2>
        </div>
        {stories.map((story, index) => {
          const Icon = story.icon;
          return (
            <article key={story.label} className="grid items-center gap-8 py-6 sm:gap-14 md:grid-cols-2 md:py-12">
              <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                <p className="text-sm font-semibold text-[var(--cg-accent)]">{story.label}</p>
                <h3 className="mt-3 max-w-lg text-3xl font-semibold leading-tight sm:text-4xl">{story.title}</h3>
                <p className="mt-4 max-w-lg text-base leading-7 cg-muted">{story.body}</p>
                <Link href={story.href} className="cg-link mt-5 inline-flex min-h-11 items-center text-sm font-semibold">
                  {story.action}<ArrowRight size={15} className="ml-2" aria-hidden="true" />
                </Link>
              </div>
              <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                <div className="cg-surface rounded-[20px] p-5 sm:p-7" aria-label={`Illustrative ${story.label} interface example`}>
                  <div className="flex items-center gap-3 border-b border-[var(--cg-border)] pb-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cg-elevated)] text-[var(--cg-accent)]">
                      <Icon size={21} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{story.visualTitle}</p>
                      <p className="text-xs cg-muted">Example view</p>
                    </div>
                  </div>
                  <ul className="mt-2 divide-y divide-[var(--cg-border)]">
                    {story.visualItems.map((item) => (
                      <li key={item} className="flex min-h-14 items-center gap-3 py-3 text-sm">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--cg-accent)]" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mx-auto max-w-3xl py-8 text-center sm:py-14" aria-labelledby="trust-heading">
        <h2 id="trust-heading" className="text-3xl font-semibold sm:text-4xl">Honest verification. Clear identity.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 cg-muted">
          Accounts show how a student's college affiliation was confirmed. Institutional verification does not imply college endorsement.
        </p>
        <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
          {verificationLevels.map(({ label, detail, icon: Icon, className }) => (
            <div key={label} className="flex min-h-16 items-center gap-3 rounded-xl bg-[var(--cg-surface)] px-4 py-3">
              <Icon size={18} className={className} aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs cg-muted">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="campuses-heading" className="space-y-5">
        <div>
          <h2 id="campuses-heading" className="text-3xl font-semibold sm:text-4xl">Your college is already here.</h2>
          <p className="mt-3 text-sm cg-muted">Choose a campus to explore its student community.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BENGALURU_COLLEGES.map((college) => (
            <Link key={college.id} href={`/campus/${college.slug}`} className="cg-surface flex min-h-12 items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold transition-colors hover:border-[var(--cg-accent)] hover:bg-[var(--cg-elevated)]">
              <Building2 size={18} className="shrink-0 text-[var(--cg-muted)]" aria-hidden="true" />
              <span>{college.short_name}</span>
              <ArrowRight size={14} className="ml-auto text-[var(--cg-muted)]" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className="py-12 text-center sm:py-20">
        <h2 className="text-3xl font-semibold sm:text-4xl">Ready to meet the rest of the city?</h2>
        <p className="mt-4 text-base cg-muted">Join free and start finding your people.</p>
        <Link href="/signup" className="btn-campus-amber mt-7 inline-flex min-h-12 items-center gap-2 rounded-full px-6">
          Join free <ArrowRight size={17} aria-hidden="true" />
        </Link>
        <p className="mt-4 text-sm cg-muted">Already a member? <Link href="/login" className="cg-link font-semibold">Sign in</Link></p>
      </section>
    </div>
  );
}
