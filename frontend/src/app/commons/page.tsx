'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  CheckCircle2, 
  FolderDown, 
  Search, 
  Tag, 
  Plus, 
  Send, 
  ExternalLink,
  Flag,
  Share2,
  Sparkles
} from 'lucide-react';
import { getPosts, createPost } from '@/lib/api';
import { Post, ResourceItem } from '@/types';
import { TrustBadge } from '@/components/shared/TrustBadge';
import { ReportModal } from '@/components/shared/ReportModal';
import { CampusHeroBanner } from '@/components/shared/CampusHeroBanner';

export default function CommonsPage() {
  const [activeTab, setActiveTab] = useState<'qa' | 'resources' | 'tags'>('qa');
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Ask Question form state
  const [showAskModal, setShowAskModal] = useState(false);
  const [qTitle, setQTitle] = useState('');
  const [qBody, setQBody] = useState('');
  const [qTags, setQTags] = useState('DSA, Academics');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Report modal
  const [reportTarget, setReportTarget] = useState<{ id: string; type: any; title: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getPosts('commons');
      setPosts(data.filter((p) => p.category === 'QUESTION_QA' || p.category === 'DISCUSSION'));
      setLoading(false);
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

  const sampleResources: ResourceItem[] = [
    {
      id: 'r1',
      uploader_id: 'aaaa0001-0000-0000-0000-000000000001',
      uploader_name: 'Aarav Patel',
      title: 'RVCE Data Structures & Algorithms Comprehensive Notes (Trees & Graphs)',
      description: 'Handwritten summaries, AVL rotation dry-runs, and VTU/Autonomous question bank solutions.',
      file_url: 'https://example.com/rvce-dsa-notes.pdf',
      subject_tags: ['DSA', 'Algorithms', 'RVCE'],
      is_pinned: true,
      is_public_commons: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'r2',
      uploader_id: 'aaaa0002-0000-0000-0000-000000000002',
      uploader_name: 'Diya Sharma',
      title: 'PESU Design Systems & Interaction Heuristics Slide Deck',
      description: 'Figma component token architecture, accessibility contrast ratios, and Y2K aesthetic teardowns.',
      file_url: 'https://example.com/pesu-design-system.pdf',
      subject_tags: ['UIUX', 'DesignSystems', 'Figma'],
      is_pinned: false,
      is_public_commons: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'r3',
      uploader_id: 'aaaa0003-0000-0000-0000-000000000003',
      uploader_name: 'Rohan Kumar',
      title: 'BMSCE 1st Year Engineering Math & Physics Cheatsheet',
      description: 'Vector calculus identities, differential equations, and solved previous year midterms.',
      file_url: 'https://example.com/bmsce-math.pdf',
      subject_tags: ['Math', 'Academics', 'BMSCE'],
      is_pinned: false,
      is_public_commons: true,
      created_at: new Date().toISOString(),
    },
  ];

  const popularTags = ['ALL', 'DSA', 'Academics', 'VTU', 'Hackathons', 'AI', 'UIUX', 'SystemDesign'];

  const filteredPosts = posts.filter((p) => {
    const matchesTag = selectedTag === 'ALL' || p.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
    const matchesSearch = !searchFilter || p.title?.toLowerCase().includes(searchFilter.toLowerCase()) || p.body.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesTag && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Commons Hero Banner */}
      <CampusHeroBanner
        title="The Commons Vault"
        badgeText="SEARCHABLE KNOWLEDGE REPOSITORY • LIVE"
        shortCode="VAULT // ARCHIVE"
        subtitle="Answers that never expire in ephemeral chat streams. Search peer-verified notes, exam prep vaults, and code teardowns across Bengaluru campuses."
        activeCount={890}
        isOfficial={true}
        actionSlot={
          <button
            onClick={() => setShowAskModal(true)}
            className="btn-campus-amber text-xs font-mono px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            <span>Ask a Question</span>
          </button>
        }
      />

      {/* Tabs Bar */}
      <div className="flex border-b border-purple-500/20 gap-2 overflow-x-auto pb-1">
        {[
          { key: 'qa', label: 'Q&A Discussions', icon: HelpCircle },
          { key: 'resources', label: 'Study Resources Vault', icon: FolderDown },
          { key: 'tags', label: 'Topic Tags Directory', icon: Tag },
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

      {/* Tab 1: Q&A Discussions */}
      {activeTab === 'qa' && (
        <div className="space-y-5">
          {/* Tag Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-mono text-[#C4B5FD] shrink-0">Tags:</span>
            {popularTags.map((tg) => (
              <button
                key={tg}
                onClick={() => setSelectedTag(tg)}
                className={`pill-glass text-[10px] ${
                  selectedTag === tg ? 'pill-glass-active' : ''
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
              return (
                <div
                  key={post.id}
                  className={isSolved ? 'celestial-card-amber p-5' : 'celestial-card p-5'}
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isSolved && (
                        <span className="neo-badge text-[9px] bg-amber-500/20 text-[#FDE68A] border-amber-400/40 font-bold">
                          <CheckCircle2 className="w-3 h-3 text-[#FBBF24]" />
                          <span>✦ Solved Useful Answer</span>
                        </span>
                      )}
                      <span className="neo-badge text-[9px] bg-purple-900/50 text-[#C4B5FD] border-purple-400/30">
                        {post.category}
                      </span>
                      <span className="text-xs font-mono text-[#7C6FA6]">
                        Asked by @{post.author_handle} {post.college_name ? `(${post.college_name})` : ''}
                      </span>
                    </div>

                    <button
                      onClick={() => setReportTarget({ id: post.id, type: 'POST', title: post.title || post.body })}
                      className="text-[#7C6FA6] hover:text-rose-400 p-1"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-display text-lg font-bold text-[#F8F7FF] mb-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-[#C4B5FD] leading-relaxed mb-4">
                    {post.body}
                  </p>

                  {/* Accepted Answer Highlight if present */}
                  {post.accepted_answer_comment_id && (
                    <div className="my-3.5 p-4 rounded-xl bg-amber-400/10 border border-amber-400/30 backdrop-blur-md">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FDE68A] mb-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#FBBF24]" />
                        <span>Accepted Community Answer:</span>
                      </div>
                      <p className="text-xs text-amber-100 leading-relaxed">
                        Focus on AVL tree rotations and Dijkstra graph implementations. Verified notes available in the Study Vault!
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs font-mono text-[#7C6FA6] pt-3 border-t border-purple-500/20">
                    <div className="flex items-center gap-4">
                      <span className="hover:text-[#FDE68A] cursor-pointer transition-colors">
                        ▲ {post.upvotes_count} Upvotes
                      </span>
                      <span>💬 {post.comments_count} Answers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.tags.map((t) => (
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

      {/* Tab 2: Study Resources */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sampleResources.map((res) => (
              <div key={res.id} className="celestial-card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="neo-badge text-[9px] bg-purple-900/60 text-[#C4B5FD] border-purple-400/30">
                      VERIFIED STUDY RESOURCE
                    </span>
                    <span className="text-xs font-mono text-[#FDE68A]">PDF Document</span>
                  </div>
                  <h3 className="font-display text-base font-bold text-[#F8F7FF] mb-2">
                    {res.title}
                  </h3>
                  <p className="text-xs text-[#C4B5FD] leading-relaxed mb-4">
                    {res.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {res.subject_tags.map((t) => (
                      <span key={t} className="neo-badge text-[9px] bg-purple-950/60 border-purple-400/30 text-purple-200">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#7C6FA6]">
                    Shared by {res.uploader_name}
                  </span>
                  <a
                    href={res.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-campus-amber text-xs font-mono px-4 py-1.5"
                  >
                    <FolderDown className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Topic Tags */}
      {activeTab === 'tags' && (
        <div className="celestial-card p-6">
          <h3 className="font-display text-lg font-bold text-[#F8F7FF] mb-4 flex items-center gap-2">
            <span>Campus Topic Directory</span>
            <span className="text-[#FBBF24]">✦</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { tag: '#DSA', count: '142 Questions' },
              { tag: '#VTU', count: '98 Notes' },
              { tag: '#AI', count: '84 Projects' },
              { tag: '#UIUX', count: '61 Critiques' },
              { tag: '#Internships', count: '55 Postings' },
              { tag: '#Robotics', count: '39 Labs' },
              { tag: '#BengaluruCommute', count: '76 Moments' },
              { tag: '#Hackathons', count: '112 Teammate Requests' },
            ].map((item) => (
              <div key={item.tag} className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-950/30 hover:border-amber-400/40 transition-colors">
                <div className="text-xs font-mono font-bold text-[#FDE68A]">
                  {item.tag}
                </div>
                <div className="text-[10px] font-mono text-[#7C6FA6] mt-1">
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ask Question Modal */}
      {showAskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="celestial-card w-full max-w-lg p-6 border border-purple-400/30 shadow-2xl">
            <h3 className="font-display text-xl font-bold text-[#F8F7FF] mb-1">
              Ask the Bengaluru Commons
            </h3>
            <p className="text-xs font-mono text-[#C4B5FD] mb-4">
              Your question will be indexed and searchable across RVCE, PESU, BMSCE, Christ, and beyond.
            </p>

            <form onSubmit={handleAskQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1.5">
                  Question Title:
                </label>
                <input
                  type="text"
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  placeholder="e.g., What are the best resources to prepare for 5th sem Operating Systems lab viva?"
                  className="celestial-input w-full text-xs font-mono p-3"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1.5">
                  Detailed Explanation:
                </label>
                <textarea
                  value={qBody}
                  onChange={(e) => setQBody(e.target.value)}
                  placeholder="Provide context on your course, what you have tried, and what specifics you need help with..."
                  rows={4}
                  className="celestial-input w-full text-xs p-3 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1.5">
                  Topic Tags (comma-separated):
                </label>
                <input
                  type="text"
                  value={qTags}
                  onChange={(e) => setQTags(e.target.value)}
                  placeholder="DSA, Academics, ExamPrep"
                  className="celestial-input w-full text-xs font-mono p-3"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAskModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-mono text-[#C4B5FD] hover:text-[#F8F7FF] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !qTitle.trim() || !qBody.trim()}
                  className="btn-campus-amber text-xs font-mono px-5 py-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Post Question'}</span>
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
