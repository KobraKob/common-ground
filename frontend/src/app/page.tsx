import Link from 'next/link';
import { ArrowRight, Check, MessageCircle, Users, Lightbulb } from 'lucide-react';
import { BENGALURU_COLLEGES } from '@/constants/colleges';

function ProductPreview() {
  return <div className="relative mx-auto w-full max-w-[420px]">
    <div className="absolute inset-8 rounded-full bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] blur-3xl" />
    <div className="relative overflow-hidden rounded-[28px] border border-[var(--separator)] bg-[var(--surface)] p-3 shadow-2xl">
      <div className="rounded-[20px] bg-[var(--bg)] p-4">
        <div className="flex items-center justify-between border-b border-[var(--separator)] pb-3"><span className="text-sm font-semibold">City</span><span className="text-xs text-[var(--text-muted)]">Sample interface preview</span></div>
        <div className="mt-4 space-y-3">
          <article className="rounded-2xl bg-[var(--surface)] p-4"><div className="flex items-center gap-2"><span className="h-8 w-8 rounded-full bg-[var(--surface-2)]" /><div><div className="h-2 w-24 rounded bg-[var(--surface-2)]" /><div className="mt-2 h-2 w-16 rounded bg-[var(--surface-2)]" /></div></div><div className="mt-4 h-3 w-4/5 rounded bg-[var(--surface-2)]" /><div className="mt-2 h-3 w-full rounded bg-[var(--surface-2)]" /><div className="mt-2 h-3 w-3/5 rounded bg-[var(--surface-2)]" /><div className="mt-4 flex gap-4 text-xs text-[var(--text-muted)]"><span>Like</span><span>Comment</span><span>Share</span></div></article>
          <article className="rounded-2xl bg-[var(--surface)] p-4"><p className="text-xs text-[var(--accent)]">Across campuses</p><p className="mt-2 text-sm font-semibold">Looking for a teammate?</p><p className="mt-1 text-xs text-[var(--text-secondary)]">Find students with skills that complement yours.</p><div className="mt-3 flex gap-2"><span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs">Design</span><span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs">Engineering</span></div></article>
          <article className="rounded-2xl bg-[var(--surface)] p-4"><p className="text-xs text-[var(--text-muted)]">Q&A</p><p className="mt-2 text-sm font-semibold">Share what you know. Find what you need.</p><div className="mt-3 h-2 w-4/5 rounded bg-[var(--surface-2)]" /></article>
        </div>
      </div>
    </div>
  </div>;
}

