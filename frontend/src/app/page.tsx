'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Compass, 
  ArrowRight, 
  Heart, 
  Share2, 
  MapPin, 
  CheckCircle2, 
  Mail, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { BENGALURU_COLLEGES } from '@/constants/colleges';
import { College } from '@/types';
import { TrustBadge } from '@/components/shared/TrustBadge';
import { OptimizedImage } from '@/components/shared/OptimizedImage';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

// Sample preview posts per campus for personalized preview
const CAMPUS_PREVIEWS: Record<string, {
  author: string;
  handle: string;
  role: string;
  title: string;
  body: string;
  image: string;
  tag: string;
  likes: number;
  comments: number;
}> = {
  rvce: {
    author: 'Aarav Patel',
    handle: 'aarav_builder',
    role: '3rd Year CSE • RVCE',
    title: 'RVCE 8th Mile Stage Production Soundcheck 🎸',
    body: '3 AM soundcheck done for the battle of bands. Bass is vibrating the entire mechanical block! Tomorrow 6 PM main stage kick-off.',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    tag: 'PHOTO • 8th Mile Fest',
    likes: 134,
    comments: 18,
  },
  pesu: {
    author: 'Diya Sharma',
    handle: 'diya_design',
    role: 'Interaction Design • PESU',
    title: 'PESU Maya Fest Kinetic Stage Installation 💡',
    body: 'Just finished calibrating the 40-foot LED ring for Maya festival. Ambient sound reactivity tests running smoothly!',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
    tag: 'PHOTO • Maya Fest',
    likes: 119,
    comments: 14,
  },
  bmsce: {
    author: 'Rohan Kumar',
    handle: 'rohan_systems',
    role: 'Mechanical & Robotics • BMSCE',
    title: 'UTSAAV Robotics Arena Final Track Assembly 🤖',
    body: 'Line followers and combat robots obstacle course is mapped in the BMS auditorium. Ready for inter-college trials!',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
    tag: 'PHOTO • UTSAAV Fest',
    likes: 98,
    comments: 12,
  },
  christ: {
    author: 'Ananya Rao',
    handle: 'ananya_lit',
    role: 'Media & Comms • Christ',
    title: 'Central Campus Amphitheatre Acoustic Jam Session 🎙️',
    body: 'Late evening acoustic set under the trees after semester exams. Bengaluru weather at its absolute best.',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
    tag: 'PHOTO • Campus Jam',
    likes: 142,
    comments: 21,
  },
  msrit: {
    author: 'Karthik S',
    handle: 'karthik_code',
    role: 'ISE • MSRIT',
    title: 'MSRIT Tech Fest Autonomous Drone Trials 🛸',
    body: 'Indoor optical flow test run inside Apex Block. Zero drift over a 5-minute autonomous hover routine.',
    image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800',
    tag: 'PHOTO • Tech Fest',
    likes: 105,
    comments: 16,
  },
  iiitb: {
    author: 'Vikram Joshi',
    handle: 'vikram_ai',
    role: 'M.Tech CSE • IIITB',
    title: 'Distributed Systems Late Night Hackathon Marathon ⚡',
    body: '3:30 AM coffee run in Electronic City. Clustering 4 nodes for latency benchmarks on the research server.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
    tag: 'PHOTO • Hack Marathon',
    likes: 88,
    comments: 9,
  },
};

