import { 
  College, 
  StudentProfile, 
  Post, 
  Comment,
  Community, 
  Conversation, 
  MessageItem, 
  ProjectItem, 
  TaskItem, 
  EventItem,
  ResourceItem, 
  ReportItem,
  AuthResponse,
  SignUpPayload,
  LoginPayload
} from '@/types';
import { 
  SEED_COLLEGES, 
  DEMO_USERS, 
  SEED_COMMUNITIES, 
  SEED_POSTS, 
  SEED_PROJECTS, 
  SEED_TASKS, 
  SEED_EVENTS 
} from './mockData';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

// Active simulated user for interactive demo & authentication
let activeUserId = '';
let activeAuthToken: string | null = null;
let cachedUserProfile: StudentProfile | null = null;

if (typeof window !== 'undefined') {
  const storedId = localStorage.getItem('cg_active_user_id');
  if (storedId) activeUserId = storedId;
  activeAuthToken = localStorage.getItem('cg_auth_token');
  const storedProf = localStorage.getItem('cg_user_profile');
  if (storedProf) {
    try {
      cachedUserProfile = JSON.parse(storedProf);
    } catch {}
  }
}

export function isAuthenticated(): boolean {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('cg_active_user_id') || !!localStorage.getItem('cg_auth_token');
  }
  return !!activeAuthToken || (!!activeUserId && activeUserId !== '');
}

export function setActiveUser(userId: string) {
  activeUserId = userId;
  activeAuthToken = `cg-user_${userId}`;
  const matched = DEMO_USERS.find((u) => u.user_id === userId);
  if (matched) {
    cachedUserProfile = matched;
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('cg_active_user_id', userId);
    localStorage.setItem('cg_auth_token', `cg-user_${userId}`);
    if (matched) {
      localStorage.setItem('cg_user_profile', JSON.stringify(matched));
    }
  }
}

export function getActiveUserId(): string {
  return activeUserId || DEMO_USERS[0].user_id;
}

export function setAuthSession(auth: AuthResponse) {
  activeUserId = auth.user_id;
  activeAuthToken = auth.token;
  cachedUserProfile = auth.profile;
  if (typeof window !== 'undefined') {
    localStorage.setItem('cg_active_user_id', auth.user_id);
    localStorage.setItem('cg_auth_token', auth.token);
    localStorage.setItem('cg_user_profile', JSON.stringify(auth.profile));
  }
}

export function clearAuthSession() {
  activeUserId = '';
  activeAuthToken = null;
  cachedUserProfile = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cg_active_user_id');
    localStorage.removeItem('cg_auth_token');
    localStorage.removeItem('cg_user_profile');
  }
}

