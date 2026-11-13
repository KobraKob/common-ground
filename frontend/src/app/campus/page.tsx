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
  Check,
  HelpCircle,
  Tag,
  ThumbsUp,
  MapPin
} from 'lucide-react';
import { getColleges, getCampusOverview, createPost } from '@/lib/api';
import { BENGALURU_COLLEGES } from '@/constants/colleges';
import { College, Post } from '@/types';
import { TrustBadge } from '@/components/shared/TrustBadge';
import { ReportModal } from '@/components/shared/ReportModal';
import { CampusHeroBanner } from '@/components/shared/CampusHeroBanner';

export default function CampusPage() {
  const [colleges, setColleges] = useState<College[]>(BENGALURU_COLLEGES);
  const [selectedSlug, setSelectedSlug] = useState('rvce');
  const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'announcements' | 'events'>('overview');
  const [loading, setLoading] = useState(false);

  const defaultCollege = BENGALURU_COLLEGES.find((c) => c.slug === selectedSlug) || BENGALURU_COLLEGES[0];
  const [overview, setOverview] = useState<any>({
    college: defaultCollege,
    student_created_communities: [],
    pinned_announcements: [],
    upcoming_events: [],
    active_discussions: [],
  });

  // Post form state
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'DISCUSSION' | 'QUESTION_QA'>('DISCUSSION');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: string; type: any; title: string } | null>(null);

  useEffect(() => {
    const requestedCampus = new URLSearchParams(window.location.search).get('college');
    if (requestedCampus && BENGALURU_COLLEGES.some((item) => item.slug === requestedCampus)) {
      setSelectedSlug(requestedCampus);
    }
  }, []);

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
                : [],
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
      alert('Unable to publish campus post. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const college = overview.college || defaultCollege;

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Campus Hero Banner */}
      <CampusHeroBanner
        title={college.name}
        badgeText={`${college.short_name} CAMPUS HUB`}
        shortCode={college.short_name}
        subtitle={`Bengaluru academic hub in ${college.city}. Explore peer-driven study channels, departmental spaces, and campus discussions.`}
        isOfficial={college.is_official_partner}
        actionSlot={
          <div className="flex flex-wrap items-center gap-3">
            <a href="/discover" className="cg-link inline-flex min-h-11 items-center text-sm font-medium">Campus network map</a>
            <span className="text-xs font-mono text-slate-400 hidden sm:inline">Campus:</span>
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
                      active_discussions: [],
                    }));
                  }
                }}
                className="celestial-input text-xs font-mono py-1.5 pl-3 pr-8 text-white cursor-pointer bg-[#181C2A] border-white/10"
              >
                {colleges.map((c) => (
                  <option key={c.slug} value={c.slug} className="bg-[#12151F] text-white">
                    {c.short_name} — {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        }
      />

      {/* Honest Campus Status Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-start gap-3.5">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs font-mono text-amber-200 leading-relaxed">
          <span className="font-bold uppercase tracking-wider block mb-0.5 text-amber-300">
            {college.is_official_partner
              ? 'Official Institutional Space'
              : 'Student-Led Campus Space • Self-Reported Community'}
          </span>
          This hub is maintained by students from {college.short_name}. Use your <code className="text-white">@{college.email_domains?.[0] || 'edu.in'}</code> email to unlock verified voting and campus vaults.
        </div>
      </div>

      {/* Campus Tabs Navigation */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-2">
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
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-full transition-all duration-150 ${
                isActive
                  ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & DISCUSSIONS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Post Composer */}
          <div className="celestial-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-300">
                Post to {college.short_name} Feed
              </span>
              <div className="flex gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setNewPostCategory('DISCUSSION')}
                  className={`px-3 py-1 rounded-full border text-[11px] transition-all ${
                    newPostCategory === 'DISCUSSION'
                      ? 'border-amber-400/60 bg-amber-500/15 text-amber-300 font-bold'
                      : 'border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  Discussion
                </button>
                <button
                  type="button"
                  onClick={() => setNewPostCategory('QUESTION_QA')}
                  className={`px-3 py-1 rounded-full border text-[11px] transition-all ${
                    newPostCategory === 'QUESTION_QA'
                      ? 'border-amber-400/60 bg-amber-500/15 text-amber-300 font-bold'
                      : 'border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  Question
                </button>
              </div>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3">
              {newPostCategory === 'QUESTION_QA' && (
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="Question title (e.g. Which elective to choose for 5th semester?)"
                  className="celestial-input w-full text-xs font-mono p-3 text-white"
                />
              )}
              <textarea
                value={newPostBody}
                onChange={(e) => setNewPostBody(e.target.value)}
                placeholder={`Share an update or question with ${college.short_name} students...`}
                rows={3}
                className="celestial-input w-full text-xs p-3 leading-relaxed text-white"
              />
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting || !newPostBody.trim()}
                  className="btn-campus-amber text-xs font-mono px-5 py-2 font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Send className="w-3 h-3" />
                  <span>{isSubmitting ? 'Posting...' : 'Post to Campus'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="celestial-card p-6 space-y-3">
                  <div className="h-4 w-40 skeleton-shimmer rounded" />
                  <div className="h-3.5 w-full skeleton-shimmer rounded" />
                  <div className="h-3.5 w-3/4 skeleton-shimmer rounded" />
                </div>
              ))}
            </div>
          ) : overview.active_discussions?.length === 0 ? (
            <div className="celestial-card p-12 text-center space-y-3 border-dashed">
              <HelpCircle className="w-10 h-10 text-slate-500 mx-auto opacity-60" />
              <h3 className="font-display text-base font-bold text-white">
                No active discussions yet
              </h3>
              <p className="text-xs font-mono text-slate-400 max-w-sm mx-auto">
                Be the first to start a conversation in the {college.short_name} campus hub.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {overview.active_discussions?.map((post: any) => (
                <div key={post.id} className="celestial-card p-5 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="neo-badge text-[10px] bg-white/5 text-slate-300 border border-white/10">
                      {post.category || 'DISCUSSION'}
                    </span>
                    <button
                      onClick={() => setReportTarget({ id: post.id, type: 'POST', title: post.title || post.body })}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    >
                      <Flag className="w-3 h-3" />
                    </button>
                  </div>

                  {post.title && (
                    <h3 className="font-display text-base font-bold text-white">
                      {post.title}
                    </h3>
                  )}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {post.body}
                  </p>

                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5 text-amber-400" />
                        <span>{post.upvotes || post.upvotes_count || 0} Upvotes</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>{post.comments || post.comments_count || 0} Replies</span>
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-400 font-semibold cursor-pointer hover:underline">
                      View Thread →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEPARTMENTS & CLUBS */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overview.student_created_communities?.map((comm: any) => (
            <div key={comm.id} className="celestial-card p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="neo-badge text-[10px] bg-white/5 text-slate-300 border border-white/10">
                    {comm.type}
                  </span>
                  <span className="text-xs font-mono text-amber-300">
                    {comm.member_count} Members
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-white mb-1.5">
                  {comm.name}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {comm.description}
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end">
                <a
                  href="/messages"
                  className="btn-campus-amber text-xs font-mono px-4 py-1.5 flex items-center gap-1.5 font-bold"
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
        <div className="space-y-4">
          {overview.pinned_announcements?.map((ann: any) => (
            <div key={ann.id} className="celestial-card-amber p-6 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="neo-badge text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold">
                  PINNED ANNOUNCEMENT
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {new Date(ann.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-white">
                {ann.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
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
            <div key={evt.id} className="celestial-card p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="neo-badge text-[10px] bg-white/5 text-slate-300 border border-white/10">
                    CAMPUS EVENT
                  </span>
                  <span className="text-xs font-mono text-amber-300 font-bold">
                    {evt.rsvp_count} RSVP'd
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-white mb-1.5">
                  {evt.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {evt.description}
                </p>
                <div className="text-xs font-mono text-slate-400 bg-black/40 p-2.5 rounded-xl border border-white/10 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{evt.venue_or_link}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => alert(`RSVP registered for ${evt.title}!`)}
                  className="btn-campus-amber text-xs font-mono px-4 py-1.5 font-bold"
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
