import Link from 'next/link';

export const metadata = {
  title: 'Terms · CommonGround',
  description: 'Draft terms for CommonGround student communities.',
};

export default function TermsPage() {
  return <article className="cg-page max-w-3xl space-y-8">
    <header className="space-y-3"><p className="cg-eyebrow">TERMS DRAFT · LEGAL REVIEW REQUIRED</p><h1 className="text-4xl font-semibold">Terms of use</h1><p className="text-base leading-7 cg-muted">This draft describes intended platform rules. It is not an approved or enforceable set of legal terms.</p></header>
    <section className="cg-surface p-6"><h2 className="text-lg font-semibold">Using CommonGround</h2><p className="mt-3 text-sm leading-7 cg-muted">CommonGround is designed for students to discover communities, share knowledge, coordinate projects, find events and opt into peer mentorship across participating campuses. You are responsible for keeping account credentials secure and for the activity performed through your account.</p></section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Community conduct</h2><ul className="list-disc space-y-2 pl-5 text-sm leading-7 cg-muted"><li>Be respectful. Do not harass, threaten, impersonate, discriminate against or target other students.</li><li>Do not publish unlawful, deceptive, infringing or malicious content.</li><li>Do not spam, scrape profiles, automate unwanted contact or attempt to bypass visibility and block settings.</li><li>Do not share another person's private information without permission.</li><li>Use reporting and blocking controls when content or interactions are unsafe.</li></ul></section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Student content and verification</h2><p className="text-sm leading-7 cg-muted">You retain responsibility for the content you submit and must have the rights needed to share it. Verification labels reflect the platform's current verification workflow; they are not a guarantee of a student's identity, qualifications, conduct or future performance. Campus listings and approximate map pins may be incomplete or inaccurate.</p></section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Projects, events and mentorship</h2><p className="text-sm leading-7 cg-muted">Project membership depends on the project lead's decisions and the project's campus eligibility settings. Event listings are user-submitted unless otherwise marked; an RSVP is not proof of attendance. Attendance appears in a Campus Passport only after an event organizer confirms it. Peer mentorship is voluntary. Requests can be declined or cancelled, and students should keep early conversations inside CommonGround rather than publishing personal contact details.</p></section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Moderation and access</h2><p className="text-sm leading-7 cg-muted">CommonGround may restrict content or accounts to protect users and platform integrity. The exact appeal process, suspension periods, account termination rules and service availability commitments require product-owner and legal review before these terms can be approved.</p></section>
    <section className="cg-surface p-6"><h2 className="text-lg font-semibold">Items requiring legal approval</h2><p className="mt-2 text-sm leading-6 cg-muted">The final terms must identify the operating legal entity, governing law, dispute process, age and eligibility rules, content licence, liability limits, warranty disclaimers, termination procedure and official contact channel. None should be invented in this draft.</p></section>
    <p className="text-xs cg-muted">Last updated: 13 November 2026 · Draft for internal review only.</p>
  </article>;
}