export function getActiveProfile(): StudentProfile {
  if (cachedUserProfile && cachedUserProfile.user_id === activeUserId) {
    return cachedUserProfile;
  }
  if (activeUserId) {
    const found = DEMO_USERS.find((u) => u.user_id === activeUserId);
    if (found) return found;
  }
  return DEMO_USERS[0];
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(activeUserId ? { 'X-User-Id': activeUserId } : {}),
    ...(activeAuthToken ? { 'Authorization': `Bearer ${activeAuthToken}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errDetail = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson) {
        errDetail = errJson.detail || errJson.message || errJson.error || errDetail;
      }
    } catch {}
    throw new ApiError(res.status, errDetail);
  }

  return await res.json();
}

// ----------------------------------------------------
// Authentication & Accounts
// ----------------------------------------------------

export async function signupUser(payload: SignUpPayload): Promise<AuthResponse> {
  try {
    const res = await request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthSession(res);
    return res;
  } catch (err: any) {
    // If backend returned a real HTTP error response (e.g. 400 Duplicate Email or Taken Handle), rethrow
    if (err instanceof ApiError) {
      throw err;
    }
    // Only fall back to local mock session if backend is completely unreachable (network failure)
    console.warn('[API Client] Backend offline, falling back to local signup mock:', err);
    const newId = `u-${Date.now()}`;
    const selectedCol = SEED_COLLEGES.find((c) => c.id === payload.college_id);
    const mockProfile: StudentProfile = {
      user_id: newId,
      handle: payload.handle.replace('@', ''),
      display_name: payload.display_name,
      bio: payload.bio || '',
      college_id: payload.college_id,
      college_name: selectedCol ? selectedCol.name : 'Bengaluru Student',
      verification_stage: payload.email.endsWith('.edu.in') || payload.email.endsWith('.ac.in')
        ? 'STAGE_3_INSTITUTIONAL_VERIFIED'
        : 'STAGE_1_PROVISIONAL',
      course_branch: payload.course_branch || 'Engineering',
      graduation_year: payload.graduation_year || 2028,
      skills: payload.skills || ['Python'],
      interests: payload.interests || ['Hackathons'],
      collaboration_goals: ['Hackathons', 'Side Projects'],
      profile_visibility: 'PUBLIC',
      show_course_year: true,
      dm_permission: 'SAME_CAMPUS_OR_COMMUNITY',
      onboarding_completed: true,
      created_at: new Date().toISOString(),
    };
    const mockAuth: AuthResponse = {
      token: `cg-user_${newId}`,
      user_id: newId,
      email: payload.email,
      profile: mockProfile,
    };
    setAuthSession(mockAuth);
    return mockAuth;
  }
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const res = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthSession(res);
    return res;
  } catch (err: any) {
    // If backend returned a real HTTP error response (e.g. 401 Invalid credentials), rethrow
    if (err instanceof ApiError) {
      throw err;
    }
    // Only fall back to offline demo simulation if backend is completely unreachable
    console.warn('[API Client] Backend offline, checking local demo persona login:', err);
    const term = payload.login.toLowerCase().replace('@', '');
    const matched = DEMO_USERS.find((u) => u.handle.toLowerCase() === term || u.display_name.toLowerCase().includes(term));
    if (!matched) {
      throw new ApiError(401, 'Invalid credentials');
    }
    const mockAuth: AuthResponse = {
      token: `cg-user_${matched.user_id}`,
      user_id: matched.user_id,
      email: `${matched.handle}@commonground.in`,
      profile: matched,
    };
    setAuthSession(mockAuth);
    return mockAuth;
  }
}

// ----------------------------------------------------
// Colleges & Campus
// ----------------------------------------------------

export async function getColleges(): Promise<College[]> {
  try {
    return await request<College[]>('/colleges');
  } catch {
    return SEED_COLLEGES;
  }
}

export async function getCampusOverview(slug: string): Promise<any> {
  try {
    return await request<any>(`/colleges/${slug}`);
  } catch {
    const college = SEED_COLLEGES.find((c) => c.slug === slug) || SEED_COLLEGES[0];
    return {
      college,
      student_created_communities: SEED_COMMUNITIES.filter((c) => c.college_id === college.id),
      official_spaces: [],
      pinned_announcements: [
        { id: 'ann-1', title: 'TechSymposium 2026 Registration Open', body: 'Department of CSE announces student papers call.', is_pinned: true, created_at: new Date().toISOString() },
      ],
      upcoming_events: SEED_EVENTS,
      active_discussions: SEED_POSTS.slice(0, 3),
    };
  }
}

// ----------------------------------------------------
// Identity & Profiles
// ----------------------------------------------------

export async function getMyProfile(): Promise<StudentProfile> {
  try {
    return await request<StudentProfile>('/profiles/me');
  } catch {
    return getActiveProfile();
  }
}

export async function completeOnboarding(payload: Partial<StudentProfile>): Promise<StudentProfile> {
  try {
    return await request<StudentProfile>('/profiles/onboarding', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    const existing = getActiveProfile();
    const updated = { ...existing, ...payload, onboarding_completed: true, verification_stage: 'STAGE_1_PROVISIONAL' as const };
    return updated;
  }
}

export async function blockUser(targetUserId: string): Promise<{ message: string }> {
  try {
    return await request<{ message: string }>(`/profiles/${targetUserId}/block`, { method: 'POST' });
  } catch {
    return { message: 'User blocked successfully' };
  }
}

// ----------------------------------------------------
// Posts, Commons & Feeds
// ----------------------------------------------------

export async function getPosts(scope: 'campus' | 'city' | 'commons' | 'opportunities', tag?: string): Promise<Post[]> {
  try {
    const query = new URLSearchParams({ scope, ...(tag ? { tag } : {}) }).toString();
    return await request<Post[]>(`/posts?${query}`);
  } catch {
    if (scope === 'commons') {
      return SEED_POSTS.filter((p) => p.category === 'QUESTION_QA' || p.category === 'DISCUSSION');
    }
    if (scope === 'opportunities') {
      return SEED_POSTS.filter((p) => p.category === 'OPPORTUNITY');
    }
    return SEED_POSTS;
  }
}

export async function createPost(payload: any): Promise<Post> {
  try {
    return await request<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    const cur = getActiveProfile();
    const newPost: Post = {
      id: `p-${Date.now()}`,
      author_id: cur.user_id,
      author_name: cur.display_name,
      author_handle: cur.handle,
      author_avatar: cur.avatar_url,
      author_verification: cur.verification_stage,
      college_id: cur.college_id,
      college_name: cur.college_name,
      category: payload.category,
      title: payload.title,
      body: payload.body,
      tags: payload.tags || [],
      media_url: payload.media_url,
      media_type: payload.media_type,
      is_cross_campus: payload.is_cross_campus ?? true,
      is_pinned: false,
      upvotes_count: 0,
      comments_count: 0,
      shares_count: 0,
      liked_by_me: false,
      opportunity_meta: payload.opportunity_meta,
      poll: payload.poll_question ? {
        id: `poll-${Date.now()}`,
        question: payload.poll_question,
        options: (payload.poll_options || []).map((t: string, i: number) => ({ id: `opt_${i+1}`, text: t, votes: 0 })),
      } : undefined,
      created_at: new Date().toISOString(),
    };
    return newPost;
  }
}

export async function votePoll(postId: string, optionId: string): Promise<any> {
  try {
    return await request<any>(`/posts/${postId}/vote-poll`, {
      method: 'POST',
      body: JSON.stringify({ option_id: optionId }),
    });
  } catch {
    return { message: 'Vote recorded' };
  }
}

export async function reactToPost(postId: string, reactionType = 'UPVOTE'): Promise<{ post_id: string; upvotes_count: number; liked_by_me: boolean }> {
  try {
    return await request<{ post_id: string; upvotes_count: number; liked_by_me: boolean }>(`/posts/${postId}/react`, {
      method: 'POST',
      body: JSON.stringify({ reaction_type: reactionType }),
    });
  } catch {
    return { post_id: postId, upvotes_count: 1, liked_by_me: true };
  }
}

export async function sharePost(postId: string): Promise<{ post_id: string; shares_count: number; share_url: string }> {
  try {
    return await request<{ post_id: string; shares_count: number; share_url: string }>(`/posts/${postId}/share`, {
      method: 'POST',
    });
  } catch {
    return { post_id: postId, shares_count: 1, share_url: `/city#post-${postId}` };
  }
}

export async function getPostComments(postId: string): Promise<Comment[]> {
  try {
    return await request<Comment[]>(`/posts/${postId}/comments`);
  } catch {
    return [
      {
        id: `c-${postId}-1`,
        post_id: postId,
        author_id: 'aaaa0001-0000-0000-0000-000000000001',
        author_name: 'Aarav Patel',
        author_handle: 'aarav_builder',
        body: 'Great pulse drop! Excited to collaborate on this across campuses.',
        is_useful_answer: false,
        upvotes_count: 2,
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
    ];
  }
}

export async function addComment(postId: string, body: string, parentCommentId?: string): Promise<Comment> {
  try {
    return await request<Comment>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body, parent_comment_id: parentCommentId }),
    });
  } catch {
    const cur = getActiveProfile();
    return {
      id: `c-${Date.now()}`,
      post_id: postId,
      author_id: cur.user_id,
      author_name: cur.display_name,
      author_handle: cur.handle,
      author_avatar: cur.avatar_url,
      parent_comment_id: parentCommentId,
      body,
      is_useful_answer: false,
      upvotes_count: 0,
      created_at: new Date().toISOString(),
    };
  }
}

