'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  CheckCircle2, 
  FolderDown, 
  Search, 
  Plus, 
  Send, 
  Flag,
  Sparkles,
  X
} from 'lucide-react';
import { getPosts, createPost, getResources, uploadResource, getActiveProfile } from '@/lib/api';
import { Post, ResourceItem } from '@/types';
import { TrustBadge } from '@/components/shared/TrustBadge';
import { ReportModal } from '@/components/shared/ReportModal';
import { CampusHeroBanner } from '@/components/shared/CampusHeroBanner';

// Starter questions to guarantee a rich first visit
const STARTER_COMMONS_POSTS: Post[] = [
  {
    id: 'starter-commons-1',
    author_id: 'aarav-rvce',
    author_name: 'Aarav Patel',
    author_handle: 'aarav_builder',
    college_name: 'RV College of Engineering',
    author_verification: 'STAGE_3_INSTITUTIONAL_VERIFIED',
    category: 'QUESTION_QA',
    title: 'How to prepare for Autonomous 3rd Sem Data Structures exams?',
    body: 'Looking for reliable past notes and important algorithm problems (Trees, Graphs, Sorting). Any RVCE or PESU seniors have pointers?',
    accepted_answer_comment_id: 'ans-1',
    upvotes_count: 34,
    comments_count: 8,
    shares_count: 12,
    is_cross_campus: true,
    is_pinned: false,
    tags: ['DSA', 'Academics', 'VTU'],
    created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
  },
  {
    id: 'starter-commons-2',
    author_id: 'diya-pesu',
    author_name: 'Diya Sharma',
    author_handle: 'diya_design',
    college_name: 'PES University',
    author_verification: 'STAGE_3_INSTITUTIONAL_VERIFIED',
    category: 'QUESTION_QA',
    title: 'Recommended design systems and Figma component libraries for student hackathons?',
    body: 'Building our presentation demo this weekend. What free open-source component systems work fastest with Next.js and Tailwind?',
    upvotes_count: 22,
    comments_count: 5,
    shares_count: 7,
    is_cross_campus: true,
    is_pinned: false,
    tags: ['UIUX', 'Figma', 'Nextjs'],
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
  },
];

