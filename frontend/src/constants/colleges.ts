import { College } from '@/types';

/**
 * Accredited Bengaluru College Cluster Directory.
 * Official platform institutional reference data.
 */
export const BENGALURU_COLLEGES: College[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'RV College of Engineering',
    slug: 'rvce',
    short_name: 'RVCE',
    city: 'Bengaluru (Mysuru Road)',
    state: 'Karnataka',
    email_domains: ['rvce.edu.in'],
    is_official_partner: false,
    is_active_cluster: true,
    member_count: 320,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'PES University',
    slug: 'pesu',
    short_name: 'PESU',
    city: 'Bengaluru (RR Nagar & Electronic City)',
    state: 'Karnataka',
    email_domains: ['pes.edu'],
    is_official_partner: false,
    is_active_cluster: true,
    member_count: 295,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'BMS College of Engineering',
    slug: 'bmsce',
    short_name: 'BMSCE',
    city: 'Bengaluru (Basavanagudi)',
    state: 'Karnataka',
    email_domains: ['bmsce.ac.in'],
    is_official_partner: false,
    is_active_cluster: true,
    member_count: 260,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Christ University',
    slug: 'christ',
    short_name: 'CHRIST',
    city: 'Bengaluru (Hosur Road / Central)',
    state: 'Karnataka',
    email_domains: ['christuniversity.in'],
    is_official_partner: false,
    is_active_cluster: true,
    member_count: 240,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'MS Ramaiah Institute of Technology',
    slug: 'msrit',
    short_name: 'MSRIT',
    city: 'Bengaluru (Mathikere)',
    state: 'Karnataka',
    email_domains: ['msrit.edu'],
    is_official_partner: false,
    is_active_cluster: true,
    member_count: 215,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'International Institute of Information Technology Bangalore',
    slug: 'iiitb',
    short_name: 'IIITB',
    city: 'Bengaluru (Electronic City)',
    state: 'Karnataka',
    email_domains: ['iiitb.ac.in'],
    is_official_partner: false,
    is_active_cluster: true,
    member_count: 150,
    created_at: '2026-01-01T00:00:00Z',
  },
];

/**
 * Intelligent college domain detection for fast 2-field signup.
 * Matches any accredited college email (e.g. aarav@rvce.edu.in -> RVCE).
 */
export function detectCollegeFromEmail(email: string): College | null {
  if (!email || !email.includes('@')) return null;
  const parts = email.toLowerCase().split('@');
  if (parts.length < 2) return null;
  const domain = parts[1].trim();
  return BENGALURU_COLLEGES.find((c) =>
    c.email_domains.some((d) => domain === d || domain.endsWith(`.${d}`))
  ) || null;
}
