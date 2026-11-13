'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  CheckCircle2, 
  FolderDown, 
  Search, 
  Plus, 
  Flag,
  Sparkles,
  X,
  ThumbsUp,
  MessageSquare,
  Tag,
  ArrowRight
} from 'lucide-react';
import { getPostsPaginated, createPost, getResources, getActiveProfile } from '@/lib/api';
import { Post, ResourceItem } from '@/types';
import { ReportModal } from '@/components/shared/ReportModal';
import { CampusHeroBanner } from '@/components/shared/CampusHeroBanner';

export default function CommonsPage() {
  const [activeTab, setActiveTab] = useState<'qa' | 'resources'>('qa');
  const [posts, setPosts] = useState<Post[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Tip contextual discovery prompt
  const [showSubjectTip, setShowSubjectTip] = useState(true);

  // Ask Question form state
  const [showAskModal, setShowAskModal] = useState(false);
  const [qTitle, setQTitle] = useState('');
  const [qBody, setQBody] = useState('');
  const [qTags, setQTags] = useState('DSA, Academics');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [reportTarget, setReportTarget] = useState<{ id: string; type: any; title: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [postPage, resData] = await Promise.all([
          getPostsPaginated({ scope: 'commons', limit: 20, offset: 0 }),
          getResources(),
        ]);
        const qPosts = (postPage.items || []).filter((post) => post.category === 'QUESTION_QA' || post.category === 'DISCUSSION');
        setPosts(qPosts);
        setResources(resData || []);
      } catch (err) {
        console.warn('Commons content could not be loaded:', err);
        setPosts([]);
        setResources([]);
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
    setErrorMessage('');
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
      setErrorMessage('Your question could not be published. Check your connection and try again.');
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

  const filteredResources = resources.filter((r) => {
    const resTags = r.subject_tags || [];
    const matchesTag = selectedTag === 'ALL' || resTags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
    const matchesSearch = !searchFilter || r.title.toLowerCase().includes(searchFilter.toLowerCase()) || (r.description ? r.description.toLowerCase().includes(searchFilter.toLowerCase()) : false);
    return matchesTag && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Commons Hero Banner */}
      <CampusHeroBanner
        title="Academic Commons"
        badgeText="Student Q&A and resources"
        shortCode="COMMONS // Q&A"
        subtitle="Ask questions, share useful study resources and learn with students across Bengaluru."
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

      {/* Tip contextual subject prompt */}
      {showSubjectTip && (
        <div className="p-4 rounded-xl bg-[#12151F] border border-amber-400/25 relative shadow-sm">
          <button
            onClick={() => setShowSubjectTip(false)}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1"
            title="Dismiss tip"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-start gap-3 max-w-2xl">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-[#FDE68A]">
                Academics Tip: Filter by your current semester subjects
              </div>
              <p className="text-xs font-sans text-slate-400 leading-relaxed">
                Looking for syllabus-specific help? Browse questions or share a resource with other students.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
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
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FBBF24]' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search questions or notes..."
            className="celestial-input w-full text-xs font-mono py-1.5 pl-8 pr-3 text-white placeholder:text-slate-500 rounded-xl border border-white/10 bg-[#0E1017] focus:border-amber-400"
          />
        </div>
      </div>

      {/* Tag Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
        <span className="text-slate-500 mr-1 shrink-0">Topics:</span>
        {popularTags.map((tg) => (
          <button
            key={tg}
            onClick={() => setSelectedTag(tg)}
            className={`px-3 py-1 rounded-full border text-[11px] transition-all whitespace-nowrap ${
              selectedTag === tg
                ? 'border-amber-400/60 bg-amber-500/15 text-[#FDE68A] font-bold'
                : 'border-white/10 text-slate-400 hover:text-white hover:border-white/20'
            }`}
          >
            #{tg}
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="celestial-card p-6 border border-white/10 bg-[#12151F] rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-20 h-5 rounded skeleton-shimmer" />
                <div className="w-32 h-4 rounded skeleton-shimmer" />
              </div>
              <div className="w-3/4 h-5 rounded skeleton-shimmer" />
              <div className="w-full h-12 rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
      )}

      {/* TAB 1: Q&A DISCUSSIONS */}
      {!loading && activeTab === 'qa' && (
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="celestial-card p-12 text-center border border-white/10 bg-[#12151F] rounded-xl space-y-3">
              <HelpCircle className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="font-display text-base font-bold text-white">No questions found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No discussion threads match your current topic or search keyword. Be the first to start the thread!
              </p>
              <button
                onClick={() => setShowAskModal(true)}
                className="btn-campus-amber text-xs font-mono px-4 py-2 font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Ask the Commons</span>
              </button>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const isSolved = !!post.accepted_answer_comment_id;
              const tagsList = post.tags || [];
              return (
                <div
                  key={post.id}
                  className={`celestial-card p-6 rounded-xl border bg-[#12151F] space-y-4 transition-all ${
                    isSolved ? 'border-amber-400/30' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isSolved && (
                        <span className="neo-badge text-[10px] bg-amber-500/15 text-[#FDE68A] border-amber-400/40 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#FBBF24]" />
                          <span>Accepted Solution</span>
                        </span>
                      )}
                      <span className="neo-badge text-[10px] bg-white/5 text-slate-300 border-white/10">
                        {post.category}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Asked by @{post.author_handle || 'student'} {post.college_name ? `(${post.college_name})` : ''}
                      </span>
                    </div>

                    <button
                      onClick={() => setReportTarget({ id: post.id, type: 'POST', title: post.title || post.body })}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Report content"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-display text-base sm:text-lg font-bold text-[#F8F7FF]">
                    {post.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                    {post.body}
                  </p>

                  {isSolved && <div className="flex items-center gap-2 text-[13px] text-[var(--success)]"><CheckCircle2 size={15} /> Accepted answer</div>}

                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5 text-amber-400" />
                        <span>{post.upvotes_count} Upvotes</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>{post.comments_count} Answers</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {tagsList.map((t) => (
                        <span key={t} className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                          <Tag className="w-2.5 h-2.5" />
                          <span>{t}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: STUDY RESOURCES */}
      {!loading && activeTab === 'resources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.length === 0 ? (
            <div className="col-span-2 celestial-card p-12 text-center border border-white/10 bg-[#12151F] rounded-xl space-y-3">
              <FolderDown className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="font-display text-base font-bold text-white">No study notes found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No syllabus resources match this topic filter yet.
              </p>
            </div>
          ) : (
            filteredResources.map((res) => {
              const subjectTags = res.subject_tags || [];
              return (
                <div key={res.id} className="celestial-card p-6 rounded-xl border border-white/10 bg-[#12151F] flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="neo-badge text-[9px] bg-white/5 text-slate-300 border-white/10">
                        STUDY RESOURCE
                      </span>
                    </div>
                    <h3 className="font-display text-base font-bold text-[#F8F7FF] mb-1.5">
                      {res.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">
                      {res.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {subjectTags.map((t) => (
                        <span key={t} className="neo-badge text-[9px] bg-white/5 border-white/10 text-slate-400">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">
                      Shared by {res.uploader_name}
                    </span>
                    {res.file_url && (
                      <a
                        href={res.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary text-sm px-3.5 py-1.5 flex items-center gap-1.5"
                      >
                        <FolderDown className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {errorMessage && <p role="alert" className="rounded-xl bg-[var(--surface)] p-3 text-sm text-[var(--danger)]">{errorMessage}</p>}

      {/* Ask Question Modal */}
      {showAskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="celestial-card w-full max-w-lg p-6 rounded-xl border border-white/10 bg-[#12151F] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#F8F7FF]">
                Ask an Academic Question
              </h3>
              <button onClick={() => setShowAskModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAskQuestion} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
                  Question Title
                </label>
                <input
                  type="text"
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  placeholder="e.g. How to prepare for Autonomous 3rd Sem DSA exams?"
                  className="celestial-input w-full text-xs font-mono p-2.5 text-white rounded-xl border border-white/10 bg-[#0E1017] focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
                  Details &amp; Context
                </label>
                <textarea
                  value={qBody}
                  onChange={(e) => setQBody(e.target.value)}
                  placeholder="Include specific concepts, syllabus topics, or assignment details..."
                  rows={4}
                  className="celestial-input w-full text-xs p-2.5 text-white rounded-xl border border-white/10 bg-[#0E1017] focus:border-amber-400 font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
                  Topic Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={qTags}
                  onChange={(e) => setQTags(e.target.value)}
                  placeholder="DSA, Academics, VTU"
                  className="celestial-input w-full text-xs font-mono p-2.5 text-white rounded-xl border border-white/10 bg-[#0E1017] focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAskModal(false)}
                  className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white"
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
