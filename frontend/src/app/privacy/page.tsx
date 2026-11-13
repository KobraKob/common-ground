export default function PrivacyPage() {
  return <main className="mx-auto max-w-3xl space-y-6 px-5 py-16">
    <p className="text-sm font-semibold text-[var(--accent)]">Privacy</p>
    <h1 className="text-3xl font-semibold">Privacy notice</h1>
    <p className="text-xs text-[var(--text-muted)]">Draft for product review. This page is not legal advice and must be reviewed before public launch.</p>
    <p className="text-[var(--text-secondary)]">CommonGround is a student community product. It uses account and profile information to support campus discovery, posts, questions, messages, events, projects and interest circles.</p>
    <section className="space-y-2"><h2 className="text-xl font-semibold">Information used</h2><p className="text-[var(--text-secondary)]">Depending on the features you use, the service may process account identifiers, college affiliation, profile details, skills and interests, content you submit, messages, event responses, project participation and moderation reports.</p></section>
    <section className="space-y-2"><h2 className="text-xl font-semibold">Visibility</h2><p className="text-[var(--text-secondary)]">Content visibility depends on the feature and community settings. Messages and private student passport information are intended for their relevant participants or account owner. Do not share passwords, sensitive personal information or private documents in public posts.</p></section>
    <section className="space-y-2"><h2 className="text-xl font-semibold">Safety and moderation</h2><p className="text-[var(--text-secondary)]">Moderation tools may process reports and moderation actions to help keep the community safe. Aggregated platform metrics suppress small counts to reduce the risk of identifying individuals.</p></section>
    <section className="space-y-2"><h2 className="text-xl font-semibold">Your choices</h2><p className="text-[var(--text-secondary)]">Review your profile before posting. Use available privacy and blocking controls. Account deletion, data export, retention periods and support response times must be confirmed with the service operator before launch.</p></section>
    <section id="contact" className="space-y-2"><h2 className="text-xl font-semibold">Contact</h2><p className="text-[var(--text-secondary)]">A verified support contact will be published here before the public launch.</p></section>
    <p className="text-xs text-[var(--text-muted)]">Last updated: 13 November 2026</p>
  </main>;
}
