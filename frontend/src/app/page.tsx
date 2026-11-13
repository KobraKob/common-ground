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
  Check, 
  ShieldCheck,
  Sparkles,
  Music,
  Lightbulb,
  Cpu,
  Mic,
  Radio,
  Zap
} from 'lucide-react';
import { BENGALURU_COLLEGES } from '@/constants/colleges';
import { College } from '@/types';
import { TrustBadge } from '@/components/shared/TrustBadge';

// Curated campus preview posts (Real photography, no unicode emojis, authentic student projects)
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
    role: '3rd Year Computer Science • RVCE',
    title: '8th Mile Main Stage Audio Engineering Soundcheck',
    body: 'Midnight acoustic test completed in the main quadrangle. Sound dispersion across the mechanical engineering block is dialed in for tomorrow evening.',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&auto=format&fit=crop&q=80',
    tag: 'Production • RVCE 8th Mile',
    likes: 134,
    comments: 18,
  },
  pesu: {
    author: 'Diya Sharma',
    handle: 'diya_design',
    role: 'Interaction Design • PES University',
    title: 'Kinetic Lighting Installation for Open Air Theatre',
    body: 'Calibrated forty circular addressable LED rings for the design showcase. Ambient audio reaction pipeline running with less than 20ms latency.',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&auto=format&fit=crop&q=80',
    tag: 'Hardware • PESU Open Theatre',
    likes: 119,
    comments: 14,
  },
  bmsce: {
    author: 'Rohan Kumar',
    handle: 'rohan_systems',
    role: 'Mechanical & Robotics • BMSCE',
    title: 'Autonomous Mobile Robot Obstacle Course Trials',
    body: 'Tested our LiDAR localization stack in the auditorium corridor. Zero drift across ten consecutive obstacle loops.',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=900&auto=format&fit=crop&q=80',
    tag: 'Robotics • BMSCE Lab',
    likes: 98,
    comments: 12,
  },
  christ: {
    author: 'Ananya Rao',
    handle: 'ananya_lit',
    role: 'Media & Communications • Christ',
    title: 'Central Campus Amphitheatre Acoustic Rehearsal',
    body: 'Evening vocal and classical violin rehearsal after semester reviews. Clear Bengaluru weather and great natural courtyard acoustics.',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=900&auto=format&fit=crop&q=80',
    tag: 'Arts • Central Amphitheatre',
    likes: 142,
    comments: 21,
  },
  msrit: {
    author: 'Karthik S',
    handle: 'karthik_code',
    role: 'Information Science • MSRIT',
    title: 'Autonomous Quadcopter Optical Flow Benchmark',
    body: 'Completed indoor hover test run inside the Apex Block atrium. Optical flow sensors held stability with sub-centimeter accuracy.',
    image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=900&auto=format&fit=crop&q=80',
    tag: 'Avionics • MSRIT Apex Block',
    likes: 105,
    comments: 16,
  },
  iiitb: {
    author: 'Vikram Joshi',
    handle: 'vikram_ai',
    role: 'M.Tech Computer Science • IIITB',
    title: 'Distributed Systems Latency Benchmark Cluster',
    body: 'Late evening benchmarking run on a four-node Raft consensus cluster. Measuring cross-node replication throughput under high write contention.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&auto=format&fit=crop&q=80',
    tag: 'Systems • IIITB Labs',
    likes: 88,
    comments: 9,
  },
};