export default function LandingPage() {
  const [selectedCampus, setSelectedCampus] = useState<College>(BENGALURU_COLLEGES[0]);

  const currentPreview = CAMPUS_PREVIEWS[selectedCampus.slug] || CAMPUS_PREVIEWS.rvce;

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-16">
      {/* 1. Hero: One Clear Promise & Direct Action */}
      <section className="relative overflow-hidden rounded-3xl celestial-card p-6 sm:p-10 md:p-12 border border-purple-400/30 shadow-[0_0_50px_rgba(124,58,237,0.15)]">
        {/* Subtle ambient spots */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-700/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          {/* Subtle network badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-400/30 mb-5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399]" />
            <span className="text-[11px] font-mono font-bold tracking-wider text-[#FDE68A] uppercase">
              Bengaluru Cross-Campus Network
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-[#F8F7FF] tracking-tight leading-[1.15] mb-4">
            Break Out of Your{' '}
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              Campus Bubble
            </span>.
          </h1>

          <p className="text-sm sm:text-base text-[#C4B5FD] font-sans leading-relaxed mb-6">
            The citywide network connecting students across{' '}
            <strong className="text-white font-semibold">RVCE, PESU, BMSCE, Christ, MSRIT, and IIITB</strong>.
            Share campus moments, recruit hackathon squads, and access verified course resources.
          </p>

          {/* Single Primary Action + Secondary Explore Link */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/signup?campus=${selectedCampus.slug}`}
              className="btn-campus-amber text-xs sm:text-sm font-mono px-6 py-3 flex items-center gap-2 font-bold shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:scale-[1.02] transition-transform"
            >
              <span>Join with {selectedCampus.short_name}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/city"
              className="px-5 py-3 rounded-2xl border border-purple-400/30 bg-[#120836]/80 hover:bg-purple-900/40 text-xs sm:text-sm font-mono text-[#F8F7FF] hover:text-[#FDE68A] hover:border-amber-400/50 flex items-center gap-2 transition-all"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Explore City Feed</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Interactive "Which Campus Are You From?" Personalization Picker */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#FBBF24] font-bold">
              ✦ Step 1: Select Your Campus
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F8F7FF]">
              Personalize CommonGround for Your College
            </h2>
          </div>
        </div>

        {/* Campus Cards Picker */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {BENGALURU_COLLEGES.map((college) => {
            const isSelected = selectedCampus.slug === college.slug;
            return (
              <button
                key={college.id}
                type="button"
                onClick={() => setSelectedCampus(college)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/15 shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-[1.02]'
                    : 'border-purple-400/20 bg-purple-950/30 hover:border-purple-400/40 text-[#C4B5FD] hover:bg-purple-900/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`font-mono text-xs font-bold ${isSelected ? 'text-[#FDE68A]' : 'text-white'}`}>
                      {college.short_name}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </div>
                  <div className="text-[11px] font-sans text-[#C4B5FD] line-clamp-1 leading-snug">
                    {college.name}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-purple-500/15 text-[9px] font-mono text-[#7C6FA6]">
                  @{college.email_domains[0]}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Personalized Campus Hub & Realistic Post Preview */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: Personalized Campus Info Card */}
        <div className="md:col-span-5 celestial-card p-6 border border-purple-400/30 space-y-4">
          <div className="flex items-center justify-between">
            <span className="neo-badge text-[10px] bg-amber-500/15 text-[#FDE68A] border-amber-400/30 font-bold">
              {selectedCampus.short_name} CAMPUS HUB
            </span>
            <span className="text-[10px] font-mono text-[#7C6FA6] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-purple-400" />
              <span>Bengaluru</span>
            </span>
          </div>

          <div>
            <h3 className="font-display text-xl font-bold text-[#F8F7FF] mb-1">
              {selectedCampus.name}
            </h3>
            <p className="text-xs text-[#C4B5FD] leading-relaxed">
              Connect directly with classmates and cross-campus collaborators. Official emails on <code className="text-[#FDE68A]">@{selectedCampus.email_domains[0]}</code> instantly receive the Verified Student badge.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-400/20 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-[#C4B5FD]">
              <span>Institutional Domain:</span>
              <span className="text-[#FDE68A] font-bold">@{selectedCampus.email_domains[0]}</span>
            </div>
            <div className="flex items-center justify-between text-[#C4B5FD]">
              <span>Verification Status:</span>
              <span className="text-emerald-300 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Instant with college email
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href={`/signup?campus=${selectedCampus.slug}`}
              className="btn-campus-amber w-full py-2.5 text-xs font-mono flex items-center justify-center gap-2 font-bold shadow-md"
            >
              <span>Join {selectedCampus.short_name} on CommonGround</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right: Honest Student Post Preview (Labeled Clearly) */}
        <div className="md:col-span-7 celestial-card p-5 border border-purple-400/30 space-y-3.5">
          {/* Honest Preview Label (Apple HIG Credibility) */}
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#7C6FA6] flex items-center gap-1.5">
              <span>✦</span> Student Post Preview
            </span>
            <span className="text-[10px] font-mono text-[#FDE68A]">
              From {selectedCampus.short_name}
            </span>
          </div>

          {/* Author Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[#090420] flex items-center justify-center font-mono font-bold text-xs shadow-sm">
                {currentPreview.author.charAt(0)}
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-[#F8F7FF]">
                  {currentPreview.author}
                </div>
                <div className="text-[10px] font-mono text-[#7C6FA6]">
                  @{currentPreview.handle} • {currentPreview.role}
                </div>
              </div>
            </div>
            <TrustBadge stage="STAGE_3_INSTITUTIONAL_VERIFIED" size="sm" />
          </div>

          {/* Title & Body */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-[#F8F7FF] mb-1">
              {currentPreview.title}
            </h4>
            <p className="text-xs text-[#C4B5FD] leading-relaxed">
              {currentPreview.body}
            </p>
          </div>

          {/* Media Container */}
          <div className="rounded-xl overflow-hidden border border-purple-400/20 relative aspect-video bg-purple-950/40">
            <OptimizedImage
              src={currentPreview.image}
              alt={currentPreview.title}
              fill
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-2 right-2 text-[9px] font-mono bg-black/75 px-2 py-0.5 rounded text-amber-300 z-20">
              {currentPreview.tag}
            </span>
          </div>

          {/* Reactions */}
          <div className="flex items-center justify-between pt-2 border-t border-purple-500/20 text-xs font-mono text-[#7C6FA6]">
            <div className="flex items-center gap-3">
              <span className="text-amber-400 flex items-center gap-1 font-bold">
                <Heart className="w-3.5 h-3.5 fill-amber-400" /> {currentPreview.likes}
              </span>
              <span>💬 {currentPreview.comments} Comments</span>
            </div>
            <span className="text-purple-300 flex items-center gap-1">
              <Share2 className="w-3.5 h-3.5" /> Share
            </span>
          </div>
        </div>
      </section>

      {/* 4. Apple-Grade Trust Baseline (Simple & Honest) */}
      <section className="celestial-card p-6 sm:p-8 border border-purple-400/25">
        <div className="max-w-2xl">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#FBBF24] font-bold mb-1">
            ✦ Honest Trust Verification
          </div>
          <h3 className="font-display text-lg sm:text-xl font-bold text-[#F8F7FF] mb-2">
            No Impersonation. Straightforward Campus Verification.
          </h3>
          <p className="text-xs text-[#C4B5FD] leading-relaxed mb-4">
            CommonGround provides clear identity tiers so you know who is posting and answering course questions:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-mono">
          <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-400/20 flex items-start gap-3">
            <TrustBadge stage="STAGE_3_INSTITUTIONAL_VERIFIED" size="sm" interactive={false} />
            <div className="text-[11px] text-[#C4B5FD] leading-snug">
              <strong className="text-white block mb-0.5">Verified Student:</strong>
              Unlocked automatically when you sign up with your official college email (<code className="text-[#FDE68A]">.edu.in</code> or <code className="text-[#FDE68A]">.ac.in</code>).
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-400/20 flex items-start gap-3">
            <TrustBadge stage="STAGE_1_PROVISIONAL" size="sm" interactive={false} />
            <div className="text-[11px] text-[#C4B5FD] leading-snug">
              <strong className="text-white block mb-0.5">Provisional Student:</strong>
              Open registration with any personal email. Affiliation is self-reported until you link your college email.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
