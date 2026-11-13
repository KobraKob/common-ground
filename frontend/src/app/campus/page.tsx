'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Megaphone, 
  Calendar, 
  Send, 
  Flag, 
  ChevronDown,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { getColleges, getCampusOverview, createPost } from '@/lib/api';
import { BENGALURU_COLLEGES } from '@/constants/colleges';
import { College, Post } from '@/types';
import { TrustBadge } from '@/components/shared/TrustBadge';
import { ReportModal } from '@/components/shared/ReportModal';
import { CampusHeroBanner } from '@/components/shared/CampusHeroBanner';

// Default starter discussions per campus to prevent blank screens
const STARTER_CAMPUS_DISCUSSIONS: Record<string, any[]> = {
  rvce: [
    {
      id: 'rvce-disc-1',
      category: 'DISCUSSION',
      title: 'RVCE 8th Mile Battle of the Bands Soundcheck 🎸',
      body: 'Main stage setup in the quadrangle is ready. Audio check running till midnight. Free passes available at the student union booth.',
      upvotes: 42,
      comments: 7,
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'rvce-disc-2',
      category: 'QUESTION_QA',
      title: 'Which technical elective to choose in 6th Sem for AI track?',
      body: 'Looking for advice between High Performance Computing vs Computer Vision. Which professor is handling HPC this year?',
      upvotes: 28,
      comments: 11,
      created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
  ],
  pesu: [
    {
      id: 'pesu-disc-1',
      category: 'DISCUSSION',
      title: 'PESU Maya Fest Kinetic Ring Setup 💡',
      body: 'The 40-foot illuminated kinetic LED ring is up in the open auditorium. Come check out the test sequences after classes!',
      upvotes: 38,
      comments: 6,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ],
};

export default function CampusPage() {
  const [colleges, setColleges] = useState<College[]>(BENGALURU_COLLEGES);
  const [selectedSlug, setSelectedSlug] = useState('rvce');
  const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'announcements' | 'events'>('overview');
  const [loading, setLoading] = useState(false);

  // Initialize with safe fallback data immediately so it never gets stuck on a loading screen
  const defaultCollege = BENGALURU_COLLEGES.find((c) => c.slug === selectedSlug) || BENGALURU_COLLEGES[0];
  const [overview, setOverview] = useState<any>({
    college: defaultCollege,
    student_created_communities: [
      { id: 'comm-1', name: 'Computer Science & Engineering', type: 'DEPARTMENT', member_count: 140, description: 'Course discussions, lab manuals, and peer doubt clearing for CSE students.' },
      { id: 'comm-2', name: 'Campus Robotics Club', type: 'CLUB', member_count: 85, description: 'Autonomous bots, ROS2 workshops, and national rover challenge teams.' },
      { id: 'comm-3', name: 'Google Developer Group Student Club', type: 'CLUB', member_count: 110, description: 'Web, cloud, and open source workshops for student builders.' },
    ],
    pinned_announcements: [
      { id: 'ann-1', title: 'Upcoming Autonomous End-Semester Exam Schedule', body: 'Hall tickets and exam timetables have been released on the student portal. Lab practicals start next Monday.', created_at: new Date().toISOString() },
    ],
    upcoming_events: [
      { id: 'evt-1', title: 'Annual Inter-College Hackathon 2026', description: '36-hour cross-campus software & hardware sprint. Cash prize pool and incubator referrals.', venue_or_link: 'Main Auditorium & CS Labs', rsvp_count: 94 },
    ],
    active_discussions: STARTER_CAMPUS_DISCUSSIONS[selectedSlug] || STARTER_CAMPUS_DISCUSSIONS.rvce,
  });

  // Post form state
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'DISCUSSION' | 'QUESTION_QA'>('DISCUSSION');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: string; type: any; title: string } | null>(null);

  useEffect(() => {
    let isCancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const [cols, data] = await Promise.all([
          getColleges(),
          getCampusOverview(selectedSlug),
        ]);
        if (!isCancelled) {
          if (cols && cols.length > 0) setColleges(cols);
          if (data && data.college) {
            setOverview({
              ...data,
              active_discussions: (data.active_discussions && data.active_discussions.length > 0)
                ? data.active_discussions
                : (STARTER_CAMPUS_DISCUSSIONS[selectedSlug] || STARTER_CAMPUS_DISCUSSIONS.rvce),
            });
          }
        }
      } catch (err) {
        console.warn('Using local campus fallback data:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      isCancelled = true;
    };
  }, [selectedSlug]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostBody.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await createPost({
        category: newPostCategory,
        title: newPostTitle || undefined,
        body: newPostBody,
        college_id: overview?.college?.id,
        is_cross_campus: false,
      });
      if (overview) {
        setOverview({
          ...overview,
          active_discussions: [created, ...(overview.active_discussions || [])],
        });
      }
      setNewPostTitle('');
      setNewPostBody('');
    } catch {
      alert('Failed to publish post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const college = overview.college || defaultCollege;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Campus Hero Banner */}
      <CampusHeroBanner
        title={college.name}
        badgeText={`${college.short_name} CAMPUS HUB • LIVE`}
        shortCode={`${college.short_name} // BLR`}
        subtitle={`Bengaluru academic hub in ${college.city}. Explore peer-driven study channels, departmental spaces, and campus discussions.`}
        isOfficial={college.is_official_partner}
        actionSlot={
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#C4B5FD] hidden sm:inline">Campus:</span>
            <div className="relative inline-block">
              <select
                value={selectedSlug}
                onChange={(e) => {
                  const slug = e.target.value;
                  setSelectedSlug(slug);
                  const matched = colleges.find((c) => c.slug === slug);
                  if (matched) {
                    setOverview((prev: any) => ({
                      ...prev,
                      college: matched,
                      active_discussions: STARTER_CAMPUS_DISCUSSIONS[slug] || STARTER_CAMPUS_DISCUSSIONS.rvce,
                    }));
                  }
                }}
                className="celestial-input text-xs font-mono py-1.5 pl-3 pr-8 text-[#F8F7FF] cursor-pointer bg-[#160B3E]/90 border-purple-400/40"
              >
                {colleges.map((c) => (
                  <option key={c.slug} value={c.slug} className="bg-[#0B0524] text-white">
                    {c.short_name} — {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-purple-300 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        }
      />

      {/* Honest Campus Status Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs font-mono text-amber-200 leading-relaxed">
          <span className="font-bold uppercase tracking-wider block mb-0.5 text-amber-300">
            {college.is_official_partner
              ? 'Official Institutional Space'
              : 'Student-Led Campus Space • Self-Reported Community'}
          </span>
          This hub is maintained by students from {college.short_name}. Use your <code className="text-white">@{college.email_domains?.[0] || 'edu.in'}</code> email to unlock verified voting.
        </div>
      </div>

      {/* Campus Tabs Navigation */}
      <div className="flex border-b border-purple-500/20 gap-2 overflow-x-auto pb-1">
        {[
          { key: 'overview', label: 'Discussions & Feed', icon: Building2 },
          { key: 'departments', label: 'Departments & Clubs', icon: Users },
          { key: 'announcements', label: 'Announcements', icon: Megaphone },
          { key: 'events', label: 'Events', icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-mono rounded-t-xl transition-all duration-150 ${
                isActive
                  ? 'border-b-2 border-amber-400 text-[#FDE68A] font-bold bg-purple-900/20'
                  : 'text-[#C4B5FD] hover:text-[#F8F7FF] hover:bg-purple-900/10'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FBBF24]' : 'text-[#7C6FA6]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & POSTS */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Post Composer */}
          <div className="celestial-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#FDE68A]">
                Post to {college.short_name} Feed
              </span>
              <div className="flex gap-1.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setNewPostCategory('DISCUSSION')}
                  className={`px-2.5 py-0.5 rounded-full border text-[10px] ${
                    newPostCategory === 'DISCUSSION'
                      ? 'border-amber-400 bg-amber-500/15 text-[#FDE68A] font-bold'
                      : 'border-purple-400/20 text-[#7C6FA6]'
                  }`}
                >
                  Discussion
                </button>
                <button
                  type="button"
                  onClick={() => setNewPostCategory('QUESTION_QA')}
                  className={`px-2.5 py-0.5 rounded-full border text-[10px] ${
                    newPostCategory === 'QUESTION_QA'
                      ? 'border-amber-400 bg-amber-500/15 text-[#FDE68A] font-bold'
                      : 'border-purple-400/20 text-[#7C6FA6]'
                  }`}
                >
                  Question
                </button>
              </div>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-2.5">
              {newPostCategory === 'QUESTION_QA' && (
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="Question title (e.g. Which elective for 5th sem?)"
                  className="celestial-input w-full text-xs font-mono p-2.5 text-white"
                />
              )}
              <textarea
                value={newPostBody}
                onChange={(e) => setNewPostBody(e.target.value)}
                placeholder={`Share an update or question with ${college.short_name} students...`}
                rows={3}
                className="celestial-input w-full text-xs p-2.5 leading-relaxed text-white"
              />
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting || !newPostBody.trim()}
                  className="btn-campus-amber text-xs font-mono px-4 py-1.5 font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  <span>{isSubmitting ? 'Posting...' : 'Post to Campus'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Discussions Stream */}
          <div className="space-y-3.5">
            {overview.active_discussions?.map((post: any) => (
              <div key={post.id} className="celestial-card p-4 sm:p-5 hover:border-purple-400/40 transition-all space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="neo-badge text-[10px] bg-purple-900/50 text-[#C4B5FD] border-purple-400/30">
                    {post.category || 'DISCUSSION'}
                  </span>
                  <button
                    onClick={() => setReportTarget({ id: post.id, type: 'POST', title: post.title || post.body })}
                    className="text-[#7C6FA6] hover:text-rose-400 p-1"
                  >
                    <Flag className="w-3 h-3" />
                  </button>
                </div>

                {post.title && (
                  <h3 className="font-display text-sm font-bold text-[#F8F7FF]">
                    {post.title}
                  </h3>
                )}
                <p className="text-xs text-[#C4B5FD] leading-relaxed">
                  {post.body}
                </p>

                <div className="flex items-center justify-between text-xs font-mono text-[#7C6FA6] pt-2 border-t border-purple-500/20">
                  <div className="flex items-center gap-3">
                    <span>▲ {post.upvotes || post.upvotes_count || 0} Upvotes</span>
                    <span>💬 {post.comments || post.comments_count || 0} Replies</span>
                  </div>
                  <span className="text-[11px] text-[#FBBF24]">View Thread →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENTS & CLUBS */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overview.student_created_communities?.map((comm: any) => (
            <div key={comm.id} className="celestial-card p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="neo-badge text-[10px] bg-purple-900/60 text-[#C4B5FD] border-purple-400/30">
                    {comm.type}
                  </span>
                  <span className="text-xs font-mono text-[#FDE68A]">
                    {comm.member_count} Members
                  </span>
                </div>
                <h3 className="font-display text-sm font-bold text-[#F8F7FF] mb-1">
                  {comm.name}
                </h3>
                <p className="text-xs text-[#C4B5FD] leading-relaxed">
                  {comm.description}
                </p>
              </div>

              <div className="pt-2 border-t border-purple-500/20 flex justify-end">
                <a
                  href="/messages"
                  className="btn-campus-amber text-xs font-mono px-3.5 py-1.5 flex items-center gap-1.5 font-bold"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Join Channel</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-3.5">
          {overview.pinned_announcements?.map((ann: any) => (
            <div key={ann.id} className="celestial-card p-4 sm:p-5 border-amber-400/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="neo-badge text-[10px] bg-amber-500/20 text-[#FDE68A] border-amber-400/40 font-bold">
                  ✦ PINNED ANNOUNCEMENT
                </span>
                <span className="text-xs font-mono text-[#7C6FA6]">
                  {new Date(ann.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-[#F8F7FF]">
                {ann.title}
              </h3>
              <p className="text-xs text-[#C4B5FD] leading-relaxed">
                {ann.body}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: EVENTS */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overview.upcoming_events?.map((evt: any) => (
            <div key={evt.id} className="celestial-card p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="neo-badge text-[10px] bg-sky-500/15 text-sky-200 border-sky-400/40">
                    CAMPUS EVENT
                  </span>
                  <span className="text-xs font-mono text-[#FDE68A]">
                    {evt.rsvp_count} RSVP'd
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-[#F8F7FF] mb-1">
                  {evt.title}
                </h3>
                <p className="text-xs text-[#C4B5FD] leading-relaxed mb-2">
                  {evt.description}
                </p>
                <div className="text-[11px] font-mono text-[#7C6FA6] bg-purple-950/40 p-2 rounded-lg border border-purple-500/20">
                  📍 {evt.venue_or_link}
                </div>
              </div>

              <div className="pt-2 border-t border-purple-500/20 flex justify-end">
                <button
                  onClick={() => alert(`RSVP registered for ${evt.title}!`)}
                  className="btn-campus-amber text-xs font-mono px-3.5 py-1.5 font-bold"
                >
                  RSVP Going
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Universal Report Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          targetTitle={reportTarget.title}
        />
      )}
    </div>
  );
}
