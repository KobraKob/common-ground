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
  Flag
} from 'lucide-react';
import { getColleges, getCampusOverview, createPost } from '@/lib/api';
import { College, Post } from '@/types';
import { TrustBadge } from '@/components/shared/TrustBadge';
import { ReportModal } from '@/components/shared/ReportModal';

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
      // Append to active discussions
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xs font-mono animate-pulse text-gray-500">
          Loading Campus Space // Bengaluru Cluster...
        </div>
      </div>
    );
  }

  const college = overview.college;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* College Switcher & Header Card */}
      <div className="neo-card p-6 relative overflow-hidden bg-white dark:bg-[#151726]">
        {/* Subtle accent highlight bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#CCCFFA] via-[#C5E17A] to-[#CCCFFA]" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="neo-badge bg-[#1A1C29] text-[#C5E17A] dark:bg-[#C5E17A] dark:text-[#0E0F1A]">
                {college.short_name} // 01
              </span>
              <span className="text-xs font-mono text-gray-500">
                {college.city}, Karnataka
              </span>
            </div>
            <h1 className="neo-heading text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {college.name}
            </h1>
          </div>

          {/* College Quick Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-500 shrink-0">Switch Campus:</span>
            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="neo-pill-btn bg-white dark:bg-[#0E0F1A] border-[#CCCFFA] dark:border-[#282C47] text-xs font-mono"
            >
              {colleges.map((c) => (
                <option key={c.slug} value={c.slug} className="dark:bg-[#151726]">
                  {c.short_name} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Honest Affiliation Status Banner (Rule 1.2 & 3.1) */}
        <div className="mt-5 p-3.5 rounded bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs font-mono text-amber-800 dark:text-amber-300 leading-relaxed">
            <span className="font-bold uppercase tracking-wider block mb-0.5">
              {college.is_official_partner ? 'Official Institutional Space' : 'Student-Led Campus Space • Self-Reported Community'}
            </span>
            This hub is independently maintained by students from {college.short_name}. CommonGround clearly distinguishes verified student reps from official university administration.
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-[#CCCFFA]/60 dark:border-[#282C47]/60">
          <div>
            <div className="text-[10px] font-mono uppercase text-gray-400">Enrolled Students</div>
            <div className="text-lg font-mono font-bold text-gray-900 dark:text-white">
              {college.member_count || 280}+
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-gray-400">Campus Cohorts</div>
            <div className="text-lg font-mono font-bold text-gray-900 dark:text-white">
              {college.community_count || 14} Groups
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-gray-400">Active Discussions</div>
            <div className="text-lg font-mono font-bold text-gray-900 dark:text-white">
              {overview.active_discussions?.length || 5} Threads
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-gray-400">Verified Domain</div>
            <div className="text-xs font-mono text-[#6366F1] dark:text-[#C5E17A] truncate">
              @{college.email_domains?.[0] || 'rvce.edu.in'}
            </div>
          </div>
        </div>
      </div>

      {/* Campus Tabs Navigation */}
      <div className="flex border-b border-[#CCCFFA] dark:border-[#282C47] gap-2 overflow-x-auto pb-1">
        {[
          { key: 'overview', label: 'Overview & Feed', icon: Building2 },
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
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-t-md transition-all ${
                isActive
                  ? 'border-b-2 border-[#1A1C29] dark:border-[#C5E17A] text-[#1A1C29] dark:text-[#C5E17A] font-bold bg-white/70 dark:bg-[#151726]/70'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Feed */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Post Composer */}
          <div className="neo-card p-4 bg-white dark:bg-[#151726]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider font-semibold text-gray-700 dark:text-gray-300">
                Post to {college.short_name} Campus Feed
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewPostCategory('DISCUSSION')}
                  className={`neo-badge text-[10px] ${
                    newPostCategory === 'DISCUSSION'
                      ? 'bg-[#1A1C29] text-[#C5E17A] dark:bg-[#C5E17A] dark:text-[#0E0F1A]'
                      : 'text-gray-500'
                  }`}
                >
                  Discussion
                </button>
                <button
                  type="button"
                  onClick={() => setNewPostCategory('QUESTION_QA')}
                  className={`neo-badge text-[10px] ${
                    newPostCategory === 'QUESTION_QA'
                      ? 'bg-[#1A1C29] text-[#C5E17A] dark:bg-[#C5E17A] dark:text-[#0E0F1A]'
                      : 'text-gray-500'
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
                  className="w-full text-xs font-mono p-2.5 rounded border border-[#CCCFFA] dark:border-[#282C47] bg-[#F5F6FD] dark:bg-[#0E0F1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#C5E17A]"
                />
              )}
              <textarea
                value={newPostBody}
                onChange={(e) => setNewPostBody(e.target.value)}
                placeholder={`Share an update, question, or study moment with ${college.short_name} students...`}
                rows={2}
                className="w-full text-xs p-2.5 rounded border border-[#CCCFFA] dark:border-[#282C47] bg-[#F5F6FD] dark:bg-[#0E0F1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#C5E17A]"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !newPostBody.trim()}
                  className="neo-pill-btn neo-pill-btn-primary"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Posting...' : 'Publish Post'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Discussions / Posts Stream */}
          <div className="space-y-4">
            {overview.active_discussions?.map((post: any) => (
              <div key={post.id} className="neo-card p-5 bg-white dark:bg-[#151726]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="neo-badge text-[10px] bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                      {post.category}
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <button
                    onClick={() => setReportTarget({ id: post.id, type: 'POST', title: post.title || post.body })}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Report content"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>

                {post.title && (
                  <h3 className="neo-heading text-lg font-bold mb-1 text-gray-900 dark:text-white">
                    {post.title}
                  </h3>
                )}
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                  {post.body}
                </p>

                <div className="flex items-center justify-between text-xs font-mono text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <span>▲ {post.upvotes || post.upvotes_count || 0} Upvotes</span>
                    <span>💬 {post.comments || post.comments_count || 0} Replies</span>
                  </div>
                  <button className="text-[11px] hover:text-[#6366F1] dark:hover:text-[#C5E17A] transition-colors">
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
            <div key={comm.id} className="neo-card p-5 bg-white dark:bg-[#151726] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="neo-badge text-[10px] bg-[#C5E17A]/15 text-[#1A1C29] dark:text-[#C5E17A]">
                    {comm.type}
                  </span>
                  <span className="text-xs font-mono text-gray-400">
                    {comm.member_count} Members
                  </span>
                </div>
                <h3 className="neo-heading text-base font-bold text-gray-900 dark:text-white mb-1">
                  {comm.name}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  {comm.description}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <a
                  href="/messages"
                  className="neo-pill-btn neo-pill-btn-primary text-xs"
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
            <div key={ann.id} className="neo-card p-5 border-l-4 border-l-[#C5E17A] bg-white dark:bg-[#151726]">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="neo-badge text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30">
                  PINNED ANNOUNCEMENT
                </span>
                <span className="text-xs font-mono text-gray-400">
                  {new Date(ann.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="neo-heading text-lg font-bold text-gray-900 dark:text-white mb-2">
                {ann.title}
              </h3>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
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
            <div key={evt.id} className="neo-card p-5 bg-white dark:bg-[#151726] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="neo-badge text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-300">
                    CAMPUS EVENT
                  </span>
                  <span className="text-xs font-mono font-semibold text-gray-600 dark:text-gray-300">
                    {evt.rsvp_count} RSVP'd
                  </span>
                </div>
                <h3 className="neo-heading text-base font-bold text-gray-900 dark:text-white mb-1">
                  {evt.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                  {evt.description}
                </p>
                <div className="text-xs font-mono text-gray-500 mb-4">
                  📍 {evt.venue_or_link}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button className="neo-pill-btn neo-pill-btn-primary text-xs">
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