// ----------------------------------------------------
// Communities & Conversations
// ----------------------------------------------------

export async function getCommunities(collegeId?: string): Promise<Community[]> {
  try {
    const query = collegeId ? `?college_id=${collegeId}` : '';
    return await request<Community[]>(`/communities${query}`);
  } catch {
    if (collegeId) {
      return SEED_COMMUNITIES.filter((c) => c.college_id === collegeId);
    }
    return SEED_COMMUNITIES;
  }
}

export async function joinCommunity(communityId: string): Promise<any> {
  try {
    return await request<any>(`/communities/${communityId}/join`, { method: 'POST' });
  } catch {
    return { message: 'Joined community' };
  }
}

export async function getConversations(): Promise<Conversation[]> {
  try {
    return await request<Conversation[]>('/conversations');
  } catch {
    return [
      {
        id: 'conv0001-0000-0000-0000-000000000001',
        conversation_type: 'ANNOUNCEMENT_CHANNEL',
        community_id: 'c3330003-0000-0000-0000-000000000003',
        title: 'Builder Announcements',
        description: 'Official announcements for Bengaluru Student Builders',
        last_message_at: new Date().toISOString(),
        last_message: 'Demo Day is scheduled for the last Saturday of this month in Koramangala.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'conv0002-0000-0000-0000-000000000002',
        conversation_type: 'GROUP_CHAT',
        community_id: 'c3330003-0000-0000-0000-000000000003',
        title: 'Builders General Chat',
        description: 'Open discussion and project collaboration',
        last_message_at: new Date().toISOString(),
        last_message: 'Hey everyone! Excited to meet founders and builders from PESU and RVCE here.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'conv0003-0000-0000-0000-000000000003',
        conversation_type: 'DIRECT',
        title: 'Diya Sharma',
        description: 'Direct message',
        last_message_at: new Date().toISOString(),
        last_message: 'Hey Aarav, are you free to look over the design sprint guidelines?',
        created_at: new Date().toISOString(),
      },
    ];
  }
}

