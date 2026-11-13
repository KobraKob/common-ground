'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
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
  Lock,
  ArrowRight,
  UserPlus,
  LogIn,
  Info
} from 'lucide-react';
import { 
  getPosts, 
  getPostsPaginated,
  getCommunities, 
  getStudents,
  votePoll, 
  createPost, 
  reactToPost, 
  sharePost, 
  getPostComments, 
  addComment,
  getActiveProfile,
  isAuthenticated
} from '@/lib/api';
import { Post, Community, StudentProfile, Comment } from '@/types';
import { TrustBadge } from '@/components/shared/TrustBadge';
import { OptimizedImage } from '@/components/shared/OptimizedImage';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

const CampusHeroBanner = dynamic(
  () => import('@/components/shared/CampusHeroBanner').then((m) => m.CampusHeroBanner),
  { ssr: true, loading: () => <div className="h-60 rounded-3xl celestial-card animate-pulse" /> }
);
const ReportModal = dynamic(
  () => import('@/components/shared/ReportModal').then((m) => m.ReportModal),
  { ssr: false }
);

// Pre-seeded starter posts (Apple HIG: Seed the empty feed with clearly labelled starter content)
const STARTER_SPOTLIGHT_POSTS: Post[] = [
  {
    id: 'spotlight-1',
    author_id: 'aarav-rvce',
    author_name: 'Aarav Patel',
    author_handle: 'aarav_builder',
    college_name: 'RV College of Engineering',
    author_verification: 'STAGE_3_INSTITUTIONAL_VERIFIED',
    category: 'HANGOUT_MEME',
    title: 'RVCE 8th Mile Stage Production Soundcheck 🎸',
    body: '3 AM soundcheck done for the battle of bands. Bass is vibrating the entire mechanical block! Tomorrow 6 PM main stage kick-off.',
    media_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900',
    media_type: 'IMAGE',
    upvotes_count: 134,
    comments_count: 18,
    shares_count: 22,
    is_cross_campus: true,
    is_pinned: false,
    tags: ['RVCE', '8thMile', 'Music'],
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'spotlight-2',
    author_id: 'diya-pesu',
    author_name: 'Diya Sharma',
    author_handle: 'diya_design',
    college_name: 'PES University',
    author_verification: 'STAGE_3_INSTITUTIONAL_VERIFIED',
    category: 'DISCUSSION',
    title: 'Late Night Coffee & Study Banter ☕',
    body: 'Exam prep season is officially here. Where are students heading at midnight in Bengaluru?',
    poll: {
      id: 'poll-1',
      question: 'Best midnight study caffeine spot?',
      options: [
        { id: 'opt-1', text: 'Rameshwaram Cafe (Indiranagar)', votes: 82 },
        { id: 'opt-2', text: 'Third Wave (Koramangala 24/7)', votes: 65 },
        { id: 'opt-3', text: 'Dorm Canteen Chai Tapri', votes: 114 },
      ],
    },
    upvotes_count: 98,
    comments_count: 24,
    shares_count: 15,
    is_cross_campus: true,
    is_pinned: false,
    tags: ['BengaluruPulse', 'CampusLife', 'Coffee'],
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'spotlight-3',
    author_id: 'rohan-bmsce',
    author_name: 'Rohan Kumar',
    author_handle: 'rohan_systems',
    college_name: 'BMS College of Engineering',
    author_verification: 'STAGE_3_INSTITUTIONAL_VERIFIED',
    category: 'OPPORTUNITY',
    title: 'Looking for a ROS2 Vision Contributor for Drone Project',
    body: 'We are prototyping an autonomous line-of-sight drone for smart agriculture. Looking for a cross-campus teammate with OpenCV or ROS2 experience.',
    upvotes_count: 56,
    comments_count: 9,
    shares_count: 11,
    is_cross_campus: true,
    is_pinned: false,
    tags: ['Robotics', 'BuildSquad', 'BMSCE'],
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export default function CityPage() {
  const [activeTab, setActiveTab] = useState<'feed' | 'directory' | 'communities'>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('ALL');
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'MEDIA' | 'POLLS' | 'DISCUSSIONS'>('ALL');
  const [sortOrder, setSortOrder] = useState<'LATEST' | 'POPULAR'>('LATEST');
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Poll voting state
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});

  // Streamlined composer state for authenticated users
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postTags, setPostTags] = useState('BengaluruPulse');
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

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string; author: string } | null>(null);
  const [shareModalPost, setShareModalPost] = useState<Post | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: string; type: any; title: string } | null>(null);

  // Infinite scrolling state
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [postsOffset, setPostsOffset] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMorePosts = async () => {
    if (isFetchingMore || !hasMorePosts) return;
    setIsFetchingMore(true);
    try {
      const next = await getPostsPaginated({ scope: 'city', limit: 10, offset: postsOffset });
      if (next.items.length > 0) {
        setPosts((prev) => [...prev, ...next.items]);
        setPostsOffset(next.nextOffset);
        setHasMorePosts(next.hasMore);
      } else {
        setHasMorePosts(false);
      }
    } catch {
      setHasMorePosts(false);
    } finally {
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    if (!sentinelRef.current || !hasMorePosts || isFetchingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMorePosts, isFetchingMore, postsOffset]);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
    async function loadData() {
      setLoading(true);
      const [pPage, cData, peers] = await Promise.all([
        getPostsPaginated({ scope: 'city', limit: 10, offset: 0 }),
        getCommunities(),
        getStudents(),
      ]);
      // If feed is empty, seed with starter spotlight posts (Apple HIG rule)
      if (!pPage.items || pPage.items.length === 0) {
        setPosts(STARTER_SPOTLIGHT_POSTS);
        setHasMorePosts(false);
      } else {
        setPosts(pPage.items);
        setHasMorePosts(pPage.hasMore);
        setPostsOffset(pPage.nextOffset);
      }
      setCommunities(cData.filter((c) => c.community_type === 'CROSS_CAMPUS_INTEREST' || !c.college_id));
      setStudents(peers);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('File size exceeds 20MB limit. Please upload a smaller photo or clip.');
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      alert('Please upload an image (PNG, JPG) or video (MP4) file.');
      return;
    }

    const determinedType = isVideo ? 'VIDEO' : 'IMAGE';
    setMediaType(determinedType);

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
      // optimistic state stays
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
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                upvotes_count: p.liked_by_me ? p.upvotes_count - 1 : p.upvotes_count + 1,
                liked_by_me: !p.liked_by_me,
              }
            : p
        )
      );
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
      alert('Failed to post comment');
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
        body: postBody.trim() || (mediaType === 'IMAGE' ? 'Shared a campus photo 📸' : 'Shared a campus clip 🎥'),
        is_cross_campus: true,
        tags: tagsArr.length > 0 ? tagsArr : ['BengaluruPulse'],
        media_url: mediaUrl || undefined,
        media_type: mediaType !== 'NONE' ? mediaType : undefined,
      };

      if (showPollCreator && pollQuestion.trim()) {
        postPayload.poll_question = pollQuestion.trim();
        postPayload.poll_options = pollOptions.filter((o) => o.trim());
      }

      const created = await createPost(postPayload);
      setPosts([created, ...posts]);
      setPostTitle('');
      setPostBody('');
      handleClearMedia();
      setShowPollCreator(false);
      setIsComposerExpanded(false);
    } catch {
      alert('Failed to publish post');
    } finally {
      setIsPosting(false);
    }
  };

  // Filter & sort
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* City Hero Banner */}
      <CampusHeroBanner
        title="Bengaluru City Feed"
        badgeText="CROSS-CAMPUS RADAR • LIVE"
        shortCode="BLR // CITY"
        subtitle="Connect across Bengaluru colleges. Share moments, questions, hackathon updates, and campus life."
        isOfficial={false}
      />

      {/* Primary Segmented Navigation (Deference: Content First) */}
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
        <div className="flex gap-2">
          {[
            { key: 'feed', label: 'Posts & Moments', icon: Flame },
            { key: 'directory', label: 'Peer Directory', icon: Users },
            { key: 'communities', label: 'Campus Clubs', icon: Compass },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono transition-all ${
                  isActive
                    ? 'bg-amber-400/15 text-[#FDE68A] font-bold border border-amber-400/40 shadow-sm'
                    : 'text-[#C4B5FD] hover:text-white hover:bg-purple-900/20 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FBBF24]' : 'text-[#7C6FA6]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ErrorBoundary name="City Views">
        {/* TAB 1: POSTS FEED */}
      {activeTab === 'feed' && (
        <div className="space-y-5">
          {/* 1. Guest Composer Row vs Authenticated Composer (Apple HIG Principle 4) */}
          {!isLoggedIn ? (
            /* Guest View: Collapsed single row asking for sign-in on tap */
            <div
              onClick={() => setShowAuthModal(true)}
              className="celestial-card p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:border-amber-400/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-900/50 border border-purple-400/30 flex items-center justify-center text-purple-300">
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-xs font-mono text-[#7C6FA6] group-hover:text-[#C4B5FD] transition-colors">
                  Share something with Bengaluru students...
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="neo-badge text-[10px] bg-amber-500/15 text-[#FDE68A] border-amber-400/30">
                  Sign in to post
                </span>
              </div>
            </div>
          ) : (
            /* Authenticated Student Composer (Progressive Disclosure) */
            <div className="celestial-card p-4 border border-purple-400/30 transition-all">
              {!isComposerExpanded ? (
                <div
                  onClick={() => setIsComposerExpanded(true)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-400 text-[#090420] flex items-center justify-center font-mono font-bold text-xs">
                    {getActiveProfile()?.display_name?.charAt(0) || 'U'}
                  </div>
                  <input
                    type="text"
                    readOnly
                    placeholder="Share a campus update, question, or photo..."
                    className="celestial-input w-full text-xs font-mono py-2 px-3 text-[#F8F7FF] cursor-pointer"
                  />
                </div>
              ) : (
                <form onSubmit={handleCreatePost} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#FDE68A]">
                      New Post
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsComposerExpanded(false)}
                      className="text-[#7C6FA6] hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="Title (optional)..."
                    className="celestial-input w-full text-xs font-mono p-2 text-[#F8F7FF]"
                  />

                  <textarea
                    value={postBody}
                    onChange={(e) => setPostBody(e.target.value)}
                    placeholder="What's happening on your campus?"
                    rows={3}
                    className="celestial-input w-full text-xs p-2.5 text-[#F8F7FF]"
                    autoFocus
                  />

                  {/* Attached Media Preview */}
                  {mediaPreview && (
                    <div className="relative rounded-xl overflow-hidden border border-amber-400/30 p-2 bg-black/40">
                      <button
                        type="button"
                        onClick={handleClearMedia}
                        className="absolute top-3 right-3 p-1 rounded-full bg-black/80 text-white hover:bg-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <img src={mediaPreview} alt="Upload preview" className="max-h-48 object-contain rounded-lg mx-auto" />
                    </div>
                  )}

                  {/* Poll Creator */}
                  {showPollCreator && (
                    <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-400/20 space-y-2">
                      <input
                        type="text"
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        placeholder="Poll Question?"
                        className="celestial-input w-full text-xs p-2 text-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        {pollOptions.map((opt, i) => (
                          <input
                            key={i}
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const next = [...pollOptions];
                              next[i] = e.target.value;
                              setPollOptions(next);
                            }}
                            className="celestial-input text-xs p-1.5 text-white"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Composer Toolbar */}
                  <div className="flex items-center justify-between pt-2 border-t border-purple-500/20">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 rounded-lg border border-purple-400/30 hover:border-amber-400/50 text-[#C4B5FD] hover:text-[#FDE68A] text-xs font-mono flex items-center gap-1"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Photo</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPollCreator(!showPollCreator)}
                        className="p-1.5 rounded-lg border border-purple-400/30 hover:border-amber-400/50 text-[#C4B5FD] hover:text-[#FDE68A] text-xs font-mono flex items-center gap-1"
                      >
                        <Vote className="w-3.5 h-3.5" />
                        <span>Poll</span>
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isPosting}
                      className="btn-campus-amber text-xs font-mono px-4 py-1.5 flex items-center gap-1.5 font-bold"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isPosting ? 'Posting...' : 'Post'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 2. Filter Pills (Clean Segmented Control) */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'MEDIA', label: 'Photos & Videos' },
                { id: 'POLLS', label: 'Polls' },
                { id: 'DISCUSSIONS', label: 'Discussions' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFeedFilter(filter.id as any)}
                  className={`px-3 py-1 rounded-full border text-[11px] transition-all ${
                    feedFilter === filter.id
                      ? 'border-amber-400/60 bg-amber-500/15 text-[#FDE68A] font-bold shadow-sm'
                      : 'border-purple-400/20 text-[#7C6FA6] hover:text-white hover:border-purple-400/40'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSortOrder(sortOrder === 'LATEST' ? 'POPULAR' : 'LATEST')}
              className="text-[11px] text-[#7C6FA6] hover:text-[#FDE68A] transition-colors"
            >
              Sort: <strong className="text-white">{sortOrder === 'LATEST' ? 'Latest' : 'Most Upvoted'}</strong>
            </button>
          </div>

          {/* 3. Post Feed Cards */}
          <div className="space-y-4">
            {displayedPosts.map((post) => (
              <div
                key={post.id}
                id={`post-${post.id}`}
                className="celestial-card p-4 sm:p-5 border border-purple-400/25 space-y-3"
              >
                {/* Author row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[#090420] flex items-center justify-center font-mono font-bold text-xs shadow-sm">
                      {post.author_name ? post.author_name.charAt(0) : 'S'}
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-[#F8F7FF]">
                        {post.author_name || 'Student Builder'}
                      </div>
                      <div className="text-[10px] font-mono text-[#7C6FA6]">
                        @{post.author_handle || 'student'} • {post.college_name || 'Bengaluru Campus'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <TrustBadge stage={post.author_verification} size="sm" />
                    <button
                      onClick={() => setReportTarget({ id: post.id, type: 'POST', title: post.title || post.body })}
                      className="text-[#7C6FA6] hover:text-rose-400 p-1"
                      title="Report post"
                    >
                      <Flag className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Post content */}
                {post.title && (
                  <h3 className="text-xs font-mono font-semibold text-[#F8F7FF]">
                    {post.title}
                  </h3>
                )}
                <p className="text-xs text-[#C4B5FD] leading-relaxed">
                  {post.body}
                </p>

                {/* Media */}
                {post.media_url && (
                  <div
                    onClick={() => setLightboxImage({ url: post.media_url!, title: post.title, author: post.author_name || 'Student' })}
                    className="rounded-xl overflow-hidden border border-purple-400/20 max-h-80 cursor-pointer bg-black/40 relative group"
                  >
                    <OptimizedImage
                      src={post.media_url}
                      alt={post.title || 'Post media'}
                      className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform"
                    />
                  </div>
                )}

                {/* Poll */}
                {post.poll && (
                  <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-400/20 space-y-2">
                    <div className="text-xs font-mono text-[#FDE68A] font-bold">
                      {post.poll.question}
                    </div>
                    <div className="space-y-1.5">
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
                            className={`w-full p-2 rounded-xl text-xs font-mono text-left relative overflow-hidden border transition-all ${
                              isVoted
                                ? 'border-amber-400/50 bg-amber-500/15 text-[#FDE68A] font-bold'
                                : 'border-purple-400/20 bg-purple-900/20 text-[#C4B5FD] hover:border-purple-400/40'
                            }`}
                          >
                            <div
                              className="absolute left-0 top-0 bottom-0 bg-amber-400/10 transition-all pointer-events-none"
                              style={{ width: `${pct}%` }}
                            />
                            <div className="relative z-10 flex items-center justify-between">
                              <span>{opt.text}</span>
                              <span className="text-[10px] text-[#7C6FA6]">{pct}% ({opt.votes || 0})</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reaction bar */}
                <div className="flex items-center justify-between pt-2 border-t border-purple-500/20 text-xs font-mono text-[#7C6FA6]">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleReaction(post.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        post.liked_by_me ? 'text-amber-400 font-bold' : 'hover:text-[#FDE68A]'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${post.liked_by_me ? 'fill-amber-400' : ''}`} />
                      <span>{post.upvotes_count}</span>
                    </button>

                    <button
                      onClick={() => handleToggleComments(post.id)}
                      className="flex items-center gap-1.5 hover:text-[#F8F7FF] transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{post.comments_count}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setShareModalPost(post);
                      sharePost(post.id).catch(() => {});
                    }}
                    className="flex items-center gap-1 hover:text-purple-300 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                </div>

                {/* Inline Comment thread */}
                {expandedComments[post.id] && (
                  <div className="pt-3 border-t border-purple-500/15 space-y-2.5">
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {(commentsByPost[post.id] || []).map((comm) => (
                        <div key={comm.id} className="p-2 rounded-xl bg-purple-950/30 text-xs font-mono">
                          <div className="flex items-center justify-between text-[10px] text-[#7C6FA6] mb-0.5">
                            <span className="text-white font-semibold">{comm.author_name} (@{comm.author_handle})</span>
                          </div>
                          <p className="text-[#C4B5FD]">{comm.body}</p>
                        </div>
                      ))}
                      {(commentsByPost[post.id] || []).length === 0 && (
                        <div className="text-[11px] text-[#7C6FA6] font-mono py-1">
                          No comments yet. Be the first to reply!
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
                        className="celestial-input flex-1 text-xs py-1.5 px-3 text-white"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={commentSubmitting[post.id]}
                        className="btn-campus-amber text-xs font-mono px-3 py-1.5 font-bold"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Infinite Scroll Sentinel & Loader */}
          <div ref={sentinelRef} className="py-4 text-center">
            {isFetchingMore && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/80 border border-purple-400/30 text-xs font-mono text-amber-300 shadow-md">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Loading more pulse moments...</span>
              </div>
            )}
            {!hasMorePosts && posts.length > 3 && (
              <div className="text-[11px] font-mono text-purple-400/60 py-2">
                ✦ You have caught up with all city pulse moments ✦
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PEER DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
            <span className="text-[#7C6FA6] mr-1">Filter Skills:</span>
            {allSkills.map((sk) => (
              <button
                key={sk}
                onClick={() => setSelectedSkillFilter(sk)}
                className={`px-3 py-1 rounded-full border text-[11px] transition-all ${
                  selectedSkillFilter === sk
                    ? 'border-amber-400/60 bg-amber-500/15 text-[#FDE68A] font-bold'
                    : 'border-purple-400/20 text-[#7C6FA6] hover:text-white'
                }`}
              >
                {sk}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredStudents.map((s) => (
              <div key={s.user_id} className="celestial-card p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-white">
                      {s.display_name} <span className="text-[#7C6FA6]">(@{s.handle})</span>
                    </span>
                    <TrustBadge stage={s.verification_stage} size="sm" />
                  </div>
                  <div className="text-[11px] font-mono text-[#C4B5FD] mb-2">
                    {s.college_name || 'Bengaluru College'}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {s.skills.map((sk) => (
                      <span key={sk} className="neo-badge text-[9px] bg-purple-950/70 border-purple-400/30 text-purple-200">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  href="/messages"
                  className="btn-campus-amber text-[10px] font-mono py-1.5 text-center font-bold"
                >
                  Send Direct Message
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CAMPUS CLUBS */}
      {activeTab === 'communities' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {communities.map((c) => (
            <div key={c.id} className="celestial-card p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-display text-sm font-bold text-white">
                    {c.name}
                  </span>
                  <span className="text-[10px] font-mono text-[#FDE68A]">
                    {c.member_count} members
                  </span>
                </div>
                <p className="text-xs text-[#C4B5FD] line-clamp-2 mb-3">
                  {c.description}
                </p>
              </div>
              <Link
                href="/messages"
                className="btn-campus-amber text-[10px] font-mono py-1.5 text-center font-bold"
              >
                Join Channel
              </Link>
            </div>
          ))}
        </div>
      )}
      </ErrorBoundary>

      {/* Guest Sign-in Popover Sheet (Apple HIG Rule 4: Ask sign-in only in exchange for value) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="celestial-card max-w-sm w-full p-6 border border-amber-400/40 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2E1065] to-[#120836] border border-amber-400/50 flex items-center justify-center text-[#FBBF24] font-display font-bold text-lg mx-auto shadow-md">
              CG
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white mb-1">
                Join the Campus Conversation
              </h3>
              <p className="text-xs text-[#C4B5FD] leading-relaxed">
                Sign in to publish posts, participate in polls, and connect with peers across Bengaluru.
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
                className="block w-full py-2 rounded-xl border border-purple-400/30 text-xs font-mono text-[#C4B5FD] hover:text-white hover:border-amber-400/40"
              >
                Sign In to Existing Account
              </Link>
            </div>

            <button
              onClick={() => setShowAuthModal(false)}
              className="text-[11px] font-mono text-[#7C6FA6] hover:text-white"
            >
              Cancel & Continue Browsing
            </button>
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

      {/* Share Modal */}
      {shareModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="celestial-card max-w-sm w-full p-5 border border-purple-400/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white">Share Post</span>
              <button onClick={() => setShareModalPost(null)} className="text-[#7C6FA6] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#C4B5FD] line-clamp-2">"{shareModalPost.body}"</p>
            <button
              onClick={() => {
                const url = `${window.location.origin}/city#post-${shareModalPost.id}`;
                navigator.clipboard.writeText(url);
                setCopiedToast(true);
                setTimeout(() => setCopiedToast(false), 2000);
              }}
              className="btn-campus-amber w-full py-2 text-xs font-mono font-bold flex items-center justify-center gap-2"
            >
              {copiedToast ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedToast ? 'Link Copied to Clipboard!' : 'Copy Share Link'}</span>
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
          <img src={lightboxImage.url} alt="Enlarged" className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl" />
        </div>
      )}
    </div>
  );
}
