'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Megaphone, 
  Calendar, 
  BookOpen, 
  ExternalLink, 
  MessageSquare, 
  Plus, 
  ShieldAlert, 
  ShieldCheck, 
  ArrowUpRight,
  Send,
  Flag,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { getColleges, getCampusOverview, createPost } from '@/lib/api';
import { College, Post } from '@/types';
import { TrustBadge } from '@/components/shared/TrustBadge';
import { ReportModal } from '@/components/shared/ReportModal';
import { CampusHeroBanner } from '@/components/shared/CampusHeroBanner';

export default function CampusPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('rvce');
  const [overview, setOverview] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'announcements' | 'events'>('overview');
  const [loading, setLoading] = useState(true);

  // New Post state
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'DISCUSSION' | 'QUESTION_QA'>('DISCUSSION');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Report modal state
  const [reportTarget, setReportTarget] = useState<{ id: string; type: any; title: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const cols = await getColleges();
      setColleges(cols);
      const data = await getCampusOverview(selectedSlug);
      setOverview(data);
      setLoading(false);
    }
    loadData();
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
    } catch (err) {
      alert('Failed to publish post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !overview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] space-y-4">
        <div className="w-10 h-10 rounded-2xl bg-purple-900/40 border border-purple-500/40 flex items-center justify-center text-amber-300 animate-spin">
          ✦
        </div>
        <div className="text-xs font-mono tracking-widest text-[#C4B5FD] animate-pulse">
          TUNING CAMPUS SPACE // BENGALURU NODE...
        </div>
      </div>
    );
  }

  const college = overview.college;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Panoramic Celestial Campus Hero Banner */}
      <CampusHeroBanner
        title={college.name}
        badgeText={`${college.short_name} CAMPUS BASE • LIVE`}
        shortCode={`${college.short_name} // BLR`}
        subtitle={`Bengaluru academic hub located in ${college.city}. Explore peer-driven study channels, departmental vaults, and after-hours collaboration.`}
        activeCount={college.member_count || 320}
        isOfficial={college.is_official_partner}
        actionSlot={
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#C4B5FD] hidden sm:inline">Campus:</span>
            <div className="relative inline-block">
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
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

      {/* Honest Affiliation Status Glass Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 backdrop-blur-md flex items-start gap-3.5 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
        <div className="text-xs font-mono text-amber-200 leading-relaxed">
          <span className="font-bold uppercase tracking-wider block mb-0.5 text-amber-300">
            {college.is_official_partner
              ? 'Official Institutional Space'
              : 'Student-Led Campus Space • Self-Reported Community'}
          </span>
          This hub is independently maintained by students from {college.short_name}. CommonGround clearly distinguishes verified student reps from official university administration.
        </div>
      </div>

      {/* Quick Metrics Bar in Wet Pavement Glass */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 celestial-card">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#7C6FA6]">Enrolled Students</div>
          <div className="text-xl font-mono font-bold text-[#F8F7FF] mt-1 flex items-baseline gap-1">
            <span>{college.member_count || 280}+</span>
            <span className="text-[10px] text-amber-400">✦</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#7C6FA6]">Campus Cohorts</div>
          <div className="text-xl font-mono font-bold text-[#F8F7FF] mt-1">
            {college.community_count || 14} Groups
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#7C6FA6]">Active Threads</div>
          <div className="text-xl font-mono font-bold text-[#F8F7FF] mt-1">
            {overview.active_discussions?.length || 5} Active
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#7C6FA6]">Verified Domain</div>
          <div className="text-xs font-mono text-[#FDE68A] mt-2 truncate bg-purple-950/60 px-2 py-1 rounded border border-purple-400/20">
            @{college.email_domains?.[0] || 'rvce.edu.in'}
          </div>
        </div>
      </div>

      {/* Campus Tabs Navigation */}
      <div className="flex border-b border-purple-500/20 gap-2 overflow-x-auto pb-1">
        {[
          { key: 'overview', label: 'Feed & Discussions', icon: Building2 },
          { key: 'departments', label: 'Departments & Cohorts', icon: Users },
          { key: 'announcements', label: 'Pinned Announcements', icon: Megaphone },
          { key: 'events', label: 'Campus Events', icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono rounded-t-xl transition-all duration-200 ${
                isActive
                  ? 'border-b-2 border-amber-400 text-[#FDE68A] font-semibold bg-gradient-to-t from-purple-900/30 to-transparent shadow-[0_2px_12px_rgba(251,191,36,0.15)]'
                  : 'text-[#C4B5FD] hover:text-[#F8F7FF] hover:bg-purple-900/20'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FBBF24]' : 'text-[#7C6FA6]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Feed */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Post Composer */}
          <div className="celestial-card p-5">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-xs font-mono uppercase tracking-wider font-semibold text-[#FDE68A] flex items-center gap-1.5">
                <span>✦ Post to {college.short_name} Stream</span>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewPostCategory('DISCUSSION')}
                  className={`pill-glass text-[10px] ${
                    newPostCategory === 'DISCUSSION' ? 'pill-glass-active' : ''
                  }`}
                >
                  Discussion
                </button>
                <button
                  type="button"
                  onClick={() => setNewPostCategory('QUESTION_QA')}
                  className={`pill-glass text-[10px] ${
                    newPostCategory === 'QUESTION_QA' ? 'pill-glass-active' : ''
                  }`}
                >
                  Q&A Question
                </button>
              </div>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3">
              {newPostCategory === 'QUESTION_QA' && (
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="Question title (e.g. Which elective for 5th sem?)"
                  className="celestial-input w-full text-xs font-mono p-3"
                />
              )}
              <textarea
                value={newPostBody}
                onChange={(e) => setNewPostBody(e.target.value)}
                placeholder={`Share an update, question, or study moment with ${college.short_name} students...`}
                rows={3}
                className="celestial-input w-full text-xs p-3 leading-relaxed"
              />
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting || !newPostBody.trim()}
                  className="btn-campus-amber text-xs font-mono px-5 py-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Posting...' : 'Publish to Feed'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Discussions / Posts Stream */}
          <div className="space-y-4">
            {overview.active_discussions?.map((post: any) => (
              <div key={post.id} className="celestial-card p-5 hover:border-purple-400/40 transition-all">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="neo-badge text-[10px] bg-purple-900/50 text-[#C4B5FD] border-purple-400/30">
                      {post.category}
                    </span>
                    <span className="text-xs font-mono text-[#7C6FA6]">
                      {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <button
                    onClick={() => setReportTarget({ id: post.id, type: 'POST', title: post.title || post.body })}
                    className="text-[#7C6FA6] hover:text-rose-400 transition-colors p-1"
                    title="Report content"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>

                {post.title && (
                  <h3 className="font-display text-lg font-bold mb-1.5 text-[#F8F7FF]">
                    {post.title}
                  </h3>
                )}
                <p className="text-xs text-[#C4B5FD] leading-relaxed mb-4">
                  {post.body}
                </p>

                <div className="flex items-center justify-between text-xs font-mono text-[#7C6FA6] pt-3 border-t border-purple-500/20">
                  <div className="flex items-center gap-4">
                    <span className="hover:text-[#FDE68A] cursor-pointer transition-colors">
                      ▲ {post.upvotes || post.upvotes_count || 0} Upvotes
                    </span>
                    <span>💬 {post.comments || post.comments_count || 0} Replies</span>
                  </div>
                  <button className="text-[11px] text-[#FBBF24] hover:text-[#FDE68A] transition-colors font-semibold">
                    View Thread →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Departments & Cohorts */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overview.student_created_communities?.map((comm: any) => (
            <div key={comm.id} className="celestial-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="neo-badge text-[10px] bg-purple-900/60 text-[#C4B5FD] border-purple-400/30">
                    {comm.type}
                  </span>
                  <span className="text-xs font-mono text-[#FDE68A]">
                    {comm.member_count} Members
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-[#F8F7FF] mb-1.5">
                  {comm.name}
                </h3>
                <p className="text-xs text-[#C4B5FD] leading-relaxed mb-4">
                  {comm.description}
                </p>
              </div>

              <div className="pt-3 border-t border-purple-500/20 flex justify-end">
                <a
                  href="/messages"
                  className="btn-campus-amber text-xs font-mono px-4 py-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Open Space</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Pinned Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {overview.pinned_announcements?.map((ann: any) => (
            <div key={ann.id} className="celestial-card-amber p-5">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="neo-badge text-[10px] bg-amber-500/20 text-[#FDE68A] border-amber-400/40 font-bold">
                  ✦ PINNED ANNOUNCEMENT
                </span>
                <span className="text-xs font-mono text-[#FDE68A]/80">
                  {new Date(ann.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-[#F8F7FF] mb-2">
                {ann.title}
              </h3>
              <p className="text-xs text-[#FDE68A]/90 leading-relaxed">
                {ann.body}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Campus Events */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overview.upcoming_events?.map((evt: any) => (
            <div key={evt.id} className="celestial-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="neo-badge text-[10px] bg-sky-500/15 text-sky-200 border-sky-400/40">
                    CAMPUS EVENT
                  </span>
                  <span className="text-xs font-mono font-semibold text-[#FDE68A]">
                    {evt.rsvp_count} RSVP'd
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-[#F8F7FF] mb-1.5">
                  {evt.title}
                </h3>
                <p className="text-xs text-[#C4B5FD] leading-relaxed mb-3">
                  {evt.description}
                </p>
                <div className="text-xs font-mono text-[#7C6FA6] mb-4 bg-purple-950/40 p-2 rounded-lg border border-purple-500/20">
                  📍 {evt.venue_or_link}
                </div>
              </div>

              <div className="pt-3 border-t border-purple-500/20 flex justify-end">
                <button className="btn-campus-amber text-xs font-mono px-4 py-1.5">
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
