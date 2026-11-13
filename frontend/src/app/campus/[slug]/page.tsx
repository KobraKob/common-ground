import { notFound } from 'next/navigation';
import { BENGALURU_COLLEGES } from '@/constants/colleges';
import { CampusPageContent } from '../page';

export default async function CampusSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!BENGALURU_COLLEGES.some((college) => college.slug === slug)) notFound();
  return <CampusPageContent initialSlug={slug} />;
}