export default function Home() {
  const colleges = BENGALURU_COLLEGES.slice(0, 6);
  return <main>
    <section className="page-section px-5 pb-20 pt-28 text-center md:pt-32">
      <div className="mx-auto max-w-4xl">
        <h1 className="mx-auto max-w-[12ch] text-balance text-[40px] font-semibold leading-[1.05] tracking-[-0.04em] md:text-[64px]">Break out of your campus bubble.</h1>
        <p className="mx-auto mt-6 max-w-[32rem] text-lg leading-relaxed text-[var(--text-secondary)] md:text-[21px]">Meet, build and learn with students from every college in Bengaluru.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5"><Link href="/signup" className="btn-primary min-h-12 px-7 text-base">Join free</Link><a href="#how-it-works" className="text-link">See how it works <ArrowRight size={16} /></a></div>
        <p className="mt-6 text-[13px] text-[var(--text-muted)]">Free for students at RVCE, PES, BMSCE, Christ, MSRIT and IIIT Bangalore.</p>
      </div>
    </section>

    <section className="px-5 pb-24">
      <div className="mx-auto max-w-5xl"><ProductPreview /></div>
    </section>

    <section id="how-it-works" className="page-section px-5">
      <div className="mx-auto max-w-[1080px] space-y-24">
        <article className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div><p className="text-[15px] font-semibold text-[var(--accent)]">City</p><h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight md:text-[44px]">See what's happening across Bengaluru.</h2><p className="mt-4 max-w-lg text-lg text-[var(--text-secondary)]">Photos, short videos and polls from every campus, in one feed.</p><Link href="/city" className="text-link mt-5">Explore City <ArrowRight size={16} /></Link></div>
          <div className="rounded-[20px] bg-[var(--surface)] p-6"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--surface-2)]"><MessageCircle size={20} /></span><div><p className="font-semibold">One shared city feed</p><p className="text-xs text-[var(--text-muted)]">Sample interface preview</p></div></div><div className="mt-5 h-32 rounded-xl bg-[var(--surface-2)]" /><div className="mt-4 flex gap-4 text-xs text-[var(--text-muted)]"><span>Like</span><span>Comment</span><span>Share</span></div></div>
        </article>
        <article className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div className="order-2 rounded-[20px] bg-[var(--surface)] p-6 md:order-1"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--surface-2)]"><Users size={20} /></span><div><p className="font-semibold">Build across campuses</p><p className="text-xs text-[var(--text-muted)]">Sample interface preview</p></div></div><div className="mt-5 space-y-3"><div className="rounded-xl bg-[var(--surface-2)] p-4"><p className="text-sm font-semibold">Open project roles</p><p className="mt-1 text-xs text-[var(--text-secondary)]">Design · Engineering · Research</p></div><div className="rounded-xl bg-[var(--surface-2)] p-4"><p className="text-sm font-semibold">Request to join</p><p className="mt-1 text-xs text-[var(--text-secondary)]">Tell the team how you can contribute.</p></div></div></div>
          <div className="order-1 md:order-2"><p className="text-[15px] font-semibold text-[var(--accent)]">Build</p><h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight md:text-[44px]">Find your team in hours, not weeks.</h2><p className="mt-4 max-w-lg text-lg text-[var(--text-secondary)]">Post an idea or hackathon pitch and meet builders from other colleges.</p><Link href="/build" className="text-link mt-5">Find collaborators <ArrowRight size={16} /></Link></div>
        </article>
        <article className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div><p className="text-[15px] font-semibold text-[var(--accent)]">Q&A</p><h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight md:text-[44px]">Get answers from students who just took the exam.</h2><p className="mt-4 max-w-lg text-lg text-[var(--text-secondary)]">Accepted answers, notes and course threads, free for every student.</p><Link href="/commons" className="text-link mt-5">Explore Q&A <ArrowRight size={16} /></Link></div>
          <div className="rounded-[20px] bg-[var(--surface)] p-6"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--surface-2)]"><Lightbulb size={20} /></span><div><p className="font-semibold">Questions worth sharing</p><p className="text-xs text-[var(--text-muted)]">Sample interface preview</p></div></div><div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4"><p className="text-sm font-semibold">How did you prepare for the lab viva?</p><div className="mt-3 h-2 w-4/5 rounded bg-[var(--surface)]" /><div className="mt-2 h-2 w-3/5 rounded bg-[var(--surface)]" /><div className="mt-4 flex items-center gap-2 text-xs text-[var(--success)]"><Check size={14} /> Accepted answer</div></div></div>
        </article>
      </div>
    </section>

    <section className="page-section px-5">
      <div className="mx-auto max-w-3xl text-center"><h2 className="text-3xl font-semibold tracking-tight md:text-[44px]">Real students. Clear identity.</h2><p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">Every profile shows its identity status. Institutional verification is reviewed separately, so a college name alone never implies verification.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface)] px-4 py-2 text-sm"><Check size={15} className="text-[var(--success)]" /> Verified · Institution reviewed</span><span className="rounded-full bg-[var(--surface)] px-4 py-2 text-sm">Vouched · Peer vouched</span><span className="rounded-full bg-[var(--surface)] px-4 py-2 text-sm">New · Recently joined</span></div></div>
    </section>

    <section className="page-section px-5">
      <div className="mx-auto max-w-5xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-3xl font-semibold tracking-tight md:text-[44px]">Your college is already here.</h2><p className="mt-3 text-[var(--text-secondary)]">Choose a campus to see its community.</p></div><Link href="/campuses" className="text-link">Explore all campuses <ArrowRight size={16} /></Link></div><div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">{colleges.map((college) => <Link key={college.id} href={`/campus/${college.slug}`} className="flex min-h-12 items-center gap-3 rounded-full bg-[var(--surface)] px-4 py-3 transition-colors hover:bg-[var(--surface-2)]"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] text-xs font-semibold">{college.short_name.slice(0, 2)}</span><span className="text-sm font-semibold">{college.short_name}</span></Link>)}</div></div>
    </section>

    <section className="page-section px-5 text-center"><div className="mx-auto max-w-3xl"><h2 className="text-3xl font-semibold tracking-tight md:text-[44px]">Ready to meet the rest of the city?</h2><p className="mt-4 text-lg text-[var(--text-secondary)]">Join free and find your people beyond campus.</p><Link href="/signup" className="btn-primary mt-8 min-h-12 px-7 text-base">Join free</Link><p className="mt-5 text-sm text-[var(--text-muted)]">Already a member? <Link href="/login" className="text-link inline-flex min-h-0">Sign in</Link></p></div></section>

    <footer className="border-t border-[var(--separator)] px-5 py-8"><div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4"><Link href="/" className="font-semibold">CommonGround</Link><nav className="flex flex-wrap gap-5 text-sm text-[var(--text-secondary)]" aria-label="Footer navigation"><Link href="/about">About</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/about#contact">Contact</Link></nav><span className="text-xs text-[var(--text-muted)]">© 2026 CommonGround</span></div></footer>
  </main>;
}
