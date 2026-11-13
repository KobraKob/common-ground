import Link from 'next/link';
import { ArrowRight, BookOpen, Building2, Compass, Hammer, MessageSquare, Users } from 'lucide-react';
import { BENGALURU_COLLEGES } from '@/constants/colleges';

const stories = [
  { icon: Compass, title: 'Discover your city', body: 'Find conversations, people and campus life beyond the walls of your own college.', href: '/city', action: 'Explore City' },
  { icon: Hammer, title: 'Build with new people', body: 'Find student projects, see the skills teams need and collaborate across institutions.', href: '/build', action: 'Explore projects' },
  { icon: BookOpen, title: 'Share what you know', body: 'Ask questions, exchange useful resources and learn from students across campuses.', href: '/commons', action: 'Visit Q&A' },
];

export default function LandingPage() {
  return <div className="cg-page space-y-20 sm:space-y-28">
    <section className="mx-auto max-w-4xl py-10 text-center sm:py-20">
      <p className="cg-eyebrow">A STUDENT NETWORK FOR BENGALURU</p>
      <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-semibold leading-[1.04] tracking-tight sm:text-7xl">Break out of your campus bubble.</h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 cg-muted">Meet, build and learn with students from colleges across Bengaluru. One place for campus communities, projects, questions and events.</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/signup" className="btn-campus-amber inline-flex min-h-12 items-center gap-2 rounded-full px-6">Join CommonGround <ArrowRight size={17}/></Link>
        <Link href="/discover" className="inline-flex min-h-12 items-center rounded-full border border-[var(--cg-border)] px-6 text-sm font-medium hover:bg-[var(--cg-elevated)]">Explore the network</Link>
      </div>
      <p className="mt-5 text-sm cg-muted">Free to join. Built around real student communities and collaboration.</p>
    </section>

    <section className="space-y-8">
      <div className="max-w-xl"><p className="cg-eyebrow">WHAT YOU CAN DO</p><h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Your campus is a starting point, not a boundary.</h2></div>
      <div className="grid gap-4 md:grid-cols-3">
        {stories.map(({icon:Icon,title,body,href,action})=><article key={title} className="cg-surface flex min-h-64 flex-col p-6 sm:p-7">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--cg-elevated)] text-[var(--cg-accent)]"><Icon size={22}/></span>
          <h3 className="mt-6 text-xl font-semibold">{title}</h3><p className="mt-3 flex-1 text-sm leading-6 cg-muted">{body}</p>
          <Link href={href} className="cg-link mt-6 inline-flex min-h-11 items-center text-sm font-semibold">{action}<ArrowRight size={15} className="ml-2"/></Link>
        </article>)}
      </div>
    </section>

    <section className="grid gap-8 border-y border-[var(--cg-border)] py-12 md:grid-cols-[.8fr_1.2fr] md:items-center">
      <div><p className="cg-eyebrow">ONE CONNECTED CITY</p><h2 className="mt-3 text-3xl font-semibold">Different campuses. Shared possibilities.</h2><p className="mt-3 text-sm leading-6 cg-muted">Explore participating institutions and find the communities, people and projects that interest you.</p><Link href="/discover" className="cg-link mt-4 inline-flex min-h-11 items-center text-sm font-semibold">Discover campuses <ArrowRight size={15} className="ml-2"/></Link></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{BENGALURU_COLLEGES.map((college)=><Link key={college.id} href={`/campus?college=${college.slug}`} className="cg-surface flex min-h-20 items-center gap-3 p-4 hover:border-[var(--cg-accent)]"><Building2 size={18} className="shrink-0 text-[var(--cg-accent)]"/><span className="text-sm font-medium">{college.short_name}</span></Link>)}</div>
    </section>

    <section className="cg-surface flex flex-col items-start justify-between gap-6 p-7 sm:flex-row sm:items-center sm:p-10">
      <div className="max-w-xl"><p className="cg-eyebrow">YOUR NEXT CONNECTION STARTS HERE</p><h2 className="mt-3 text-3xl font-semibold">Make something happen beyond your campus.</h2><p className="mt-3 text-sm leading-6 cg-muted">Create a profile, find your people and contribute to a network shaped by students.</p></div>
      <Link href="/signup" className="btn-campus-amber inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full px-6">Join free <ArrowRight size={17}/></Link>
    </section>

    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--cg-border)] pt-6 text-sm cg-muted">
      <span>CommonGround · Bengaluru</span><div className="flex gap-5"><Link href="/discover" className="hover:text-[var(--cg-text)]">Discover</Link><Link href="/login" className="hover:text-[var(--cg-text)]">Sign in</Link><Link href="/signup" className="hover:text-[var(--cg-text)]">Join</Link></div>
    </footer>
  </div>;
}
