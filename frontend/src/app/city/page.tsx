'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VirtualizedFeed } from '@/components/shared/VirtualizedFeed';
import { OptimizedImage } from '@/components/shared/OptimizedImage';
import { useInfinitePostsQuery } from '@/lib/queries';
import Link from 'next/link';
import { 
  Compass, 
  Users, 
  Flame, 
  Sparkles,
  MessageSquare, 
  Send, 
  Vote, 
  Flag,
  Share2,
  Heart,
  Image as ImageIcon,
  Film,
  X,
  Check,
  UserPlus,
  LogIn,
  AlertCircle,
  Camera,
  Coffee,
  Music,
  Cpu,
  HelpCircle
} from 'lucide-react';
import { 
  getCommunities, 
  getStudents,
  votePoll, 
  createPost, 
  reactToPost, 
  sharePost, 
  getPostComments, 
  addComment,
  getActiveProfile,
  isAuthenticated,
  trackAnalyticsEvent
} from '@/lib/api';
import { Post, Community, StudentProfile, Comment } from '@/types';
import { TrustBadge } from '@/components/shared/TrustBadge';
import { ReportModal } from '@/components/shared/ReportModal';
import { CampusHeroBanner } from '@/components/shared/CampusHeroBanner';
import { StudentHoloCard } from '@/components/profile';

