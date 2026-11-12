'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Compass, 
  Users, 
  Flame, 
  Sparkles, 
  MessageSquare, 
  Filter, 
  Send, 
  Vote, 
  Flag,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { getPosts, getCommunities, votePoll, createPost } from '@/lib/api';
import { DEMO_USERS, SEED_COLLEGES } from '@/lib/mockData';
import { Post, Community, StudentProfile } from '@/types';
import { TrustBadge } from '@/components/shared/TrustBadge';
import { ReportModal } from '@/components/shared/ReportModal';

export default function CityPage() {
  const [activeTab, setActiveTab] = useState<'pulse' | 'people' | 'clubs'>('pulse');
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>(DEMO_USERS);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Poll voting state
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});

  // Quick Post modal
  const [pulseBody, setPulseBody] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Report modal
  const [reportTarget, setReportTarget] = useState<{ id: string; type: any; title: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [pData, cData] = await Promise.all([
        getPosts('city'),
        getCommunities(),
      ]);
      setPosts(pData);
      setCommunities(cData.filter((c) => c.community_type === 'CROSS_CAMPUS_INTEREST' || !c.college_id));
      setLoading(false);
    }
    loadData();
  }, []);

  const handleVote = async (postId: string, optionId: string) => {
    setVotedPolls({ ...votedPolls, [postId]: optionId });
    await votePoll(postId, optionId);
    // Optimistically increment vote
    setPosts(posts.map((p) => {
      if (p.id === postId && p.poll) {
        return {
          ...p,
          poll: {
            ...p.poll,
            options: p.poll.options.map((opt) => 
              opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
            ),
          },
        };
      }
      return p;
    }));
  };

  const handleCreatePulse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pulseBody.trim()) return;
    setIsPosting(true);
    try {
      const created = await createPost({
        category: 'HANGOUT_MEME',
        body: pulseBody,
        is_cross_campus: true,
        tags: ['BengaluruPulse'],
      });
      setPosts([created, ...posts]);
      setPulseBody('');
    } catch {
      alert('Failed to publish pulse');
    } finally {
      setIsPosting(false);
    }
  };

  const allSkills = ['ALL', 'Python', 'Rust', 'Next.js', 'Figma', 'UI/UX', 'C++', 'JavaScript'];

  const filteredStudents = selectedSkillFilter === 'ALL'
    ? students
    : students.filter((s) => s.skills.some((sk) => sk.toLowerCase() === selectedSkillFilter.toLowerCase()));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* City Hero Banner */}
      <div className="neo-card p-6 bg-white dark:bg-[#151726] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C5E17A] via-[#CCCFFA] to-[#C5E17A]" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="neo-badge bg-[#1A1C29] text-[#C5E17A] dark:bg-[#C5E17A] dark:text-[#0E0F1A]">
                CROSS-CAMPUS // 02
              </span>
              <span className="text-xs font-mono text-gray-500">Bengaluru Student Network</span>
            </div>
            <h1 className="neo-heading text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              City <em>Pulse</em> & Discovery
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-xl">
              Break out of your campus bubble. Meet collaborators, join cross-college rooms, and share student energy across Bengaluru.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-mono uppercase text-gray-400">Active Bengaluru Network</div>
              <div className="text-xs font-mono font-bold text-[#6366F1] dark:text-[#C5E17A]">
                6 Campuses • 1,480+ Students
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* City Tabs */}
      <div className="flex border-b border-[#CCCFFA] dark:border-[#282C47] gap-2 overflow-x-auto pb-1">
        {[
          { key: 'pulse', label: 'City Pulse & Hangout', icon: Flame },
          { key: 'people', label: 'People Directory (By Skills)', icon: Users },
          { key: 'clubs', label: 'Cross-Campus Clubs & Rooms', icon: Compass },
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

      {/* Tab 1: City Pulse */}
      {activeTab === 'pulse' && (
        <div className="space-y-6">
          {/* Quick Share to Pulse */}
          <div className="neo-card p-4 bg-white dark:bg-[#151726]">
            <form onSubmit={handleCreatePulse} className="space-y-3">
              <textarea
                value={pulseBody}
                onChange={(e) => setPulseBody(e.target.value)}
                placeholder="Share a thought, poll prompt, or commute moment with students across Bengaluru..."
                rows={2}
                className="w-full text-xs p-2.5 rounded border border-[#CCCFFA] dark:border-[#282C47] bg-[#F5F6FD] dark:bg-[#0E0F1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#C5E17A]"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-gray-400">
                  Surfaces in the citywide cross-campus feed
                </span>
                <button
                  type="submit"
                  disabled={isPosting || !pulseBody.trim()}
                  className="neo-pill-btn neo-pill-btn-primary"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isPosting ? 'Broadcasting...' : 'Drop Pulse'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Posts Feed */}
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="neo-card p-5 bg-white dark:bg-[#151726]">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#1A1C29] text-[#C5E17A] flex items-center justify-center font-mono font-bold text-xs">
                      {post.author_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-gray-900 dark:text-white">
                          {post.author_name}
                        </span>
                        <TrustBadge stage={post.author_verification} size="sm" />
                      </div>
                      <div className="text-[10px] font-mono text-gray-400">
                        @{post.author_handle} {post.college_name ? `• ${post.college_name}` : ''}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setReportTarget({ id: post.id, type: 'POST', title: post.title || post.body })}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>

                {post.title && (
                  <h3 className="neo-heading text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {post.title}
                  </h3>
                )}
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  {post.body}
                </p>

                {/* Interactive Poll Display */}
                {post.poll && (
                  <div className="my-4 p-4 rounded bg-[#F5F6FD] dark:bg-[#0E0F1A] border border-[#CCCFFA] dark:border-[#282C47]">
                    <div className="flex items-center gap-2 mb-3 text-xs font-mono font-bold text-gray-800 dark:text-gray-200">
                      <Vote className="w-4 h-4 text-[#6366F1] dark:text-[#C5E17A]" />
                      <span>{post.poll.question}</span>
                    </div>

                    <div className="space-y-2">
                      {post.poll.options.map((opt) => {
                        const hasVoted = votedPolls[post.id] === opt.id;
                        const totalVotes = post.poll?.options.reduce((acc, o) => acc + o.votes, 0) || 1;
                        const pct = Math.round((opt.votes / totalVotes) * 100);

                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleVote(post.id, opt.id)}
                            disabled={!!votedPolls[post.id]}
                            className={`w-full p-2.5 rounded text-left text-xs font-mono relative overflow-hidden border transition-all ${
                              hasVoted
                                ? 'border-[#C5E17A] bg-[#C5E17A]/15 font-bold'
                                : 'border-[#CCCFFA]/50 dark:border-[#282C47]/50 hover:border-[#C5E17A]'
                            }`}
                          >
                            <div 
                              className="absolute left-0 top-0 bottom-0 bg-[#C5E17A]/20 transition-all duration-500 pointer-events-none"
                              style={{ width: `${pct}%` }}
                            />
                            <div className="relative flex justify-between items-center z-10">
                              <span>{opt.text}</span>
                              <span className="text-[10px] text-gray-500">{opt.votes} votes ({pct}%)</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Opportunity Banner if category == OPPORTUNITY */}
                {post.opportunity_meta && (
                  <div className="mb-4 p-3 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <span className="neo-badge text-[9px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        {post.opportunity_meta.verification_label}
                      </span>
                      <span className="text-xs font-mono ml-2 text-gray-700 dark:text-gray-300">
                        Deadline: {new Date(post.opportunity_meta.deadline || '').toLocaleDateString()}
                      </span>
                    </div>
                    {post.opportunity_meta.external_url && (
                      <a
                        href={post.opportunity_meta.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="neo-pill-btn text-[10px] py-1 px-3"
                      >
                        Apply / Details
                      </a>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs font-mono text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <span>▲ {post.upvotes_count} Upvotes</span>
                    <span>💬 {post.comments_count} Comments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.tags.map((t) => (
                      <span key={t} className="text-[10px] text-indigo-500 dark:text-indigo-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: People Directory */}
      {activeTab === 'people' && (
        <div className="space-y-5">
          {/* Skill Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-xs font-mono text-gray-500 shrink-0">Filter by Skill:</span>
            {allSkills.map((sk) => (
              <button
                key={sk}
                onClick={() => setSelectedSkillFilter(sk)}
                className={`neo-badge text-[10px] transition-colors ${
                  selectedSkillFilter === sk
                    ? 'bg-[#1A1C29] text-[#C5E17A] dark:bg-[#C5E17A] dark:text-[#0E0F1A]'
                    : 'text-gray-600 dark:text-gray-400 hover:border-[#C5E17A]'
                }`}
              >
                {sk}
              </button>
            ))}
          </div>

          {/* Student Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((stud) => (
              <div key={stud.user_id} className="neo-card p-5 bg-white dark:bg-[#151726] flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-[#1A1C29] text-[#C5E17A] flex items-center justify-center font-mono font-bold text-sm">
                        {stud.display_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="neo-heading text-sm font-bold text-gray-900 dark:text-white">
                          {stud.display_name}
                        </h3>
                        <div className="text-[10px] font-mono text-gray-400">
                          @{stud.handle}
                        </div>
                      </div>
                    </div>
                    <TrustBadge stage={stud.verification_stage} size="sm" showLabel={false} />
                  </div>

                  <div className="text-[11px] font-mono text-[#6366F1] dark:text-[#C5E17A] mb-2 truncate">
                    {stud.college_name || 'Bengaluru Student'}
                  </div>

                  {stud.bio && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3 line-clamp-2">
                      {stud.bio}
                    </p>
                  )}

                  {/* Skills Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {stud.skills.map((s) => (
                      <span key={s} className="neo-badge text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-gray-400">
                    {stud.course_branch || 'Engineering'}
                  </span>
                  <Link
                    href={`/messages`}
                    className="neo-pill-btn neo-pill-btn-primary text-[10px] py-1 px-3"
                  >
                    Direct Message
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Cross-Campus Clubs */}
      {activeTab === 'clubs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {communities.map((comm) => (
            <div key={comm.id} className="neo-card p-5 bg-white dark:bg-[#151726] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="neo-badge text-[10px] bg-[#C5E17A]/15 text-[#1A1C29] dark:text-[#C5E17A]">
                    CROSS-CAMPUS CLUB
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

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-[10px] font-mono text-gray-400">
                  Invite Code: <code className="text-[#6366F1] dark:text-[#C5E17A]">{comm.invite_code}</code>
                </span>
                <Link
                  href="/messages"
                  className="neo-pill-btn neo-pill-btn-primary text-xs"
                >
                  Join & Open Chat
                </Link>
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
