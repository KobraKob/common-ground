'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Sparkles, 
  Compass, 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Flame, 
  Hammer, 
  BookOpen, 
  MessageSquare,
  Share2,
  Heart,
  Laptop,
  GraduationCap,
  MapPin,
  ChevronRight,
  Play
} from 'lucide-react';
import { getColleges } from '@/lib/api';
import { BENGALURU_COLLEGES } from '@/constants/colleges';
import { College } from '@/types';
import { TrustBadge } from '@/components/shared/TrustBadge';

export default function LandingPage() {
  const [activeFeatureTab, setActiveFeatureTab] = useState<'pulse' | 'cohorts' | 'vault' | 'trust'>('pulse');
  const [colleges, setColleges] = useState<College[]>(BENGALURU_COLLEGES);

  React.useEffect(() => {
    async function loadColleges() {
      const data = await getColleges();
      if (data && data.length > 0) {
        setColleges(data);
      }
    }
    loadColleges();
  }, []);

  return (
    <div className="space-y-16 max-w-6xl mx-auto pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl celestial-card p-6 sm:p-10 md:p-14 border border-purple-400/30 shadow-[0_0_50px_rgba(124,58,237,0.15)]">
        {/* Glow ambient spots */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-amber-400/20 via-purple-600/20 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-tr from-purple-700/25 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {/* Live Radar Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/80 border border-purple-400/40 mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399]" />
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#FDE68A] uppercase">
              Bengaluru Cross-Campus Radar • 1,480+ Students Live
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold text-[#F8F7FF] tracking-tight leading-[1.1] mb-5">
            Break Out of Your{' '}
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              Campus Bubble
            </span>.
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-[#C4B5FD] font-sans leading-relaxed mb-8 max-w-2xl">
            The citywide collaboration layer connecting students across{' '}
            <strong className="text-white font-semibold">RVCE, PESU, BMSCE, Christ, MSRIT, and IIITB</strong>. 
            Share night-owl moments with photos and videos, recruit cross-campus hackathon squads, and access verified course vaults with zero gatekeeping.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3.5 mb-8">
            <Link
              href="/signup"
              className="btn-campus-amber text-xs sm:text-sm font-mono px-6 py-3.5 flex items-center gap-2 font-bold shadow-[0_0_20px_rgba(251,191,36,0.35)] hover:scale-[1.02] transition-transform"
            >
              <span>Join CommonGround Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/city"
              className="px-6 py-3.5 rounded-2xl border border-purple-400/30 bg-[#120836]/80 hover:bg-purple-900/40 text-xs sm:text-sm font-mono text-[#F8F7FF] hover:text-[#FDE68A] hover:border-amber-400/50 flex items-center gap-2 transition-all"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Explore City Pulse Live</span>
            </Link>

            <Link
              href="/login"
              className="text-xs font-mono text-[#C4B5FD] hover:text-white underline underline-offset-4 px-2 py-1"
            >
              Already registered? Sign in →
            </Link>
          </div>

          {/* Trust strip */}
          <div className="pt-6 border-t border-purple-500/20 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <div className="text-[#FDE68A] font-bold text-base font-display">6 Campuses</div>
              <div className="text-[10px] text-[#7C6FA6]">RVCE • PESU • BMSCE +</div>
            </div>
            <div>
              <div className="text-[#FDE68A] font-bold text-base font-display">City Pulse</div>
              <div className="text-[10px] text-[#7C6FA6]">Photos, Reels & Polls</div>
            </div>
            <div>
              <div className="text-[#FDE68A] font-bold text-base font-display">Build Cohorts</div>
              <div className="text-[10px] text-[#7C6FA6]">Hackathons & Startups</div>
            </div>
            <div>
              <div className="text-[#FDE68A] font-bold text-base font-display">Stage Trust</div>
              <div className="text-[10px] text-[#7C6FA6]">4-Tier Identity Badges</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Feature Tabs Showcase */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs font-mono uppercase tracking-widest text-[#FBBF24] font-bold mb-2">
            ✦ How CommonGround Powers Your College Life
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F8F7FF]">
            Everything a Bengaluru student needs, under one night sky
          </h2>
        </div>

        {/* Tab Buttons */}
        <div className="flex justify-center gap-2 flex-wrap">
          {[
            { id: 'pulse', label: 'City Pulse Feed', icon: Flame },
            { id: 'cohorts', label: 'Cross-Campus Build Cohorts', icon: Hammer },
            { id: 'vault', label: 'Academic Vault & Q&A', icon: BookOpen },
            { id: 'trust', label: '4-Stage Trust Architecture', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFeatureTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFeatureTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-mono transition-all duration-200 border ${
                  isActive
                    ? 'border-amber-400 bg-amber-500/15 text-[#FDE68A] font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'border-purple-400/20 bg-purple-950/30 text-[#C4B5FD] hover:text-white hover:border-purple-400/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FBBF24]' : 'text-[#7C6FA6]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content 1: City Pulse Feed */}
        {activeFeatureTab === 'pulse' && (
          <div className="celestial-card p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="neo-badge text-[10px] bg-amber-500/15 text-[#FDE68A] border-amber-400/30 mb-3">
                LIVE SOCIAL RADAR
              </div>
              <h3 className="font-display text-2xl font-bold text-[#F8F7FF] mb-3">
                City Pulse: Upload Photos, Video Reels & Campus Stories
              </h3>
              <p className="text-xs sm:text-sm text-[#C4B5FD] leading-relaxed mb-4">
                Share what's happening right now across Bengaluru. Post snapshots of 3 AM robotics tests, fest soundchecks, commute debates on the Namma Metro Purple Line, and instant polls.
              </p>
              <ul className="space-y-2.5 text-xs font-mono text-[#F8F7FF] mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Upload high-res photos and video clips directly from your campus</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Real-time hearts, likes, and comment threads on every pulse</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>1-click share to WhatsApp squads, Twitter/X, and student groups</span>
                </li>
              </ul>
              <Link href="/city" className="btn-campus-amber text-xs font-mono px-5 py-2.5 inline-flex items-center gap-2">
                <span>Try City Pulse Feed</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Simulated Live Post Card */}
            <div className="rounded-2xl border border-purple-400/30 bg-[#0B0524]/90 p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-400 text-[#090420] flex items-center justify-center font-mono font-bold text-xs">
                    A
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-[#F8F7FF]">Aarav Patel</div>
                    <div className="text-[10px] font-mono text-[#7C6FA6]">@aarav_builder • RVCE</div>
                  </div>
                </div>
                <TrustBadge stage="STAGE_3_INSTITUTIONAL_VERIFIED" size="sm" />
              </div>

              <div className="text-xs font-mono text-[#F8F7FF] mb-2 font-semibold">
                RVCE 8th Mile Stage Production Soundcheck 🎸
              </div>
              <p className="text-xs text-[#C4B5FD] mb-3">
                3 AM soundcheck done for the battle of bands. Bass is vibrating the entire mechanical block!
              </p>

              {/* Media Preview Box */}
              <div className="rounded-xl overflow-hidden border border-purple-400/20 mb-3 relative aspect-video bg-purple-950/40">
                <img
                  src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600"
                  alt="Fest soundcheck"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 right-2 text-[9px] font-mono bg-black/70 px-2 py-0.5 rounded text-amber-300">
                  PHOTO • 8th Mile
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-purple-500/20 text-xs font-mono text-[#7C6FA6]">
                <div className="flex items-center gap-3">
                  <span className="text-amber-400 flex items-center gap-1 font-bold">
                    <Heart className="w-3.5 h-3.5 fill-amber-400" /> 134
                  </span>
                  <span>💬 18 Comments</span>
                </div>
                <span className="text-purple-300 flex items-center gap-1">
                  <Share2 className="w-3.5 h-3.5" /> 22 Shares
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Build Cohorts */}
        {activeFeatureTab === 'cohorts' && (
          <div className="celestial-card p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="neo-badge text-[10px] bg-purple-500/20 text-purple-300 border-purple-400/40 mb-3">
                HACKATHONS & SIDE PROJECTS
              </div>
              <h3 className="font-display text-2xl font-bold text-[#F8F7FF] mb-3">
                Find Your Dream Co-Founders & Hackathon Teammates
              </h3>
              <p className="text-xs sm:text-sm text-[#C4B5FD] leading-relaxed mb-4">
                Tired of participating in hackathons with teammates who don't share your drive? Connect with PESU designers, RVCE systems engineers, and BMSCE algorithm wizards in dedicated cross-campus build squads.
              </p>
              <ul className="space-y-2.5 text-xs font-mono text-[#F8F7FF] mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <span>Filter collaborators by technical stack (Rust, React, ROS2, ML, Figma)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <span>Track project stages: Idea, Recruiting, Prototyping, Live Deployment</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <span>Built-in project tasks, open roles, and repo/demo links</span>
                </li>
              </ul>
              <Link href="/build" className="btn-campus-amber text-xs font-mono px-5 py-2.5 inline-flex items-center gap-2">
                <span>View Active Build Projects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-purple-400/30 bg-[#0B0524]/90 p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="neo-badge text-[9px] bg-amber-500/20 text-[#FDE68A] border-amber-400/40">
                  STAGE: PROTOTYPING
                </span>
                <span className="text-[10px] font-mono text-[#7C6FA6]">RVCE & PESU Team</span>
              </div>
              <h4 className="font-display text-base font-bold text-[#F8F7FF]">
                BMTC Transit Pulse • Real-Time Outer Ring Road Predictor
              </h4>
              <p className="text-xs text-[#C4B5FD]">
                Crowdsourced bus arrival and passenger density predictor using time-series ML models. Tested on Route 500D (Silk Board to Hebbal).
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {['React Native', 'FastAPI', 'Time-series ML'].map((s) => (
                  <span key={s} className="neo-badge text-[9px] bg-purple-950/60 border-purple-400/30 text-purple-200">
                    {s}
                  </span>
                ))}
              </div>
              <div className="pt-3 border-t border-purple-500/20 flex justify-between items-center text-xs font-mono">
                <span className="text-amber-300">Open Role: Mobile Developer</span>
                <span className="text-[#C4B5FD]">Apply Squad →</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 3: Vault */}
        {activeFeatureTab === 'vault' && (
          <div className="celestial-card p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="neo-badge text-[10px] bg-blue-500/20 text-blue-300 border-blue-400/40 mb-3">
                PEER-VERIFIED KNOWLEDGE
              </div>
              <h3 className="font-display text-2xl font-bold text-[#F8F7FF] mb-3">
                The Academic Commons: Past Papers, Notes & Q&A
              </h3>
              <p className="text-xs sm:text-sm text-[#C4B5FD] leading-relaxed mb-4">
                Never start exam prep from scratch. CommonGround hosts past semester papers, autonomous syllabus notes, and lab manuals verified by seniors from your own college and sister campuses.
              </p>
              <ul className="space-y-2.5 text-xs font-mono text-[#F8F7FF] mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>Subject tags for DSA, Operating Systems, Computer Networks, and Math</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>Accepted answer mechanism to spotlight reliable solutions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>Pinned campus resources and exam blueprints</span>
                </li>
              </ul>
              <Link href="/commons" className="btn-campus-amber text-xs font-mono px-5 py-2.5 inline-flex items-center gap-2">
                <span>Browse Resource Vault</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-purple-400/30 bg-[#0B0524]/90 p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="neo-badge text-[9px] bg-blue-500/20 text-blue-300 border-blue-400/40">
                  QUESTION // Q&A
                </span>
                <span className="text-[10px] font-mono text-[#FDE68A]">24 Upvotes</span>
              </div>
              <h4 className="font-display text-base font-bold text-[#F8F7FF]">
                How to prepare for Autonomous 3rd Sem Data Structures exams?
              </h4>
              <p className="text-xs text-[#C4B5FD]">
                Looking for reliable past notes and important algorithm problems (Trees, Graphs, Sorting).
              </p>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/30">
                <div className="text-[10px] font-mono text-emerald-300 font-bold mb-1 flex items-center gap-1">
                  <span>✓ ACCEPTED SENIOR ANSWER • Aarav Patel (RVCE)</span>
                </div>
                <p className="text-xs text-emerald-100">
                  Focus on AVL tree rotations and Dijkstra graph implementations. Verified notes uploaded to the vault!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 4: Trust */}
        {activeFeatureTab === 'trust' && (
          <div className="celestial-card p-6 md:p-8 space-y-6">
            <div className="max-w-2xl">
              <div className="neo-badge text-[10px] bg-amber-500/15 text-[#FDE68A] border-amber-400/30 mb-2">
                ANTI-IMPERSONATION PROTOCOL
              </div>
              <h3 className="font-display text-2xl font-bold text-[#F8F7FF] mb-2">
                The 4-Stage Campus Trust Model
              </h3>
              <p className="text-xs sm:text-sm text-[#C4B5FD] leading-relaxed">
                Campus networks fail when anyone can claim to be the college dean or a student president. CommonGround enforces a transparent 4-stage verification hierarchy visible on every post, message, and profile.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-400/20">
                <TrustBadge stage="STAGE_1_PROVISIONAL" size="md" />
                <h4 className="font-display text-sm font-bold text-[#F8F7FF] mt-3 mb-1">
                  Provisional Student
                </h4>
                <p className="text-[11px] text-[#C4B5FD] leading-relaxed">
                  Open registration via personal email. Self-reported college affiliation with zero false endorsements.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-400/20">
                <TrustBadge stage="STAGE_2_COMMUNITY_VALIDATED" size="md" />
                <h4 className="font-display text-sm font-bold text-[#F8F7FF] mt-3 mb-1">
                  Peer-Validated
                </h4>
                <p className="text-[11px] text-[#C4B5FD] leading-relaxed">
                  Vouched for by campus club leads or peer invite codes from active student builders.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-400/20">
                <TrustBadge stage="STAGE_3_INSTITUTIONAL_VERIFIED" size="md" />
                <h4 className="font-display text-sm font-bold text-[#F8F7FF] mt-3 mb-1">
                  Verified Student
                </h4>
                <p className="text-[11px] text-[#C4B5FD] leading-relaxed">
                  Cryptographically authenticated through official <code>.edu.in</code> or <code>.ac.in</code> campus email.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-400/20">
                <TrustBadge stage="STAGE_4_OFFICIAL_PARTNER" size="md" />
                <h4 className="font-display text-sm font-bold text-[#F8F7FF] mt-3 mb-1">
                  Official Institution
                </h4>
                <p className="text-[11px] text-[#C4B5FD] leading-relaxed">
                  Officially verified department, campus administration, or authorized student government body.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. Bengaluru Campus Clusters Grid */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-[#FBBF24] font-bold mb-1">
              ✦ Bengaluru College Cluster
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F8F7FF]">
              Connected Campuses Across the City
            </h2>
          </div>
          <Link href="/campus" className="text-xs font-mono text-[#FDE68A] hover:underline flex items-center gap-1">
            <span>Explore All Campuses</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {colleges.map((college) => (
            <div
              key={college.id}
              className="celestial-card p-5 flex flex-col justify-between hover:border-amber-400/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="neo-badge text-[9px] bg-purple-900/60 text-[#FDE68A] border-purple-400/30">
                    {college.short_name}
                  </span>
                  <span className="text-[10px] font-mono text-[#7C6FA6] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-purple-400" />
                    <span>{college.city}</span>
                  </span>
                </div>

                <h3 className="font-display text-base font-bold text-[#F8F7FF] mb-1.5 group-hover:text-amber-300 transition-colors">
                  {college.name}
                </h3>
                <div className="text-[11px] font-mono text-[#C4B5FD] mb-4">
                  Domains: <code>{college.email_domains.join(', ')}</code>
                </div>
              </div>

              <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between text-xs font-mono">
                <span className="text-[#FDE68A] font-bold">
                  {college.member_count !== undefined ? `${college.member_count} Students` : 'Active Node'}
                </span>
                <Link
                  href={`/campus`}
                  className="btn-campus-amber text-[10px] px-3 py-1"
                >
                  Enter Hub
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Student Testimonials */}
      <section className="celestial-card p-6 sm:p-10 border border-purple-400/30">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="text-xs font-mono uppercase tracking-widest text-[#FBBF24] font-bold mb-1">
            ✦ Real Student Experiences
          </div>
          <h2 className="font-display text-2xl font-extrabold text-[#F8F7FF]">
            What Students Across Bengaluru Are Saying
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-400/20 flex flex-col justify-between">
            <p className="text-xs text-[#C4B5FD] leading-relaxed mb-4 italic">
              "We were looking for a ROS2 vision researcher for our quadcopter project. Through CommonGround, we found a teammate from PESU within 24 hours of dropping our build pitch!"
            </p>
            <div className="flex items-center gap-2.5 pt-3 border-t border-purple-500/20">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs font-mono">
                A
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-white">Aarav Patel</div>
                <div className="text-[10px] font-mono text-[#7C6FA6]">RVCE • 3rd Year CSE</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-400/20 flex flex-col justify-between">
            <p className="text-xs text-[#C4B5FD] leading-relaxed mb-4 italic">
              "City Pulse is hilarious and genuinely useful. Seeing other campus fests, late-night canteen runs, and live updates during Metro breakdowns makes Bengaluru feel like one giant campus."
            </p>
            <div className="flex items-center gap-2.5 pt-3 border-t border-purple-500/20">
              <div className="w-8 h-8 rounded-full bg-purple-400 text-black flex items-center justify-center font-bold text-xs font-mono">
                D
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-white">Diya Sharma</div>
                <div className="text-[10px] font-mono text-[#7C6FA6]">PES University • Interaction Design</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-400/20 flex flex-col justify-between">
            <p className="text-xs text-[#C4B5FD] leading-relaxed mb-4 italic">
              "As a fresher, finding reliable autonomous 3rd sem notes was a nightmare until I found the Commons vault. The accepted answers gave me exact topics to study."
            </p>
            <div className="flex items-center gap-2.5 pt-3 border-t border-purple-500/20">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold text-xs font-mono">
                R
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-white">Rohan Kumar</div>
                <div className="text-[10px] font-mono text-[#7C6FA6]">BMSCE • 1st Year Engineering</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Final CTA Banner */}
      <section className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center bg-gradient-to-br from-[#1E0B4B] via-[#120836] to-[#090420] border border-amber-400/40 shadow-[0_0_40px_rgba(251,191,36,0.2)]">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2E1065] to-[#120836] border border-amber-400/50 flex items-center justify-center text-[#FBBF24] font-display font-extrabold text-lg mx-auto shadow-[0_0_20px_rgba(251,191,36,0.35)]">
            CG
          </div>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#F8F7FF]">
            Ready to Build With the Entire City?
          </h2>
          <p className="text-xs sm:text-sm text-[#C4B5FD] font-mono max-w-lg mx-auto">
            Create your account in under 30 seconds. Start with provisional access, upgrade with institutional email anytime.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="btn-campus-amber text-xs sm:text-sm font-mono px-8 py-3.5 font-bold shadow-xl flex items-center gap-2"
            >
              <span>Create Account Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-2xl border border-purple-400/30 bg-[#120836]/80 text-xs sm:text-sm font-mono text-[#F8F7FF] hover:border-amber-400/50 hover:text-[#FDE68A] transition-all"
            >
              <span>Sign In with Existing Account</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}