export default function LandingPage() {
  const [selectedCampus, setSelectedCampus] = useState<College>(BENGALURU_COLLEGES[0]);

  const currentPreview = CAMPUS_PREVIEWS[selectedCampus.slug] || CAMPUS_PREVIEWS.rvce;

  return (
    <div className="space-y-16 max-w-5xl mx-auto py-6 sm:py-10 pb-20">
      {/* 1. Hero: One Clear Promise & Direct Action (Deference & Room) */}
      <section className="relative overflow-hidden rounded-xl bg-[#12151F] border border-white/10 p-8 sm:p-12 md:p-16 shadow-2xl">
        <div
          className="absolute -top-32 right-0 w-[500px] h-[500px] rounded-full opacity-15 filter blur-[100px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-mono font-semibold tracking-wider text-amber-300 uppercase">
              Bengaluru Cross-Campus Network
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
            Connect beyond your <span className="text-amber-400">campus borders</span>.
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-300 font-sans leading-relaxed max-w-xl">
            A single platform connecting students across{' '}
            <strong className="text-white font-semibold">RVCE, PESU, BMSCE, Christ, MSRIT, and IIITB</strong>.
            Form cross-college project teams, share campus moments, and access peer-verified course blueprints.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={`/signup?campus=${selectedCampus.slug}`}
              className="btn-campus-amber text-xs sm:text-sm font-mono px-6 py-3.5 flex items-center gap-2 font-bold shadow-md"
            >
              <span>Join with {selectedCampus.short_name}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/city"
              className="px-5 py-3.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-xs sm:text-sm font-mono text-slate-200 hover:text-white transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Explore City Feed</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Interactive Campus Selector (Hick's Law: 6 clear choices) */}
      <section className="space-y-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold mb-1">
            Campus Network
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
            Select your college to personalize CommonGround
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {BENGALURU_COLLEGES.map((college) => {
            const isSelected = selectedCampus.slug === college.slug;
            return (
              <button
                key={college.id}
                type="button"
                onClick={() => setSelectedCampus(college)}
                className={`p-4 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-400/80 bg-amber-500/10 shadow-md scale-[1.02]'
                    : 'border-white/10 bg-[#12151F] hover:border-white/20 text-slate-300 hover:text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`font-mono text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                      {college.short_name}
                    </span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </div>
                  <div className="text-[11px] font-sans text-slate-400 line-clamp-1">
                    {college.name}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-white/10 text-[9px] font-mono text-slate-500">
                  @{college.email_domains[0]}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Personalized Campus Hub & Realistic Post Preview (More room, no card nesting soup) */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: Selected Campus Summary */}
        <div className="md:col-span-5 celestial-card p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <span className="neo-badge text-[10px] bg-amber-500/15 text-amber-300 border border-amber-400/30 font-bold">
              {selectedCampus.short_name} HUB
            </span>
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-400" />
              <span>Bengaluru</span>
            </span>
          </div>

          <div>
            <h3 className="font-display text-xl font-bold text-white mb-2">
              {selectedCampus.name}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Connect directly with classmates and cross-campus collaborators. Signing up with an official <code className="text-amber-300">@{selectedCampus.email_domains[0]}</code> address unlocks the Verified Student badge.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span>Domain:</span>
              <span className="text-amber-300 font-bold">@{selectedCampus.email_domains[0]}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Verification:</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <Check className="w-3.5 h-3.5" /> Instant verification
              </span>
            </div>
          </div>

          <Link
            href={`/signup?campus=${selectedCampus.slug}`}
            className="btn-campus-amber w-full py-3 text-xs font-mono flex items-center justify-center gap-2 font-bold shadow-md"
          >
            <span>Join {selectedCampus.short_name} Free</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Right: Authentic Student Post Preview */}
        <div className="md:col-span-7 celestial-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-semibold">
              Student Post Preview
            </span>
            <span className="text-[10px] font-mono text-amber-400 font-medium">
              {selectedCampus.short_name} Community
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-[#0A0C12] flex items-center justify-center font-mono font-bold text-xs shadow-sm">
                {currentPreview.author.charAt(0)}
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-white">
                  {currentPreview.author}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  @{currentPreview.handle} • {currentPreview.role}
                </div>
              </div>
            </div>
            <TrustBadge stage="STAGE_3_INSTITUTIONAL_VERIFIED" size="sm" />
          </div>

          <div>
            <h4 className="text-sm font-display font-bold text-white mb-1.5">
              {currentPreview.title}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {currentPreview.body}
            </p>
          </div>

          {/* Real Photo Preview */}
          <div className="rounded-xl overflow-hidden border border-white/10 relative aspect-video bg-black/50">
            <img
              src={currentPreview.image}
              alt={currentPreview.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <span className="absolute bottom-2.5 right-2.5 text-[9px] font-mono bg-black/80 px-2 py-0.5 rounded text-amber-300 border border-white/10">
              {currentPreview.tag}
            </span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-4">
              <span className="text-amber-400 flex items-center gap-1 font-bold">
                <Heart className="w-3.5 h-3.5 fill-amber-400" /> {currentPreview.likes}
              </span>
              <span>{currentPreview.comments} Comments</span>
            </div>
            <span className="text-slate-400 flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
              <Share2 className="w-3.5 h-3.5" /> Share
            </span>
          </div>
        </div>
      </section>

      {/* 4. Honest Trust Model Overview (No puffery) */}
      <section className="celestial-card p-6 sm:p-8 space-y-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold mb-1">
            Verification Protocol
          </div>
          <h3 className="font-display text-lg sm:text-xl font-bold text-white mb-2">
            Clear, transparent student identity verification
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Every account clearly distinguishes verified student emails from self-reported registrations:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-1">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
            <TrustBadge stage="STAGE_3_INSTITUTIONAL_VERIFIED" size="sm" interactive={false} />
            <div className="text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-white block mb-0.5">Verified Student:</strong>
              Unlocked automatically when you register using your accredited college domain (<code className="text-amber-300">.edu.in</code> or <code className="text-amber-300">.ac.in</code>).
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
            <TrustBadge stage="STAGE_1_PROVISIONAL" size="sm" interactive={false} />
            <div className="text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-white block mb-0.5">Provisional Student:</strong>
              Open registration with personal email. Affiliation is self-reported until institutional email is linked.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