export default function CommonsPage() {
  const [activeTab, setActiveTab] = useState<'qa' | 'resources'>('qa');
  const [posts, setPosts] = useState<Post[]>(STARTER_COMMONS_POSTS);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // TipKit contextual discovery prompt
  const [showSubjectTip, setShowSubjectTip] = useState(true);

  // Ask Question form state
  const [showAskModal, setShowAskModal] = useState(false);
  const [qTitle, setQTitle] = useState('');
  const [qBody, setQBody] = useState('');
  const [qTags, setQTags] = useState('DSA, Academics');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: string; type: any; title: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [postsData, resData] = await Promise.all([
          getPosts('commons'),
          getResources(),
        ]);
        const qPosts = (postsData || []).filter((p) => p.category === 'QUESTION_QA' || p.category === 'DISCUSSION');
        if (qPosts.length > 0) {
          setPosts(qPosts);
        } else {
          setPosts(STARTER_COMMONS_POSTS);
        }
        setResources(resData || []);
      } catch (err) {
        console.warn('Using starter commons data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTitle.trim() || !qBody.trim()) return;
    setIsSubmitting(true);
    try {
      const tagsList = qTags.split(',').map((t) => t.trim()).filter(Boolean);
      const created = await createPost({
        category: 'QUESTION_QA',
        title: qTitle,
        body: qBody,
        tags: tagsList,
        is_cross_campus: true,
      });
      setPosts([created, ...posts]);
      setQTitle('');
      setQBody('');
      setShowAskModal(false);
    } catch {
      alert('Failed to publish question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const popularTags = ['ALL', 'DSA', 'Academics', 'VTU', 'Hackathons', 'AI', 'UIUX', 'SystemDesign'];

  const filteredPosts = posts.filter((p) => {
    const postTags = p.tags || [];
    const matchesTag = selectedTag === 'ALL' || postTags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
    const matchesSearch = !searchFilter || (p.title && p.title.toLowerCase().includes(searchFilter.toLowerCase())) || p.body.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesTag && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Commons Hero Banner (Plain wording, no conflicting metrics) */}
      <CampusHeroBanner
        title="Academic Commons"
        badgeText="SEARCHABLE COURSE REPOSITORY • LIVE"
        shortCode="COMMONS // Q&A"
        subtitle="Search peer-verified exam blueprints, lecture summaries, and course Q&A verified by students across Bengaluru campuses."
        isOfficial={true}
        actionSlot={
          <button
            onClick={() => setShowAskModal(true)}
            className="btn-campus-amber text-xs font-mono px-4 py-2 font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Ask a Question</span>
          </button>
        }
      />

      {/* TipKit-style contextual subject prompt */}
      {showSubjectTip && (
        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-400/30 relative">
          <button
            onClick={() => setShowSubjectTip(false)}
            className="absolute top-3 right-3 text-[#7C6FA6] hover:text-white p-1"
            title="Dismiss tip"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-start gap-3 max-w-2xl">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <div className="text-xs font-mono font-bold text-[#FDE68A]">
                Academics Tip: Filter by your current semester subjects
              </div>
              <p className="text-[11px] font-sans text-[#C4B5FD] leading-relaxed">
                Looking for syllabus-specific solutions? Tap a subject filter below to instantly view verified notes and accepted solutions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-2">
        <div className="flex gap-2">
          {[
            { key: 'qa', label: 'Questions & Solutions', icon: HelpCircle },
            { key: 'resources', label: 'Study Resources & Notes', icon: FolderDown },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono transition-all ${
                  isActive
                    ? 'bg-amber-400/15 text-[#FDE68A] font-bold border border-amber-400/40 shadow-sm'
                    : 'text-[#C4B5FD] hover:text-[#F8F7FF] hover:bg-purple-900/20 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FBBF24]' : 'text-[#7C6FA6]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search questions or notes..."
            className="celestial-input w-full text-xs font-mono py-1.5 pl-8 pr-3 text-white placeholder:text-[#7C6FA6]"
          />
        </div>
      </div>

      {/* TAB 1: Q&A DISCUSSIONS */}
      {activeTab === 'qa' && (
        <div className="space-y-4">
          {/* Tag Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
            <span className="text-[#7C6FA6] mr-1">Topics:</span>
            {popularTags.map((tg) => (
              <button
                key={tg}
                onClick={() => setSelectedTag(tg)}
                className={`px-3 py-1 rounded-full border text-[11px] transition-all ${
                  selectedTag === tg
                    ? 'border-amber-400/60 bg-amber-500/15 text-[#FDE68A] font-bold'
                    : 'border-purple-400/20 text-[#7C6FA6] hover:text-white'
                }`}
              >
                #{tg}
              </button>
            ))}
          </div>

          {/* Q&A Thread List */}
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const isSolved = !!post.accepted_answer_comment_id;
              const tagsList = post.tags || [];
              return (
                <div
                  key={post.id}
                  className={`celestial-card p-5 space-y-3 ${isSolved ? 'border-amber-400/40' : 'border-purple-400/25'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isSolved && (
                        <span className="neo-badge text-[9px] bg-amber-500/20 text-[#FDE68A] border-amber-400/40 font-bold">
                          <CheckCircle2 className="w-3 h-3 text-[#FBBF24]" />
                          <span>✦ Accepted Solution</span>
                        </span>
                      )}
                      <span className="neo-badge text-[9px] bg-purple-900/50 text-[#C4B5FD] border-purple-400/30">
                        {post.category}
                      </span>
                      <span className="text-xs font-mono text-[#7C6FA6]">
                        Asked by @{post.author_handle || 'student'} {post.college_name ? `(${post.college_name})` : ''}
                      </span>
                    </div>

                    <button
                      onClick={() => setReportTarget({ id: post.id, type: 'POST', title: post.title || post.body })}
                      className="text-[#7C6FA6] hover:text-rose-400 p-1"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-display text-base font-bold text-[#F8F7FF]">
                    {post.title}
                  </h3>
                  <p className="text-xs text-[#C4B5FD] leading-relaxed">
                    {post.body}
                  </p>

                  {/* Solved Answer Highlight */}
                  {isSolved && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/30 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#FDE68A]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FBBF24]" />
                        <span>Accepted Senior Answer:</span>
                      </div>
                      <p className="text-xs text-amber-100 leading-relaxed">
                        Focus on AVL tree rotations and Dijkstra graph implementations. Verified notes available in the Study Vault!
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs font-mono text-[#7C6FA6] pt-2 border-t border-purple-500/20">
                    <div className="flex items-center gap-4">
                      <span>▲ {post.upvotes_count} Upvotes</span>
                      <span>💬 {post.comments_count} Answers</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {tagsList.map((t) => (
                        <span key={t} className="text-[10px] text-purple-300 font-mono">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: STUDY RESOURCES */}
      {activeTab === 'resources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(resources.length === 0 ? [
            {
              id: 'starter-res-1',
              title: 'Data Structures & Algorithms Semester Blueprint',
              description: 'Comprehensive handwritten lecture notes covering trees, graphs, sorting, and asymptotic analysis for autonomous VTU colleges.',
              uploader_name: 'Aarav Patel (RVCE)',
              subject_tags: ['DSA', 'VTU', 'Algorithms'],
              file_url: 'https://example.com/dsa-notes.pdf',
            },
            {
              id: 'starter-res-2',
              title: 'Computer Networks Packet Tracer Lab Manual',
              description: 'Step-by-step configurations for OSPF, VLAN trunking, and subnetting topologies with verified screenshots.',
              uploader_name: 'Diya Sharma (PESU)',
              subject_tags: ['Networks', 'Labs', 'Cisco'],
              file_url: 'https://example.com/cn-lab.pdf',
            },
          ] : resources).map((res) => {
            const subjectTags = res.subject_tags || [];
            return (
              <div key={res.id} className="celestial-card p-5 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="neo-badge text-[9px] bg-purple-900/60 text-[#C4B5FD] border-purple-400/30">
                      VERIFIED STUDY RESOURCE
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-[#F8F7FF] mb-1">
                    {res.title}
                  </h3>
                  <p className="text-xs text-[#C4B5FD] leading-relaxed mb-3">
                    {res.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {subjectTags.map((t) => (
                      <span key={t} className="neo-badge text-[9px] bg-purple-950/60 border-purple-400/30 text-purple-200">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#7C6FA6]">
                    Shared by {res.uploader_name}
                  </span>
                  {res.file_url && (
                    <button
                      onClick={() => alert('Downloading verified study resource notes...')}
                      className="btn-campus-amber text-xs font-mono px-3.5 py-1.5 flex items-center gap-1 font-bold"
                    >
                      <FolderDown className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ask Question Modal */}
      {showAskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="celestial-card w-full max-w-lg p-6 border border-purple-400/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#F8F7FF]">
                Ask an Academic Question
              </h3>
              <button onClick={() => setShowAskModal(false)} className="text-[#7C6FA6] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAskQuestion} className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1">
                  Question Title
                </label>
                <input
                  type="text"
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  placeholder="e.g. How to prepare for Autonomous 3rd Sem DSA exams?"
                  className="celestial-input w-full text-xs font-mono p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1">
                  Details & Context
                </label>
                <textarea
                  value={qBody}
                  onChange={(e) => setQBody(e.target.value)}
                  placeholder="Include specific concepts, syllabus topics, or assignment details..."
                  rows={4}
                  className="celestial-input w-full text-xs p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1">
                  Topic Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={qTags}
                  onChange={(e) => setQTags(e.target.value)}
                  placeholder="DSA, Academics, VTU"
                  className="celestial-input w-full text-xs font-mono p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAskModal(false)}
                  className="px-4 py-2 text-xs font-mono text-[#C4B5FD] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-campus-amber text-xs font-mono px-4 py-2 font-bold"
                >
                  {isSubmitting ? 'Publishing...' : 'Ask Peers'}
                </button>
              </div>
            </form>
          </div>
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
