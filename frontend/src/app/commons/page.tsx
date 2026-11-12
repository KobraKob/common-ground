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
  Share2
} from 'lucide-react';
import { getPosts, createPost } from '@/lib/api';
import { Post, ResourceItem } from '@/types';
import { TrustBadge } from '@/components/shared/TrustBadge';
import { ReportModal } from '@/components/shared/ReportModal';

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
      {/* Commons Hero Card */}
      <div className="neo-card p-6 bg-white dark:bg-[#151726] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#CCCFFA] via-[#C5E17A] to-[#6366F1]" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="neo-badge bg-[#1A1C29] text-[#C5E17A] dark:bg-[#C5E17A] dark:text-[#0E0F1A]">
                SEARCHABLE VAULT // 03
              </span>
              <span className="text-xs font-mono text-gray-500">Knowledge Layer</span>
            </div>
            <h1 className="neo-heading text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              The <em>Commons</em>
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-xl">
              Answers that never die in ephemeral chat streams. Search solved questions, peer notes, and study resources across Bengaluru campuses.
            </p>
          </div>

          <button
            onClick={() => setShowAskModal(true)}
            className="neo-pill-btn neo-pill-btn-primary shrink-0 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Ask a Question</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-[#CCCFFA] dark:border-[#282C47] gap-2 overflow-x-auto pb-1">
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

      {/* Tab 1: Q&A Discussions */}
      {activeTab === 'qa' && (
        <div className="space-y-5">
          {/* Tag Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-mono text-gray-500 shrink-0">Tags:</span>
            {popularTags.map((tg) => (
              <button
                key={tg}
                onClick={() => setSelectedTag(tg)}
                className={`neo-badge text-[10px] transition-colors ${
                  selectedTag === tg
                    ? 'bg-[#1A1C29] text-[#C5E17A] dark:bg-[#C5E17A] dark:text-[#0E0F1A]'
                    : 'text-gray-600 dark:text-gray-400 hover:border-[#C5E17A]'
                }`}
              >
                #{tg}
              </button>
            ))}
          </div>

          {/* Q&A Thread List */}
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div key={post.id} className="neo-card p-5 bg-white dark:bg-[#151726]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {post.accepted_answer_comment_id && (
                      <span className="neo-badge text-[9px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Solved Answer</span>
                      </span>
                    )}
                    <span className="neo-badge text-[9px] bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                      {post.category}
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      Asked by @{post.author_handle} {post.college_name ? `(${post.college_name})` : ''}
                    </span>
                  </div>

                  <button
                    onClick={() => setReportTarget({ id: post.id, type: 'POST', title: post.title || post.body })}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="neo-heading text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {post.title}
                </h3>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  {post.body}
                </p>

                {/* Accepted Answer Highlight if present */}
                {post.accepted_answer_comment_id && (
                  <div className="my-3 p-3.5 rounded bg-emerald-500/5 border border-emerald-500/25">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accepted Useful Answer:</span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      Focus on AVL tree rotations and Dijkstra graph implementations. Verified notes available in the Study Vault!
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs font-mono text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <span>▲ {post.upvotes_count} Upvotes</span>
                    <span>💬 {post.comments_count} Answers</span>
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

      {/* Tab 2: Study Resources */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sampleResources.map((res) => (
              <div key={res.id} className="neo-card p-5 bg-white dark:bg-[#151726] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="neo-badge text-[9px] bg-[#C5E17A]/20 text-[#1A1C29] dark:text-[#C5E17A]">
                      VERIFIED STUDY RESOURCE
                    </span>
                    <span className="text-xs font-mono text-gray-400">PDF Document</span>
                  </div>
                  <h3 className="neo-heading text-base font-bold text-gray-900 dark:text-white mb-2">
                    {res.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    {res.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {res.subject_tags.map((t) => (
                      <span key={t} className="neo-badge text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-400">
                    Shared by {res.uploader_name}
                  </span>
                  <a
                    href={res.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="neo-pill-btn neo-pill-btn-primary text-xs"
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
        <div className="neo-card p-6 bg-white dark:bg-[#151726]">
          <h3 className="neo-heading text-lg font-bold text-gray-900 dark:text-white mb-4">
            Campus Topic Directory
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
              <div key={item.tag} className="p-3 rounded border border-[#CCCFFA] dark:border-[#282C47] bg-[#F5F6FD] dark:bg-[#0E0F1A]">
                <div className="text-xs font-mono font-bold text-[#6366F1] dark:text-[#C5E17A]">
                  {item.tag}
                </div>
                <div className="text-[10px] font-mono text-gray-500 mt-0.5">
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ask Question Modal */}
      {showAskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="neo-card w-full max-w-lg p-6 bg-white dark:bg-[#151726] border border-[#CCCFFA] dark:border-[#282C47]">
            <h3 className="neo-heading text-xl font-bold text-gray-900 dark:text-white mb-1">
              Ask the Bengaluru Commons
            </h3>
            <p className="text-xs font-mono text-gray-500 mb-4">
              Your question will be indexed and searchable by students across RVCE, PESU, BMSCE, and beyond.
            </p>

            <form onSubmit={handleAskQuestion} className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Question Title:
                </label>
                <input
                  type="text"
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  placeholder="e.g., What are the best resources to prepare for 5th sem Operating Systems lab viva?"
                  className="w-full text-xs font-mono p-2.5 rounded border border-[#CCCFFA] dark:border-[#282C47] bg-[#F5F6FD] dark:bg-[#0E0F1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#C5E17A]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Detailed Explanation:
                </label>
                <textarea
                  value={qBody}
                  onChange={(e) => setQBody(e.target.value)}
                  placeholder="Provide context on your course, what you have tried, and what specifics you need help with..."
                  rows={4}
                  className="w-full text-xs p-2.5 rounded border border-[#CCCFFA] dark:border-[#282C47] bg-[#F5F6FD] dark:bg-[#0E0F1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#C5E17A]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Topic Tags (comma-separated):
                </label>
                <input
                  type="text"
                  value={qTags}
                  onChange={(e) => setQTags(e.target.value)}
                  placeholder="DSA, Academics, ExamPrep"
                  className="w-full text-xs font-mono p-2.5 rounded border border-[#CCCFFA] dark:border-[#282C47] bg-[#F5F6FD] dark:bg-[#0E0F1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#C5E17A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAskModal(false)}
                  className="neo-pill-btn bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !qTitle.trim() || !qBody.trim()}
                  className="neo-pill-btn neo-pill-btn-primary"
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