export async function getMessages(conversationId: string): Promise<MessageItem[]> {
  try {
    return await request<MessageItem[]>(`/conversations/${conversationId}/messages`);
  } catch {
    return [
      {
        id: 'm1',
        conversation_id: conversationId,
        sender_id: 'aaaa0001-0000-0000-0000-000000000001',
        sender_name: 'Aarav Patel',
        sender_handle: 'aarav_builder',
        body: 'Welcome to the channel! Feel free to introduce your background and what you are building.',
        attachments: [],
        is_announcement: true,
        is_pinned: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'm2',
        conversation_id: conversationId,
        sender_id: 'aaaa0002-0000-0000-0000-000000000002',
        sender_name: 'Diya Sharma',
        sender_handle: 'diya_blr',
        body: 'Super pumped for the upcoming cross-campus hackathon!',
        attachments: [],
        is_announcement: false,
        is_pinned: false,
        created_at: new Date().toISOString(),
      },
    ];
  }
}

export async function sendMessage(conversationId: string, body: string): Promise<MessageItem> {
  try {
    return await request<MessageItem>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  } catch {
    const cur = getActiveProfile();
    return {
      id: `msg-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: cur.user_id,
      sender_name: cur.display_name,
      sender_handle: cur.handle,
      body,
      attachments: [],
      is_announcement: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
    };
  }
}

// ----------------------------------------------------
// Projects & Events
// ----------------------------------------------------

export async function getProjects(): Promise<ProjectItem[]> {
  try {
    return await request<ProjectItem[]>('/projects');
  } catch {
    return SEED_PROJECTS;
  }
}

export async function createProject(payload: any): Promise<ProjectItem> {
  try {
    return await request<ProjectItem>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    const cur = getActiveProfile();
    const newProj: ProjectItem = {
      id: `proj-${Date.now()}`,
      creator_id: cur.user_id,
      creator_name: cur.display_name,
      creator_college_name: cur.college_name || 'Bengaluru College',
      title: payload.title,
      pitch: payload.pitch,
      description: payload.description,
      stage: payload.stage || 'IDEA',
      skills_needed: payload.skills_needed || [],
      open_roles: payload.open_roles || [],
      is_cross_campus_open: payload.is_cross_campus_open ?? true,
      repo_or_demo_links: payload.repo_or_demo_links || [],
      members_count: 1,
      created_at: new Date().toISOString(),
    };
    return newProj;
  }
}

export async function getEvents(): Promise<EventItem[]> {
  try {
    return await request<EventItem[]>('/events');
  } catch {
    return SEED_EVENTS;
  }
}

export async function rsvpEvent(eventId: string, status: 'GOING' | 'INTERESTED'): Promise<any> {
  try {
    return await request<any>(`/events/${eventId}/rsvp?status_choice=${status}`, { method: 'POST' });
  } catch {
    return { message: `RSVP marked as ${status}` };
  }
}

// ----------------------------------------------------
// Reports & Moderation
// ----------------------------------------------------

export async function submitReport(payload: { target_type: string; target_id: string; reason: string; details?: string }): Promise<any> {
  try {
    return await request<any>('/moderation/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    return { message: 'Report submitted to moderators' };
  }
}

export async function getModerationQueue(): Promise<ReportItem[]> {
  try {
    return await request<ReportItem[]>('/moderation/queue');
  } catch {
    return [
      {
        id: 'rep-1',
        reporter_id: 'aaaa0003-0000-0000-0000-000000000003',
        target_type: 'POST',
        target_id: 'p0000001-0000-0000-0000-000000000001',
        reason: 'SPAM',
        details: 'Self promotion link posted repeatedly.',
        status: 'PENDING',
        created_at: new Date().toISOString(),
      },
    ];
  }
}

export async function executeModerationAction(payload: any): Promise<any> {
  try {
    return await request<any>('/moderation/actions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    return { message: 'Action recorded successfully' };
  }
}

// ----------------------------------------------------
// Unified Search
// ----------------------------------------------------

export async function unifiedSearch(q: string, signal?: AbortSignal): Promise<any> {
  try {
    return await request<any>(`/search?q=${encodeURIComponent(q)}`, { signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    const term = q.toLowerCase();
    return {
      students: DEMO_USERS.filter((u) => u.handle.includes(term) || u.display_name.toLowerCase().includes(term) || u.skills.some((s) => s.toLowerCase().includes(term))),
      communities: SEED_COMMUNITIES.filter((c) => c.name.toLowerCase().includes(term) || c.description.toLowerCase().includes(term)),
      commons_posts: SEED_POSTS.filter((p) => p.title?.toLowerCase().includes(term) || p.body.toLowerCase().includes(term)),
      resources: [],
      messages: [],
    };
  }
}