export default function CityPage() {
  const [activeTab, setActiveTab] = useState<'feed' | 'directory' | 'communities'>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedPeerHolo, setSelectedPeerHolo] = useState<StudentProfile | null>(null);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('ALL');
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'MEDIA' | 'POLLS' | 'DISCUSSIONS'>('ALL');
  const [sortOrder, setSortOrder] = useState<'LATEST' | 'POPULAR'>('LATEST');
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const postsQuery = useInfinitePostsQuery('city', undefined, 12);
  const feedLoadStartedAt = useRef<number | null>(null);
  const feedLoadReported = useRef(false);
  useEffect(() => { feedLoadStartedAt.current = performance.now(); }, []);
  useEffect(() => {
    if (postsQuery.isSuccess && !feedLoadReported.current && feedLoadStartedAt.current !== null) {
      feedLoadReported.current = true;
      void trackAnalyticsEvent('feed_load_completed', 'city', performance.now() - feedLoadStartedAt.current);
    }
  }, [postsQuery.isSuccess]);
  const hasMorePosts = Boolean(postsQuery.hasNextPage);
  const isLoadingMorePosts = postsQuery.isFetchingNextPage;
  const isFeedLoading = loading || postsQuery.isLoading;

  // Poll voting state
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});

  // Streamlined composer state
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postTags, setPostTags] = useState('Bengaluru');
  const [postCategory, setPostCategory] = useState<'HANGOUT_MEME' | 'DISCUSSION' | 'OPPORTUNITY'>('HANGOUT_MEME');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | 'NONE'>('NONE');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['Option A', 'Option B']);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comments state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<Record<string, boolean>>({});

  // Modals & UI States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string; author: string } | null>(null);
  const [shareModalPost, setShareModalPost] = useState<Post | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: string; type: any; title: string } | null>(null);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
    async function loadData() {
      setLoading(true);
      try {
        const [cData, peers] = await Promise.all([
          getCommunities(),
          getStudents(),
        ]);
        setCommunities((cData || []).filter((c) => c.community_type === 'CROSS_CAMPUS_INTEREST' || !c.college_id));
        setStudents(peers || []);
      } catch (err) {
        console.warn('Could not load the city feed:', err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const incoming = postsQuery.data?.pages.flatMap((page) => page.items) ?? [];
    if (!incoming.length) return;
    setPosts((current) => {
      const currentById = new Map(current.map((post) => [post.id, post]));
      const incomingIds = new Set(incoming.map((post) => post.id));
      return [
        ...incoming.map((post) => currentById.get(post.id) ?? post),
        ...current.filter((post) => !incomingIds.has(post.id)),
      ];
    });
  }, [postsQuery.data?.pages]);

  const loadMorePosts = useCallback(() => {
    if (postsQuery.hasNextPage && !postsQuery.isFetchingNextPage) {
      void postsQuery.fetchNextPage();
    }
  }, [postsQuery.fetchNextPage, postsQuery.hasNextPage, postsQuery.isFetchingNextPage]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('File size exceeds the 20MB limit. Please upload a smaller photo.');
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      alert('Please upload an image (PNG, JPG) or video (MP4) file.');
      return;
    }

    setMediaType(isVideo ? 'VIDEO' : 'IMAGE');

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      setMediaPreview(dataUrl);
      setMediaUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleClearMedia = () => {
    setMediaPreview(null);
    setMediaUrl('');
    setMediaType('NONE');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVote = async (postId: string, optionId: string) => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    if (votedPolls[postId]) return;
    setVotedPolls((prev) => ({ ...prev, [postId]: optionId }));

    try {
      const res = await votePoll(postId, optionId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, poll: res.poll } : p))
      );
    } catch {
      setVotedPolls((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    }
  };

  const handleReaction = async (postId: string) => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    try {
      const res = await reactToPost(postId, 'UPVOTE');
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, upvotes_count: res.upvotes_count, liked_by_me: res.liked_by_me }
            : p
        )
      );
    } catch {
      // Preserve server-confirmed counts when a reaction request fails.
    }
  };

  const handleToggleComments = async (postId: string) => {
    const isOpening = !expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: isOpening }));

    if (isOpening && !commentsByPost[postId]) {
      try {
        const comments = await getPostComments(postId);
        setCommentsByPost((prev) => ({ ...prev, [postId]: comments }));
      } catch {
        setCommentsByPost((prev) => ({ ...prev, [postId]: [] }));
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    const text = commentInput[postId]?.trim();
    if (!text) return;

    setCommentSubmitting((prev) => ({ ...prev, [postId]: true }));
    try {
      const newComment = await addComment(postId, text);
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      setCommentInput((prev) => ({ ...prev, [postId]: '' }));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
      );
    } catch {
      alert('Unable to publish comment. Please check your network connection.');
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    if (!postBody.trim() && !mediaUrl) return;
    setIsPosting(true);

    try {
      const tagsArr = postTags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
      const postPayload: any = {
        category: postCategory,
        title: postTitle.trim() || undefined,
        body: postBody.trim() || (mediaType === 'IMAGE' ? 'Shared a campus photo' : 'Shared a campus video'),
        is_cross_campus: true,
        tags: tagsArr.length > 0 ? tagsArr : ['Bengaluru'],
        media_url: mediaUrl || undefined,
        media_type: mediaType !== 'NONE' ? mediaType : undefined,
      };

      if (showPollCreator && pollQuestion.trim()) {
        postPayload.poll_question = pollQuestion.trim();
        postPayload.poll_options = pollOptions.filter((o) => o.trim());
      }

      const created = await createPost(postPayload);
      setPosts((current) => [created, ...current]);
      setPostTitle('');
      setPostBody('');
      handleClearMedia();
      setShowPollCreator(false);
      setIsComposerExpanded(false);
    } catch {
      alert('Failed to publish post. Please check your network connection.');
    } finally {
      setIsPosting(false);
    }
  };

  // Filter & sort logic
  let displayedPosts = posts.filter((p) => {
    if (feedFilter === 'MEDIA') return !!p.media_url;
    if (feedFilter === 'POLLS') return !!p.poll;
    if (feedFilter === 'DISCUSSIONS') return p.category === 'DISCUSSION' || p.category === 'QUESTION_QA';
    return true;
  });

  if (sortOrder === 'POPULAR') {
    displayedPosts = [...displayedPosts].sort((a, b) => b.upvotes_count - a.upvotes_count);
  }

  const allSkills = ['ALL', 'Python', 'Rust', 'Next.js', 'Figma', 'UI/UX', 'C++', 'JavaScript'];
  const filteredStudents = selectedSkillFilter === 'ALL'
    ? students
    : students.filter((s) => s.skills.some((sk) => sk.toLowerCase() === selectedSkillFilter.toLowerCase()));

  const renderPostCard = (post: Post) => {
    return (<div
                  key={post.id}
                  id={`post-${post.id}`}
                  className="celestial-card p-5 sm:p-6 space-y-4"
                >
                  {/* Author Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-400 text-[#0A0C12] flex items-center justify-center font-mono font-bold text-xs shadow-sm">
                        {post.author_name ? post.author_name.charAt(0) : 'S'}
                      </div>
                      <div>
                        <div className="text-xs font-mono font-bold text-white">
                          {post.author_name || 'Student'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          @{post.author_handle || 'student'} • {post.college_name || 'College not listed'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TrustBadge stage={post.author_verification} size="sm" />
                      <button
                        onClick={() => setReportTarget({ id: post.id, type: 'POST', title: post.title || post.body })}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Report post"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Body */}
                  {post.title && (
                    <h3 className="font-display text-base font-bold text-white">
                      {post.title}
                    </h3>
                  )}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {post.body}
                  </p>

                  {/* Real Photo Media */}
                  {post.media_url && (
                    <div
                      onClick={() => setLightboxImage({ url: post.media_url!, title: post.title, author: post.author_name || 'Student' })}
                      className="aspect-video max-h-96 cursor-pointer overflow-hidden rounded-xl border border-[var(--cg-border)] bg-black/30 relative group"
                    >
                      <OptimizedImage
                        src={post.media_url}
                        alt={post.title || 'Post media'}
                        fill
                        containerClassName="absolute inset-0"
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.01]"
                      />
                    </div>
                  )}

                  {/* Poll Container */}
                  {post.poll && (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
                      <div className="text-xs font-mono text-amber-300 font-bold">
                        {post.poll.question}
                      </div>
                      <div className="space-y-2">
                        {post.poll.options.map((opt) => {
                          const totalVotes = post.poll!.options.reduce((sum, o) => sum + (o.votes || 0), 0);
                          const isVoted = votedPolls[post.id] === opt.id;
                          const pct = totalVotes > 0
                            ? Math.round(((opt.votes || 0) / totalVotes) * 100)
                            : 0;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => handleVote(post.id, opt.id)}
                              className={`w-full p-2.5 rounded-xl text-xs font-mono text-left relative overflow-hidden border transition-all ${
                                isVoted
                                  ? 'border-amber-400/50 bg-amber-500/15 text-amber-200 font-bold'
                                  : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                              }`}
                            >
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-amber-400/10 pointer-events-none transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                              <div className="relative z-10 flex items-center justify-between">
                                <span>{opt.text}</span>
                                <span className="text-[10px] text-slate-400 font-semibold">{pct}% ({opt.votes || 0})</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Reaction Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs font-mono text-slate-400">
                    <div className="flex items-center gap-5">
                      <button
                        onClick={() => handleReaction(post.id)}
                        className={`flex items-center gap-1.5 transition-colors ${
                          post.liked_by_me ? 'text-amber-400 font-bold' : 'hover:text-white'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${post.liked_by_me ? 'fill-amber-400' : ''}`} />
                        <span>{post.upvotes_count}</span>
                      </button>

                      <button
                        onClick={() => handleToggleComments(post.id)}
                        className="flex items-center gap-1.5 hover:text-white transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{post.comments_count} Comments</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setShareModalPost(post);
                        sharePost(post.id).catch(() => {});
                      }}
                      className="flex items-center gap-1.5 hover:text-white transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                  </div>

                  {/* Comment Thread */}
                  {expandedComments[post.id] && (
                    <div className="pt-3 border-t border-white/10 space-y-3">
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {(commentsByPost[post.id] || []).map((comm) => (
                          <div key={comm.id} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs font-mono space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span className="text-white font-semibold">{comm.author_name} (@{comm.author_handle})</span>
                              <span>{new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-slate-300">{comm.body}</p>
                          </div>
                        ))}
                        {(commentsByPost[post.id] || []).length === 0 && (
                          <div className="text-[11px] text-slate-500 font-mono py-1">
                            No comments yet. Be the first to reply.
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentInput[post.id] || ''}
                          onChange={(e) => setCommentInput({ ...commentInput, [post.id]: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                          placeholder="Write a comment..."
                          className="celestial-input flex-1 text-xs py-2 px-3 text-white"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          disabled={commentSubmitting[post.id]}
                          className="btn-campus-amber text-xs font-mono px-4 py-2 font-bold"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* City Hero Banner */}
      <CampusHeroBanner
        title="Bengaluru City Feed"
        badgeText="CROSS-CAMPUS NETWORK"
        shortCode="BLR"
        subtitle="Connect across Bengaluru colleges. Share updates, technical questions, project pitches, and campus events."
        isOfficial={false}
      />

      {/* Primary Segmented Navigation (Hick's Law: 3 clear jobs) */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex gap-2">
          {[
            { key: 'feed', label: 'Feed & Updates', icon: Flame },
            { key: 'directory', label: 'Peer Directory', icon: Users },
            { key: 'communities', label: 'Campus Clubs', icon: Compass },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono transition-all ${
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
      </div>

      {/* TAB 1: FEED */}
      {activeTab === 'feed' && (
        <div className="space-y-6">
          {/* Guest View Row vs Authenticated Composer (Apple HIG Principle 4) */}
          {!isLoggedIn ? (
            <div
              onClick={() => setShowAuthModal(true)}
              className="celestial-card p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-amber-400/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-xs font-mono text-slate-400 group-hover:text-slate-200 transition-colors">
                  Share an update with Bengaluru students...
                </span>
              </div>
              <span className="neo-badge text-[10px] bg-amber-500/15 text-amber-300 border border-amber-400/30 font-medium">
                Sign in to post
              </span>
            </div>
          ) : (
            <div className="celestial-card p-5 border border-white/10 transition-all">
              {!isComposerExpanded ? (
                <div
                  onClick={() => setIsComposerExpanded(true)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-400 text-[#0A0C12] flex items-center justify-center font-mono font-bold text-xs">
                    {getActiveProfile()?.display_name?.charAt(0)<VirtualizedFeed
              items={displayedPosts}
              renderItem={renderPostCard}
              estimateSize={520}
              overscan={3}
              hasMore={hasMorePosts}
              isFetchingNextPage={isLoadingMorePosts}
              onLoadMore={loadMorePosts}
            />
                  key={post.id}
                  id={`post-${post.id}`}
                  className="celestial-card p-5 sm:p-6 space-y-4"
                >
                  {/* Author Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-400 text-[#0A0C12] flex items-center justify-center font-mono font-bold text-xs shadow-sm">
                        {post.author_name ? post.author_name.charAt(0) : 'S'}
                      </div>
                      <div>
                        <div className="text-xs font-mono font-bold text-white">
                          {post.author_name || 'Student'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          @{post.author_handle || 'student'} • {post.college_name || 'College not listed'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TrustBadge stage={post.author_verification} size="sm" />
                      <button
                        onClick={() => setReportTarget({ id: post.id, type: 'POST', title: post.title || post.body })}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Report post"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Body */}
                  {post.title && (
                    <h3 className="font-display text-base font-bold text-white">
                      {post.title}
                    </h3>
                  )}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {post.body}
                  </p>

                  {/* Real Photo Media */}
                  {post.media_url && (
                    <div
                      onClick={() => setLightboxImage({ url: post.media_url!, title: post.title, author: post.author_name || 'Student' })}
                      className="rounded-xl overflow-hidden border border-white/10 max-h-96 cursor-pointer bg-black/50 relative group"
                    >
                      <img
                        src={post.media_url}
                        alt={post.title || 'Post media'}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.01]"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  )}

                  {/* Poll Container */}
                  {post.poll && (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
                      <div className="text-xs font-mono text-amber-300 font-bold">
                        {post.poll.question}
                      </div>
                      <div className="space-y-2">
                        {post.poll.options.map((opt) => {
                          const totalVotes = post.poll!.options.reduce((sum, o) => sum + (o.votes || 0), 0);
                          const isVoted = votedPolls[post.id] === opt.id;
                          const pct = totalVotes > 0
                            ? Math.round(((opt.votes || 0) / totalVotes) * 100)
                            : 0;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => handleVote(post.id, opt.id)}
                              className={`w-full p-2.5 rounded-xl text-xs font-mono text-left relative overflow-hidden border transition-all ${
                                isVoted
                                  ? 'border-amber-400/50 bg-amber-500/15 text-amber-200 font-bold'
                                  : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                              }`}
                            >
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-amber-400/10 pointer-events-none transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                              <div className="relative z-10 flex items-center justify-between">
                                <span>{opt.text}</span>
                                <span className="text-[10px] text-slate-400 font-semibold">{pct}% ({opt.votes || 0})</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Reaction Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs font-mono text-slate-400">
                    <div className="flex items-center gap-5">
                      <button
                        onClick={() => handleReaction(post.id)}
                        className={`flex items-center gap-1.5 transition-colors ${
                          post.liked_by_me ? 'text-amber-400 font-bold' : 'hover:text-white'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${post.liked_by_me ? 'fill-amber-400' : ''}`} />
                        <span>{post.upvotes_count}</span>
                      </button>

                      <button
                        onClick={() => handleToggleComments(post.id)}
                        className="flex items-center gap-1.5 hover:text-white transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{post.comments_count} Comments</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setShareModalPost(post);
                        sharePost(post.id).catch(() => {});
                      }}
                      className="flex items-center gap-1.5 hover:text-white transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                  </div>

                  {/* Comment Thread */}
                  {expandedComments[post.id] && (
                    <div className="pt-3 border-t border-white/10 space-y-3">
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {(commentsByPost[post.id] || []).map((comm) => (
                          <div key={comm.id} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs font-mono space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span className="text-white font-semibold">{comm.author_name} (@{comm.author_handle})</span>
                              <span>{new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-slate-300">{comm.body}</p>
                          </div>
                        ))}
                        {(commentsByPost[post.id] || []).length === 0 && (
                          <div className="text-[11px] text-slate-500 font-mono py-1">
                            No comments yet. Be the first to reply.
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentInput[post.id] || ''}
                          onChange={(e) => setCommentInput({ ...commentInput, [post.id]: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                          placeholder="Write a comment..."
                          className="celestial-input flex-1 text-xs py-2 px-3 text-white"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          disabled={commentSubmitting[post.id]}
                          className="btn-campus-amber text-xs font-mono px-4 py-2 font-bold"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PEER DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
            <span className="text-slate-500 mr-1">Skills:</span>
            {allSkills.map((sk) => (
              <button
                key={sk}
                onClick={() => setSelectedSkillFilter(sk)}
                className={`px-3.5 py-1.5 rounded-full border text-[11px] transition-all ${
                  selectedSkillFilter === sk
                    ? 'border-amber-400/60 bg-amber-500/15 text-amber-300 font-bold'
                    : 'border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {sk}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredStudents.map((s) => (
              <div key={s.user_id} className="celestial-card p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-white">
                      {s.display_name} <span className="text-slate-500">(@{s.handle})</span>
                    </span>
                    <TrustBadge stage={s.verification_stage} size="sm" />
                  </div>
                  <div className="text-xs font-mono text-slate-400 mb-3">
                    {s.college_name || 'Bengaluru College'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.skills.map((sk) => (
                      <span key={sk} className="neo-badge text-[9px] bg-white/5 border border-white/10 text-slate-300">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPeerHolo(s)}
                    className="pill-glass text-xs font-mono py-2 px-3 flex items-center justify-center gap-1.5 text-slate-300 hover:text-white"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
                    <span>Holo ID</span>
                  </button>
                  <Link
                    href="/messages"
                    className="btn-campus-amber flex-1 text-xs font-mono py-2 text-center font-bold"
                  >
                    Send Direct Message
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CAMPUS CLUBS */}
      {activeTab === 'communities' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {communities.map((c) => (
            <div key={c.id} className="celestial-card p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-base font-bold text-white">
                    {c.name}
                  </h3>
                  <span className="text-xs font-mono text-amber-300">
                    {c.member_count} members
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2">
                  {c.description}
                </p>
              </div>
              <Link
                href="/messages"
                className="btn-campus-amber text-xs font-mono py-2 text-center font-bold"
              >
                Open messages
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Guest Sign-in Dialog */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-entrance">
          <div className="celestial-card max-w-sm w-full p-6 border border-white/15 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-[#161926] border border-amber-400/40 flex items-center justify-center text-amber-400 font-display font-bold text-lg mx-auto shadow-sm">
              CG
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white mb-1">
                Join CommonGround
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sign in to share posts, vote in campus polls, and connect with peers across Bengaluru.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href="/signup"
                className="btn-campus-amber w-full py-2.5 text-xs font-mono flex items-center justify-center gap-1.5 font-bold shadow-md"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Join Free (30 seconds)</span>
              </Link>
              <Link
                href="/login"
                className="block w-full py-2.5 rounded-full border border-white/15 text-xs font-mono text-slate-300 hover:text-white hover:border-white/30"
              >
                Sign In to Existing Account
              </Link>
            </div>

            <button
              onClick={() => setShowAuthModal(false)}
              className="text-[11px] font-mono text-slate-500 hover:text-white"
            >
              Cancel & Continue Browsing
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-entrance">
          <div className="celestial-card max-w-sm w-full p-5 border border-white/15 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white">Share Post</span>
              <button onClick={() => setShareModalPost(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 line-clamp-2">"{shareModalPost.body}"</p>
            <button
              onClick={() => {
                const url = `${window.location.origin}/city#post-${shareModalPost.id}`;
                navigator.clipboard.writeText(url);
                setCopiedToast(true);
                setTimeout(() => setCopiedToast(false), 2000);
              }}
              className="btn-campus-amber w-full py-2.5 text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-md"
            >
              {copiedToast ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedToast ? 'Link Copied to Clipboard' : 'Copy Share Link'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
        >
          <img src={lightboxImage.url} alt="Enlarged" className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl" />
        </div>
      )}

      {/* 3D Holographic Peer Card Showcase Modal */}
      {selectedPeerHolo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative flex flex-col items-center max-w-sm w-full">
            <button
              onClick={() => setSelectedPeerHolo(null)}
              className="self-end mb-2 text-xs font-mono text-slate-300 hover:text-white bg-[#12151F] hover:bg-white/[0.08] px-3 py-1.5 rounded-xl border border-white/10 transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Pass</span>
            </button>
            <div className="relative group w-full flex justify-center">
              <StudentHoloCard
                profile={selectedPeerHolo}
                onContactClick={() => {
                  window.location.href = `/messages?userId=${selectedPeerHolo.user_id}`;
                }}
              />
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-3 flex items-center gap-1.5 text-center">
              <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>Interactive 3D Holographic Pass • Move cursor or tilt device</span>
            </div>
          </div>
        </div>
      )}

      {/* Universal Report Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={!!reportTarget}
          targetId={reportTarget.id}
          targetType={reportTarget.type}
          targetTitle={reportTarget.title}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}
