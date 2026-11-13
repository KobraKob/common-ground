import { notFound } from 'next/navigation';
import CampusPage from '../page';
import { BENGALURU_COLLEGES } from '@/constants/colleges';

export default async function CampusBySlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!BENGALURU_COLLEGES.some((college) => college.slug === slug)) notFound();
  return <CampusPage initialSlug={slug} />;
}
