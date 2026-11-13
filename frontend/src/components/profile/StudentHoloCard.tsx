'use client';

import React from 'react';
import ProfileCard from './ProfileCard';
import { StudentProfile } from '@/types';

export interface StudentHoloCardProps {
  profile: StudentProfile;
  onContactClick?: () => void;
  showUserInfo?: boolean;
  className?: string;
  enableMobileTilt?: boolean;
  tiltStrength?: number;
  holo?: number;
  glare?: number;
  contactText?: string;
}

const generateDefaultAvatar = (name: string, college: string): string => {
  const initial = (name || 'U').charAt(0).toUpperCase();
  const collegeInitial = (college || 'CG').slice(0, 4).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
    <defs>
      <radialGradient id="nebula" cx="50%" cy="35%" r="75%">
        <stop offset="0%" stop-color="#1E2230" />
        <stop offset="45%" stop-color="#12151F" />
        <stop offset="85%" stop-color="#0E1017" />
        <stop offset="100%" stop-color="#0A0C12" />
      </radialGradient>
      <linearGradient id="amberGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FDE68A" />
        <stop offset="50%" stop-color="#F59E0B" />
        <stop offset="100%" stop-color="#B45309" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#nebula)"/>
    <g transform="translate(200, 200)">
      <circle r="95" fill="none" stroke="rgba(245, 158, 11, 0.18)" stroke-dasharray="6 6" stroke-width="2"/>
      <circle r="82" fill="#12151F" stroke="url(#amberGold)" stroke-width="3" filter="url(#glow)"/>
      <text y="32" font-family="'Outfit', system-ui, sans-serif" font-size="94" font-weight="800" fill="url(#amberGold)" text-anchor="middle" letter-spacing="-2">${initial}</text>
    </g>
    <rect x="120" y="320" width="160" height="28" rx="14" fill="rgba(245, 158, 11, 0.12)" stroke="rgba(245, 158, 11, 0.3)" stroke-width="1.5"/>
    <text x="200" y="339" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="#FDE68A" text-anchor="middle" letter-spacing="1.5">${collegeInitial}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const StudentHoloCard: React.FC<StudentHoloCardProps> = ({
  profile,
  onContactClick,
  showUserInfo = true,
  className = '',
  enableMobileTilt = true,
  tiltStrength = 14,
  holo = 0.85,
  glare = 0.6,
  contactText = 'Message'
}) => {
  const isVerified = profile.verification_stage === 'STAGE_3_INSTITUTIONAL_VERIFIED';
  const isPeerValidated = profile.verification_stage === 'STAGE_2_COMMUNITY_VALIDATED';
  const isPartner = profile.verification_stage === 'STAGE_4_OFFICIAL_PARTNER';

  let status = 'Provisional Student';
  let statusColor = '#94A3B8';

  if (isPartner) {
    status = 'Official Partner';
    statusColor = '#3B82F6';
  } else if (isVerified) {
    status = 'Verified Student';
    statusColor = '#F59E0B'; // warm lit campus window gold
  } else if (isPeerValidated) {
    status = 'Peer-Validated';
    statusColor = '#FBBF24';
  }

  const avatarUrl = profile.avatar_url && profile.avatar_url.trim() !== ''
    ? profile.avatar_url
    : generateDefaultAvatar(profile.display_name, profile.college_name || 'RVCE');

  const formattedTitle = profile.course_branch
    ? `${profile.course_branch} (${profile.graduation_year || '2026'})`
    : `${profile.college_name || 'Bengaluru College'} (${profile.graduation_year || '2026'})`;

  return (
    <ProfileCard
      name={profile.display_name}
      title={formattedTitle}
      handle={profile.handle}
      status={status}
      statusColor={statusColor}
      contactText={contactText}
      showUserInfo={showUserInfo}
      avatarUrl={avatarUrl}
      iconUrl="/assets/celestial-pattern.svg"
      miniAvatarUrl={avatarUrl}
      holo={holo}
      glare={glare}
      tiltStrength={tiltStrength}
      parallax={10}
      radius={12}
      enableTilt={true}
      intro={true}
      enableMobileTilt={enableMobileTilt}
      mobileTiltSensitivity={6}
      theme="dark"
      backdropColor="#12151F"
      className={className}
      onContactClick={onContactClick}
    />
  );
};

export default StudentHoloCard;
