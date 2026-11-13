'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Heart,
  Image as ImageIcon,
  Film,
  X,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  ThumbsUp,
  Sparkle,
  Upload,
  Play,
  TrendingUp,
  Clock
} from 'lucide-react';
import { 
  getPosts, 
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
import { ReportModal } from '@/components/shared/ReportModal';
import { CampusHeroBanner } from '@/components/shared/CampusHeroBanner';

export default function CityPage() {
  const [activeTab, setActiveTab] = useState<'pulse' | 'people' | 'clubs'>('pulse');
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

  // Quick Post modal & media upload state
  const [pulseTitle, setPulseTitle] = useState('');
  const [pulseBody, setPulseBody] = useState('');
  const [pulseTags, setPulseTags] = useState('BengaluruPulse, CampusLife');
  const [pulseCategory, setPulseCategory] = useState<'HANGOUT_MEME' | 'DISCUSSION' | 'OPPORTUNITY'>('HANGOUT_MEME');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | 'NONE'>('NONE');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFileName, setMediaFileName] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
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

  // Lightbox & Share modals
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string; author: string } | null>(null);
  const [shareModalPost, setShareModalPost] = useState<Post | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  // Universal Report modal
  const [reportTarget, setReportTarget] = useState<{ id: string; type: any; title: string } | null>(null);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
    async function loadData() {
      setLoading(true);
      const [pData, cData, peers] = await Promise.all([
        getPosts('city'),
        getCommunities(),
        getStudents(),
      ]);
      setPosts(pData);
      setCommunities(cData.filter((c) => c.community_type === 'CROSS_CAMPUS_INTEREST' || !c.college_id));
      setStudents(peers);
      setLoading(false);
    }
    loadData();
  }, []);

  // Handle local file upload (photos or videos)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('File size exceeds 20MB limit. Please upload a smaller photo or clip, or paste a direct media URL.');
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      alert('Please upload an image (PNG, JPG, WebP) or video (MP4, WebM) file.');
      return;
    }

    setMediaFileName(file.name);
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

  const handleApplyCustomUrl = () => {
    const trimmed = customUrlInput.trim();
    if (!trimmed) return;
    const isVideo = /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(trimmed);
    const determinedType = isVideo ? 'VIDEO' : 'IMAGE';
    setMediaType(determinedType);
    setMediaPreview(trimmed);
    setMediaUrl(trimmed);
    setMediaFileName(trimmed.split('/').pop()?.split('?')[0] || (isVideo ? 'Linked Video' : 'Linked Photo'));
    setShowUrlInput(false);
    setCustomUrlInput('');
  };

  const handleClearMedia = () => {
    setMediaUrl('');
    setMediaType('NONE');
    setMediaPreview(null);
    setMediaFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVote = async (postId: string, optionId: string) => {
    setVotedPolls({ ...votedPolls, [postId]: optionId });
    await votePoll(postId, optionId);
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

  const handleLikeToggle = async (postId: string) => {
    // Optimistic UI update
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          const currentlyLiked = !!p.liked_by_me;
          return {
            ...p,
            liked_by_me: !currentlyLiked,
            upvotes_count: currentlyLiked ? Math.max(0, p.upvotes_count - 1) : p.upvotes_count + 1,
          };
        }
        return p;
      })
    );

    try {
      const result = await reactToPost(postId);
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              liked_by_me: result.liked_by_me,
              upvotes_count: result.upvotes_count,
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Failed to react to post', err);
    }
  };

  const handleToggleComments = async (postId: string) => {
    const nextState = !expandedComments[postId];
    setExpandedComments({ ...expandedComments, [postId]: nextState });

    if (nextState && !commentsByPost[postId]) {
      try {
        const comments = await getPostComments(postId);
        setCommentsByPost((prev) => ({ ...prev, [postId]: comments }));
      } catch (err) {
        console.error('Failed to load comments', err);
      }
    }
  };

  const handleAddComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
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
      // Increment count on post card
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
      );
    } catch (err) {
      alert('Failed to post comment');
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleOpenShare = async (post: Post) => {
    setShareModalPost(post);
    try {
      const res = await sharePost(post.id);
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, shares_count: res.shares_count } : p))
      );
    } catch {}
  };

  const handleCopyShareLink = () => {
    if (!shareModalPost) return;
    const url = typeof window !== 'undefined' 
      ? `${window.location.origin}/city#post-${shareModalPost.id}` 
      : `https://commonground.blr/city#post-${shareModalPost.id}`;
    navigator.clipboard.writeText(url);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const handleCreatePulse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pulseBody.trim() && !mediaUrl) return;
    setIsPosting(true);

    try {
      const tagsArr = pulseTags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
      const postPayload: any = {
        category: pulseCategory,
        title: pulseTitle.trim() || undefined,
        body: pulseBody.trim() || (mediaType === 'IMAGE' ? 'Shared a campus photo 📸' : 'Shared a campus clip 🎥'),
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
      setPulseTitle('');
      setPulseBody('');
      handleClearMedia();
      setShowPollCreator(false);
      setPollQuestion('');
      setPollOptions(['Option A', 'Option B']);
    } catch {
      alert('Failed to publish pulse drop');
    } finally {
      setIsPosting(false);
    }
  };

  // Filter & sort logic
  let displayedPosts = posts.filter((p) => {
    if (feedFilter === 'MEDIA') {
      return !!p.media_url;
    }
    if (feedFilter === 'POLLS') {
      return !!p.poll;
    }
    if (feedFilter === 'DISCUSSIONS') {
      return p.category === 'DISCUSSION' || p.category === 'QUESTION_QA';
    }
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Panoramic Celestial City Hero Banner */}
      <CampusHeroBanner
        title="Bengaluru After Hours"
        badgeText="CROSS-CAMPUS RADAR • LIVE"
        shortCode="BLR // CITY PULSE"
        subtitle="Break out of your campus bubble. Share photos & video reels, discover student builders, and tap into night-owl energy across Bengaluru colleges."
        activeCount={1480}
        isOfficial={false}
      />

      {/* Main Tabs */}
      <div className="flex border-b border-purple-500/20 gap-2 overflow-x-auto pb-1">
        {[
          { key: 'pulse', label: 'City Pulse & Media Feed', icon: Flame },
          { key: 'people', label: 'Peer Directory (By Skills)', icon: Users },
          { key: 'clubs', label: 'Cross-Campus Clubs & Rooms', icon: Compass },
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

      {/* Tab 1: City Pulse Feed */}
      {activeTab === 'pulse' && (
        <div className="space-y-6">
          {/* Guest awareness banner if not logged in */}
          {!isLoggedIn && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-amber-500/10 to-purple-950/60 border border-amber-400/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <div className="text-xs font-mono">
                  <span className="font-bold text-[#FDE68A] block">Viewing Bengaluru Student Pulse as Guest</span>
                  <span className="text-[#C4B5FD] text-[11px]">Sign in or create a student account to publish reels, react with college trust badges, and vote in polls.</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href="/login" className="px-3.5 py-1.5 rounded-xl border border-purple-400/40 bg-purple-900/30 text-xs font-mono text-[#F8F7FF] hover:text-[#FDE68A] hover:border-amber-400/50">
                  Sign In
                </Link>
                <Link href="/signup" className="btn-campus-amber px-4 py-1.5 text-xs font-mono font-bold">
                  Join Free
                </Link>
              </div>
            </div>
          )}

          {/* Post Creation Box with Media Upload & Presets */}
          <div className="celestial-card p-5 border border-purple-400/30 shadow-2xl relative overflow-hidden">
            <form onSubmit={handleCreatePulse} className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono uppercase tracking-wider text-[#FDE68A] flex items-center gap-1.5 font-bold">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Broadcast to Bengaluru Student Pulse</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={pulseCategory}
                    onChange={(e) => setPulseCategory(e.target.value as any)}
                    className="celestial-input text-[11px] font-mono py-1 px-2.5 bg-[#090420] text-amber-300"
                  >
                    <option value="HANGOUT_MEME">🎉 Hangout / Meme</option>
                    <option value="DISCUSSION">💡 Discussion</option>
                    <option value="OPPORTUNITY">🚀 Opportunity</option>
                  </select>
                </div>
              </div>

              {/* Title input */}
              <input
                type="text"
                value={pulseTitle}
                onChange={(e) => setPulseTitle(e.target.value)}
                placeholder="Title or topic (optional, e.g. 3 AM robotics test, Metro Purple Line debate)..."
                className="celestial-input w-full text-xs font-mono p-2.5 text-[#F8F7FF]"
              />

              {/* Body textarea */}
              <textarea
                value={pulseBody}
                onChange={(e) => setPulseBody(e.target.value)}
                placeholder="What's happening on your campus? Share moments, questions, hackathon updates, or canteen banter..."
                rows={3}
                className="celestial-input w-full text-xs p-3 leading-relaxed text-[#F8F7FF]"
              />

              {/* Optional Link Media URL Box */}
              {showUrlInput && (
                <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-400/30 flex items-center gap-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="Paste direct photo or video link (https://...jpg, .png, .mp4, etc.)..."
                    className="celestial-input flex-1 text-xs p-2 text-[#F8F7FF]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    className="btn-campus-amber text-xs font-mono py-2 px-3 shrink-0"
                  >
                    Attach Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(false)}
                    className="p-1.5 text-[#7C6FA6] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Attached Media Live Preview */}
              {mediaPreview && (
                <div className="relative rounded-2xl overflow-hidden border border-amber-400/40 bg-purple-950/40 p-2 shadow-lg">
                  <button
                    type="button"
                    onClick={handleClearMedia}
                    className="absolute top-4 right-4 z-20 p-1.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors"
                    title="Remove media"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {mediaType === 'IMAGE' ? (
                    <div className="relative max-h-72 w-full overflow-hidden rounded-xl flex items-center justify-center bg-black/50">
                      <img
                        src={mediaPreview}
                        alt="Upload preview"
                        className="max-h-72 w-auto object-contain rounded-xl"
                      />
                    </div>
                  ) : (
                    <div className="relative max-h-72 w-full overflow-hidden rounded-xl flex items-center justify-center bg-black">
                      <video
                        src={mediaPreview}
                        controls
                        className="max-h-72 w-full rounded-xl"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 px-2 text-[10px] font-mono text-[#FDE68A]">
                    <span className="flex items-center gap-1">
                      {mediaType === 'IMAGE' ? <ImageIcon className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                      <span>{mediaFileName || (mediaType === 'IMAGE' ? 'Photo Attached' : 'Video Attached')}</span>
                    </span>
                    <span className="neo-badge text-[9px] bg-amber-500/20 text-[#FDE68A] border-amber-400/40">
                      {mediaType} READY
                    </span>
                  </div>
                </div>
              )}

              {/* Poll Creator Section */}
              {showPollCreator && (
                <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-400/30 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono text-amber-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Vote className="w-3.5 h-3.5" /> Campus Poll Creator
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPollCreator(false)}
                      className="text-[#7C6FA6] hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Poll Question (e.g. Best late night coffee spot?)"
                    className="celestial-input w-full text-xs p-2 text-[#F8F7FF]"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pollOptions.map((opt, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const next = [...pollOptions];
                          next[idx] = e.target.value;
                          setPollOptions(next);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="celestial-input text-xs p-2 text-[#F8F7FF]"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Toolbar: Upload Photo/Video, Sample Media presets, Poll toggle, Tags */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-purple-500/20">
                <div className="flex flex-wrap items-center gap-2">
                  {/* File Upload Trigger */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,video/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl border border-purple-400/30 bg-[#120836]/70 hover:bg-purple-900/40 text-xs font-mono text-[#C4B5FD] hover:text-[#FDE68A] hover:border-amber-400/40 flex items-center gap-1.5 transition-all"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload File</span>
                  </button>

                  {/* Link URL Button */}
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
                      showUrlInput
                        ? 'border-amber-400 bg-amber-500/20 text-[#FDE68A]'
                        : 'border-purple-400/30 bg-[#120836]/70 text-[#C4B5FD] hover:text-[#FDE68A]'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    <span>Paste Link</span>
                  </button>

                  {/* Poll Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPollCreator(!showPollCreator)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
                      showPollCreator
                        ? 'border-amber-400 bg-amber-500/20 text-[#FDE68A]'
                        : 'border-purple-400/30 bg-[#120836]/70 text-[#C4B5FD] hover:text-white'
                    }`}
                  >
                    <Vote className="w-3.5 h-3.5" />
                    <span>Poll</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isPosting || (!pulseBody.trim() && !mediaUrl)}
                    className="btn-campus-amber text-xs font-mono px-6 py-2 flex items-center gap-1.5 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isPosting ? 'Broadcasting...' : 'Drop Pulse'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Feed Filter & Sort Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'ALL', label: '🔥 All Pulse' },
                { id: 'MEDIA', label: '📸 Photos & Videos' },
                { id: 'POLLS', label: '📊 Campus Polls' },
                { id: 'DISCUSSIONS', label: '💡 Discussions' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFeedFilter(f.id as any)}
                  className={`pill-glass text-[11px] ${feedFilter === f.id ? 'pill-glass-active' : ''}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#7C6FA6]">Sort:</span>
              <button
                onClick={() => setSortOrder(sortOrder === 'LATEST' ? 'POPULAR' : 'LATEST')}
                className="text-xs font-mono text-[#C4B5FD] hover:text-[#FDE68A] flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-950/40 border border-purple-400/20"
              >
                {sortOrder === 'LATEST' ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Latest First</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    <span>Most Upvoted</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Posts Feed List */}
          <div className="space-y-5">
            {displayedPosts.length === 0 && (
              <div className="celestial-card p-10 text-center space-y-2">
                <Compass className="w-10 h-10 text-purple-400 mx-auto opacity-60" />
                <h3 className="font-display text-base font-bold text-white">No pulse drops yet</h3>
                <p className="text-xs font-mono text-[#C4B5FD]">
                  Be the first to drop a campus photo, video, or discussion topic!
                </p>
              </div>
            )}

            {displayedPosts.map((post) => {
              const isCommentsOpen = !!expandedComments[post.id];
              const commentsList = commentsByPost[post.id] || [];

              return (
                <div 
                  key={post.id} 
                  id={`post-${post.id}`}
                  className="celestial-card p-5 hover:border-purple-400/40 transition-all duration-200"
                >
                  {/* Author Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[#090420] flex items-center justify-center font-mono font-bold text-xs shadow-md">
                        {post.author_avatar ? (
                          <img
                            src={post.author_avatar}
                            alt={post.author_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          post.author_name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#F8F7FF]">
                            {post.author_name}
                          </span>
                          <TrustBadge stage={post.author_verification} size="sm" />
                        </div>
                        <div className="text-[10px] font-mono text-[#7C6FA6]">
                          @{post.author_handle} {post.college_name ? `• ${post.college_name}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#7C6FA6] hidden sm:inline">
                        {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => setReportTarget({ id: post.id, type: 'POST', title: post.title || post.body })}
                        className="text-[#7C6FA6] hover:text-rose-400 transition-colors p-1"
                        title="Report content"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Post Title */}
                  {post.title && (
                    <h3 className="font-display text-lg font-bold text-[#F8F7FF] mb-1.5">
                      {post.title}
                    </h3>
                  )}

                  {/* Post Body text */}
                  <p className="text-xs sm:text-sm text-[#C4B5FD] leading-relaxed mb-3">
                    {post.body}
                  </p>

                  {/* Attached Media: Robust Image or Video Playback */}
                  {post.media_url && (post.media_type?.toUpperCase() === 'VIDEO' || /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(post.media_url)) ? (
                    <div className="my-3 rounded-2xl overflow-hidden border border-purple-400/30 bg-black shadow-lg">
                      <video
                        src={post.media_url}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full max-h-96 object-contain"
                      />
                    </div>
                  ) : post.media_url ? (
                    <div 
                      onClick={() => setLightboxImage({ url: post.media_url!, title: post.title, author: post.author_name })}
                      className="my-3 rounded-2xl overflow-hidden border border-purple-400/30 cursor-pointer group relative bg-black/40 shadow-lg"
                    >
                      <img
                        src={post.media_url}
                        alt={post.title || 'Pulse photo'}
                        className="w-full max-h-96 object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                      />
                      <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-mono text-amber-300 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        <span>Click to view full photo</span>
                      </div>
                    </div>
                  ) : null}

                  {/* Interactive Poll Display */}
                  {post.poll && (
                    <div className="my-4 p-4 rounded-2xl bg-purple-950/40 border border-purple-400/25">
                      <div className="flex items-center gap-2 mb-3 text-xs font-mono font-bold text-[#FDE68A]">
                        <Vote className="w-4 h-4 text-[#FBBF24]" />
                        <span>{post.poll.question}</span>
                      </div>

                      <div className="space-y-2.5">
                        {post.poll.options.map((opt) => {
                          const hasVoted = votedPolls[post.id] === opt.id;
                          const totalVotes = post.poll?.options.reduce((acc, o) => acc + o.votes, 0) || 1;
                          const pct = Math.round((opt.votes / totalVotes) * 100);

                          return (
                            <button
                              key={opt.id}
                              onClick={() => handleVote(post.id, opt.id)}
                              disabled={!!votedPolls[post.id]}
                              className={`w-full p-3 rounded-xl text-left text-xs font-mono relative overflow-hidden border transition-all ${
                                hasVoted
                                  ? 'border-amber-400/80 bg-amber-500/15 text-[#FDE68A] font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                  : 'border-purple-400/20 bg-purple-900/20 text-[#C4B5FD] hover:border-purple-400/50 hover:text-white'
                              }`}
                            >
                              <div 
                                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-amber-400 opacity-30 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all duration-500 pointer-events-none"
                                style={{ width: `${pct}%` }}
                              />
                              <div className="relative flex justify-between items-center z-10">
                                <span>{opt.text}</span>
                                <span className="text-[10px] text-[#FDE68A] font-mono">{opt.votes} votes ({pct}%)</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Opportunity Meta banner */}
                  {post.opportunity_meta && (
                    <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="neo-badge text-[9px] bg-amber-500/20 text-[#FDE68A] border-amber-400/40">
                          {post.opportunity_meta.verification_label}
                        </span>
                        <span className="text-xs font-mono ml-2 text-amber-200">
                          Deadline: {new Date(post.opportunity_meta.deadline || '').toLocaleDateString()}
                        </span>
                      </div>
                      {post.opportunity_meta.external_url && (
                        <a
                          href={post.opportunity_meta.external_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-campus-amber text-[10px] py-1 px-3 flex items-center gap-1"
                        >
                          <span>Apply / Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Post Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      {post.tags.map((t) => (
                        <span key={t} className="text-[10px] font-mono text-purple-300 hover:text-amber-300 transition-colors">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bottom Interactive Engagement Bar (Like, Comment, Share) */}
                  <div className="flex items-center justify-between text-xs font-mono text-[#7C6FA6] pt-3 border-t border-purple-500/20">
                    <div className="flex items-center gap-5">
                      {/* Like Button */}
                      <button
                        onClick={() => handleLikeToggle(post.id)}
                        className={`flex items-center gap-1.5 transition-transform active:scale-125 ${
                          post.liked_by_me 
                            ? 'text-rose-400 font-bold' 
                            : 'hover:text-[#FDE68A]'
                        }`}
                        title="Like pulse"
                      >
                        <Heart 
                          className={`w-4 h-4 ${post.liked_by_me ? 'fill-rose-400 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]' : ''}`} 
                        />
                        <span>{post.upvotes_count} Likes</span>
                      </button>

                      {/* Comment Toggle Button */}
                      <button
                        onClick={() => handleToggleComments(post.id)}
                        className={`flex items-center gap-1.5 hover:text-[#FDE68A] transition-colors ${
                          isCommentsOpen ? 'text-amber-300 font-bold' : ''
                        }`}
                        title="Open comments"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments_count} Comments</span>
                      </button>

                      {/* Share Button */}
                      <button
                        onClick={() => handleOpenShare(post)}
                        className="flex items-center gap-1.5 hover:text-[#FDE68A] transition-colors"
                        title="Share pulse"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>{post.shares_count || 0} Shares</span>
                      </button>
                    </div>

                    <span className="text-[10px] font-mono text-[#7C6FA6]">
                      {post.is_cross_campus ? '✦ Cross-Campus Radar' : 'Campus Hub'}
                    </span>
                  </div>

                  {/* Inline Threaded Comments Section */}
                  {isCommentsOpen && (
                    <div className="mt-4 pt-4 border-t border-purple-500/20 space-y-3">
                      {/* Comment Form */}
                      <form onSubmit={(e) => handleAddComment(post.id, e)} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-400 text-[#090420] flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                          {getActiveProfile()?.display_name ? getActiveProfile()!.display_name.charAt(0) : 'U'}
                        </div>
                        <input
                          type="text"
                          value={commentInput[post.id] || ''}
                          onChange={(e) => setCommentInput({ ...commentInput, [post.id]: e.target.value })}
                          placeholder="Add to the conversation..."
                          className="celestial-input flex-1 text-xs py-2 px-3 text-[#F8F7FF]"
                        />
                        <button
                          type="submit"
                          disabled={commentSubmitting[post.id] || !commentInput[post.id]?.trim()}
                          className="btn-campus-amber text-xs font-mono py-2 px-3 flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Reply</span>
                        </button>
                      </form>

                      {/* Comment List */}
                      <div className="space-y-2.5 pt-2">
                        {commentsList.length === 0 ? (
                          <div className="text-center py-3 text-[11px] font-mono text-[#7C6FA6]">
                            No comments yet. Be the first to reply!
                          </div>
                        ) : (
                          commentsList.map((comm) => (
                            <div key={comm.id} className="p-3 rounded-xl bg-purple-950/30 border border-purple-400/20 text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-[#F8F7FF]">{comm.author_name}</span>
                                  <span className="text-[10px] font-mono text-[#7C6FA6]">@{comm.author_handle}</span>
                                </div>
                                <span className="text-[10px] font-mono text-[#7C6FA6]">
                                  {new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[#C4B5FD] text-xs leading-relaxed">{comm.body}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: People Directory */}
      {activeTab === 'people' && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="w-3.5 h-3.5 text-purple-300 shrink-0" />
            <span className="text-xs font-mono text-[#C4B5FD] shrink-0">Filter by Skill:</span>
            {allSkills.map((sk) => (
              <button
                key={sk}
                onClick={() => setSelectedSkillFilter(sk)}
                className={`pill-glass text-[10px] ${
                  selectedSkillFilter === sk ? 'pill-glass-active' : ''
                }`}
              >
                {sk}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.length === 0 ? (
              <div className="col-span-full py-16 text-center celestial-card border-dashed">
                <Users className="w-10 h-10 text-purple-400 mx-auto mb-3 opacity-40" />
                <h3 className="font-display text-base font-bold text-[#F8F7FF] mb-1">
                  No student peers found yet
                </h3>
                <p className="text-xs font-mono text-[#C4B5FD] max-w-sm mx-auto mb-4">
                  Be among the first student builders from your campus to create a profile and showcase your skills!
                </p>
                <Link href="/signup" className="btn-campus-amber text-xs font-mono px-4 py-2 inline-flex items-center gap-1.5 font-bold">
                  <span>Join CommonGround</span>
                </Link>
              </div>
            ) : (
              filteredStudents.map((stud) => (
                <div key={stud.user_id} className="celestial-card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2E1065] to-[#120836] border border-purple-400/40 text-amber-300 flex items-center justify-center font-mono font-bold text-sm shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                        {stud.display_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-display text-sm font-bold text-[#F8F7FF]">
                          {stud.display_name}
                        </h3>
                        <div className="text-[10px] font-mono text-[#7C6FA6]">
                          @{stud.handle}
                        </div>
                      </div>
                    </div>
                    <TrustBadge stage={stud.verification_stage} size="sm" showLabel={false} />
                  </div>

                  <div className="text-[11px] font-mono text-[#FDE68A] mb-2 truncate">
                    {stud.college_name || 'Bengaluru Student'}
                  </div>

                  {stud.bio && (
                    <p className="text-xs text-[#C4B5FD] leading-relaxed mb-3 line-clamp-2">
                      {stud.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {stud.skills.map((s) => (
                      <span key={s} className="neo-badge text-[9px] bg-purple-950/60 border-purple-400/30 text-purple-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-purple-500/20 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-[#7C6FA6]">
                    {stud.course_branch || 'Engineering'}
                  </span>
                  <Link
                    href={`/messages`}
                    className="btn-campus-amber text-[10px] py-1 px-3"
                  >
                    Direct Message
                  </Link>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}

      {/* Tab 3: Cross-Campus Clubs */}
      {activeTab === 'clubs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {communities.length === 0 ? (
            <div className="col-span-full py-16 text-center celestial-card border-dashed">
              <Users className="w-10 h-10 text-purple-400 mx-auto mb-3 opacity-40" />
              <h3 className="font-display text-base font-bold text-[#F8F7FF] mb-1">
                No active cross-campus clubs yet
              </h3>
              <p className="text-xs font-mono text-[#C4B5FD] max-w-sm mx-auto mb-4">
                Be the first to create a student-led collective connecting RVCE, PESU, BMSCE, Christ, MSRIT, and IIITB!
              </p>
              <Link href="/campus" className="btn-campus-amber text-xs font-mono px-4 py-2 inline-flex items-center gap-1.5 font-bold">
                <span>Explore Campus Hubs</span>
              </Link>
            </div>
          ) : (
            communities.map((comm) => (
            <div key={comm.id} className="celestial-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="neo-badge text-[10px] bg-purple-900/60 text-[#C4B5FD] border-purple-400/30">
                    CROSS-CAMPUS CLUB
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

              <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#7C6FA6]">
                  Invite: <code className="text-[#FDE68A]">{comm.invite_code}</code>
                </span>
                <Link
                  href="/messages"
                  className="btn-campus-amber text-xs font-mono px-4 py-1.5"
                >
                  Join & Open Chat
                </Link>
              </div>
            </div>
          )))}
        </div>
      )}

      {/* Fullscreen Photo Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="relative max-w-4xl w-full celestial-card p-4 border border-purple-400/40">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-3">
              <h3 className="font-display text-base font-bold text-white">
                {lightboxImage.title || 'Bengaluru Campus Photo'}
              </h3>
              <p className="text-xs font-mono text-[#C4B5FD]">
                Dropped by {lightboxImage.author}
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden max-h-[75vh] flex items-center justify-center bg-black/60">
              <img
                src={lightboxImage.url}
                alt="Enlarged photo"
                className="max-h-[75vh] w-auto object-contain rounded-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative max-w-md w-full celestial-card p-6 border border-purple-400/40 shadow-2xl">
            <button
              onClick={() => setShareModalPost(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-purple-950/80 text-[#C4B5FD] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center mx-auto mb-2.5">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-white">
                Share Pulse to Squad
              </h3>
              <p className="text-xs font-mono text-[#C4B5FD]">
                Spread the word across your WhatsApp groups, campus discord, or Twitter
              </p>
            </div>

            {copiedToast && (
              <div className="mb-4 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-mono flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Link copied to clipboard!</span>
              </div>
            )}

            <div className="space-y-2.5">
              <button
                onClick={handleCopyShareLink}
                className="w-full py-2.5 px-4 rounded-xl border border-purple-400/30 bg-purple-900/30 hover:bg-purple-900/60 text-xs font-mono text-[#F8F7FF] flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Copy className="w-4 h-4 text-purple-300" />
                  <span>Copy Direct Post Link</span>
                </span>
                <span className="text-[10px] text-amber-300 font-bold">1-Click</span>
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Check out this Bangalore student pulse on CommonGround by ${shareModalPost.author_name}: "${shareModalPost.title || shareModalPost.body.slice(0, 80)}"`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/60 text-xs font-mono text-emerald-200 flex items-center justify-center gap-2 transition-colors"
              >
                <span>Share to WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  `Bengaluru cross-campus student radar: "${shareModalPost.title || shareModalPost.body.slice(0, 80)}" via @CommonGroundBLR`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl border border-sky-500/40 bg-sky-950/40 hover:bg-sky-900/60 text-xs font-mono text-sky-200 flex items-center justify-center gap-2 transition-colors"
              >
                <span>Share on Twitter / X</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
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