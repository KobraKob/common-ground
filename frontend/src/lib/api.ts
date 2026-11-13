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
import { BENGALURU_COLLEGES } from '@/constants/colleges';

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

// Active user session state
let activeUserId = '';
let activeAuthToken: string | null = null;
let cachedUserProfile: StudentProfile | null = null;

if (typeof window !== 'undefined') {
  const storedId = localStorage.getItem('cg_active_user_id');
  if (storedId) activeUserId = storedId;
  activeAuthToken = localStorage.getItem('cg_auth_token');
  // Old cg-user_<id> values were unsigned and are no longer valid sessions.
  if (activeAuthToken?.startsWith('cg-user_')) {
    localStorage.removeItem('cg_auth_token');
    localStorage.removeItem('cg_active_user_id');
    localStorage.removeItem('cg_user_profile');
    activeUserId = '';
    activeAuthToken = null;
  }
  const storedProf = localStorage.getItem('cg_user_profile');
  if (storedProf) {
    try {
      cachedUserProfile = JSON.parse(storedProf);
    } catch {
      cachedUserProfile = null;
    }
  }
}

export function isAuthenticated(): boolean {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('cg_active_user_id') && !!localStorage.getItem('cg_auth_token');
  }
  return !!activeAuthToken && !!activeUserId;
}

export function setActiveUser(userId: string) {
  // Identity selection is not authentication. Only signup/login may establish a session.
  activeUserId = userId;
  activeAuthToken = null;
  if (typeof window !== 'undefined') {
    localStorage.setItem('cg_active_user_id', userId);
    localStorage.removeItem('cg_auth_token');
  }
}

export function getActiveUserId(): string {
  return activeUserId || '';
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

export function getActiveProfile(): StudentProfile | null {
  return cachedUserProfile;
}

// In-flight request deduplication store for concurrent GET requests
const inFlightRequests = new Map<string, Promise<any>>();

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  nextOffset: number;
}

export async function requestWithMeta<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; headers: Headers; status: number }> {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const dedupKey = isGet ? `${method}:${endpoint}:${activeAuthToken || 'anon'}` : null;

  if (dedupKey && inFlightRequests.has(dedupKey)) {
    return inFlightRequests.get(dedupKey)!;
  }

  const fetchPromise = (async () => {
    try {
      const headers = {
        'Content-Type': 'application/json',
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

      const data = await res.json();
      return { data, headers: res.headers, status: res.status };
    } finally {
      if (dedupKey) {
        inFlightRequests.delete(dedupKey);
      }
    }
  })();

  if (dedupKey) {
    inFlightRequests.set(dedupKey, fetchPromise);
  }

  return fetchPromise;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const result = await requestWithMeta<T>(endpoint, options);
  return result.data;
}

// ----------------------------------------------------
// Authentication & Accounts
// ----------------------------------------------------

export async function signupUser(payload: SignUpPayload): Promise<AuthResponse> {
  const res = await request<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setAuthSession(res);
  return res;
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const res = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setAuthSession(res);
  return res;
}

// ----------------------------------------------------
// Colleges & Campus
// ----------------------------------------------------

export async function getColleges(): Promise<College[]> {
  try {
    return await request<College[]>('/colleges');
  } catch {
    return BENGALURU_COLLEGES;
  }
}

export async function getCampusOverview(slug: string): Promise<any> {
  try {
    return await request<any>(`/colleges/${slug}`);
  } catch {
    const college = BENGALURU_COLLEGES.find((c) => c.slug === slug) || BENGALURU_COLLEGES[0];
    return {
      college,
      student_created_communities: [],
      official_spaces: [],
      pinned_announcements: [],
      upcoming_events: [],
      active_discussions: [],
    };
  }
}

// ----------------------------------------------------
// Identity & Profiles
// ----------------------------------------------------

export interface PassportStats {
  posts_shared: number;
  projects_joined: number;
  circles_joined: number;
  events_joined: number;
  recent_activity: { label: string; created_at: string }[];
}

export async function getMyPassport(): Promise<PassportStats> {
  return await request<PassportStats>('/me/passport');
}

export async function getCurrentRole(): Promise<{ platform_role: string }> {
  return await request<{ platform_role: string }>('/auth/role');
}

export async function getAdminAnalytics(): Promise<any> {
  return await request<any>('/analytics/overview');
}

export async function getAdminPerformanceMetrics(): Promise<any> {
  return await request<any>('/system/admin/metrics');
}

export async function getMyProfile(): Promise<StudentProfile | null> {
  try {
    const prof = await request<StudentProfile>('/auth/me');
    cachedUserProfile = prof;
    if (typeof window !== 'undefined') {
      localStorage.setItem('cg_user_profile', JSON.stringify(prof));
    }
    return prof;
  } catch {
    return cachedUserProfile;
  }
}

export async function getStudents(skill?: string): Promise<StudentProfile[]> {
  const res = await getStudentsPaginated({ skill, limit: 60, offset: 0 });
  return res.items;
}

export async function getStudentsPaginated({
  skill,
  collegeId,
  limit = 20,
  offset = 0,
}: {
  skill?: string;
  collegeId?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<PaginatedResult<StudentProfile>> {
  try {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      ...(skill && skill !== 'ALL' ? { skill } : {}),
      ...(collegeId ? { college_id: collegeId } : {}),
    });
    const { data, headers } = await requestWithMeta<StudentProfile[]>(`/profiles?${params}`);
    const totalCount = Number(headers.get('x-total-count') || data.length);
    const hasMore = headers.get('x-has-more') === 'true' || offset + data.length < totalCount;
    return {
      items: data,
      totalCount,
      hasMore,
      nextOffset: offset + data.length,
    };
  } catch {
    return { items: [], totalCount: 0, hasMore: false, nextOffset: offset };
  }
}

export async function completeOnboarding(payload: Partial<StudentProfile>): Promise<StudentProfile> {
  const updated = await request<StudentProfile>('/profiles/onboarding', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  cachedUserProfile = updated;
  if (typeof window !== 'undefined') {
    localStorage.setItem('cg_user_profile', JSON.stringify(updated));
  }
  return updated;
}

export async function blockUser(targetUserId: string): Promise<{ message: string }> {
  return await request<{ message: string }>(`/profiles/${targetUserId}/block`, { method: 'POST' });
}

export async function unblockUser(targetUserId: string): Promise<{ message: string }> {
  return await request<{ message: string }>(`/profiles/${targetUserId}/block`, { method: 'DELETE' });
}

// ----------------------------------------------------
// Posts, Commons & Feeds
// ----------------------------------------------------

export async function getPosts(scope: 'campus' | 'city' | 'commons' | 'opportunities', tag?: string): Promise<Post[]> {
  const res = await getPostsPaginated({ scope, tag, limit: 50, offset: 0 });
  return res.items;
}

export async function getPostsPaginated({
  scope,
  tag,
  limit = 20,
  offset = 0,
}: {
  scope: 'campus' | 'city' | 'commons' | 'opportunities';
  tag?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResult<Post>> {
  try {
    const params = new URLSearchParams({
      scope,
      limit: String(limit),
      offset: String(offset),
      ...(tag ? { tag } : {}),
    });
    const { data, headers } = await requestWithMeta<Post[]>(`/posts?${params}`);
    const totalCount = Number(headers.get('x-total-count') || data.length);
    const hasMore = headers.get('x-has-more') === 'true' || offset + data.length < totalCount;
    return {
      items: data,
      totalCount,
      hasMore,
      nextOffset: offset + data.length,
    };
  } catch {
    return { items: [], totalCount: 0, hasMore: false, nextOffset: offset };
  }
}

export async function createPost(payload: any): Promise<Post> {
  return await request<Post>('/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function votePoll(postId: string, optionId: string): Promise<any> {
  return await request<any>(`/posts/${postId}/vote-poll`, {
    method: 'POST',
    body: JSON.stringify({ option_id: optionId }),
  });
}

export async function reactToPost(postId: string, reactionType = 'UPVOTE'): Promise<{ post_id: string; upvotes_count: number; liked_by_me: boolean }> {
  return await request<{ post_id: string; upvotes_count: number; liked_by_me: boolean }>(`/posts/${postId}/react`, {
    method: 'POST',
    body: JSON.stringify({ reaction_type: reactionType }),
  });
}

export async function sharePost(postId: string): Promise<{ post_id: string; shares_count: number; share_url: string }> {
  return await request<{ post_id: string; shares_count: number; share_url: string }>(`/posts/${postId}/share`, {
    method: 'POST',
  });
}

export async function getPostComments(postId: string): Promise<Comment[]> {
  try {
    return await request<Comment[]>(`/posts/${postId}/comments`);
  } catch {
    return [];
  }
}

export async function addComment(postId: string, body: string, parentCommentId?: string): Promise<Comment> {
  return await request<Comment>(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body, parent_comment_id: parentCommentId }),
  });
}

// ----------------------------------------------------
// Communities & Conversations
// ----------------------------------------------------

export async function getCommunities(collegeId?: string): Promise<Community[]> {
  const res = await getCommunitiesPaginated({ collegeId, limit: 50, offset: 0 });
  return res.items;
}

export async function getCommunitiesPaginated({
  collegeId,
  communityType,
  search,
  limit = 20,
  offset = 0,
}: {
  collegeId?: string;
  communityType?: string;
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<PaginatedResult<Community>> {
  try {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      ...(collegeId ? { college_id: collegeId } : {}),
      ...(communityType ? { community_type: communityType } : {}),
      ...(search ? { search } : {}),
    });
    const { data, headers } = await requestWithMeta<Community[]>(`/communities?${params}`);
    const totalCount = Number(headers.get('x-total-count') || data.length);
    const hasMore = headers.get('x-has-more') === 'true' || offset + data.length < totalCount;
    return { items: data, totalCount, hasMore, nextOffset: offset + data.length };
  } catch {
    return { items: [], totalCount: 0, hasMore: false, nextOffset: offset };
  }
}

export async function createCommunity(payload: {
  name: string;
  slug: string;
  description: string;
  community_type: string;
  visibility: string;
}): Promise<Community> {
  return await request<Community>('/communities', { method: 'POST', body: JSON.stringify(payload) });
}

export async function joinCommunity(communityId: string): Promise<any> {
  return await request<any>(`/communities/${communityId}/join`, { method: 'POST' });
}

export async function getConversations(): Promise<Conversation[]> {
  try {
    return await request<Conversation[]>('/conversations');
  } catch {
    return [];
  }
}

export async function getMessages(conversationId: string): Promise<MessageItem[]> {
  const res = await getMessagesPaginated({ conversationId, limit: 50, offset: 0 });
  return res.items;
}

export async function getMessagesPaginated({
  conversationId,
  limit = 50,
  offset = 0,
  q,
}: {
  conversationId: string;
  limit?: number;
  offset?: number;
  q?: string;
}): Promise<PaginatedResult<MessageItem>> {
  try {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      ...(q ? { q } : {}),
    });
    const { data, headers } = await requestWithMeta<MessageItem[]>(`/conversations/${conversationId}/messages?${params}`);
    const totalCount = Number(headers.get('x-total-count') || data.length);
    const hasMore = headers.get('x-has-more') === 'true' || offset + data.length < totalCount;
    return { items: data, totalCount, hasMore, nextOffset: offset + data.length };
  } catch {
    return { items: [], totalCount: 0, hasMore: false, nextOffset: offset };
  }
}

export async function sendMessage(conversationId: string, body: string): Promise<MessageItem> {
  return await request<MessageItem>(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

// ----------------------------------------------------
// Projects & Events
// ----------------------------------------------------

export async function getProjects(): Promise<ProjectItem[]> {
  const res = await getProjectsPaginated({ limit: 50, offset: 0 });
  return res.items;
}

export async function getProjectsPaginated({
  stage,
  skill,
  limit = 20,
  offset = 0,
}: {
  stage?: string;
  skill?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<PaginatedResult<ProjectItem>> {
  try {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      ...(stage ? { stage } : {}),
      ...(skill ? { skill } : {}),
    });
    const { data, headers } = await requestWithMeta<ProjectItem[]>(`/projects?${params}`);
    const totalCount = Number(headers.get('x-total-count') || data.length);
    const hasMore = headers.get('x-has-more') === 'true' || offset + data.length < totalCount;
    return { items: data, totalCount, hasMore, nextOffset: offset + data.length };
  } catch {
    return { items: [], totalCount: 0, hasMore: false, nextOffset: offset };
  }
}

export async function getProject(projectId: string): Promise<ProjectItem> {
  return await request<ProjectItem>(`/projects/${projectId}`);
}

export async function getProjectTasks(projectId: string): Promise<TaskItem[]> {
  return await request<TaskItem[]>(`/projects/${projectId}/tasks`);
}

export async function createProjectTask(projectId: string, payload: { title: string; status?: string; assignee_id?: string }): Promise<TaskItem> {
  return await request<TaskItem>(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateProjectTask(projectId: string, taskId: string, payload: { status?: string; assignee_id?: string }): Promise<TaskItem> {
  return await request<TaskItem>(`/projects/${projectId}/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function createProject(payload: any): Promise<ProjectItem> {
  return await request<ProjectItem>('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getEvents(): Promise<EventItem[]> {
  try {
    return await request<EventItem[]>('/events');
  } catch {
    return [];
  }
}

export async function createEvent(payload: Partial<EventItem>): Promise<EventItem> {
  return await request<EventItem>('/events', { method: 'POST', body: JSON.stringify(payload) });
}

export async function rsvpEvent(eventId: string, status: 'GOING' | 'INTERESTED'): Promise<any> {
  return await request<any>(`/events/${eventId}/rsvp?status_choice=${status}`, { method: 'POST' });
}

// ----------------------------------------------------
// Resources (Vault)
// ----------------------------------------------------

export async function getResources(tag?: string): Promise<ResourceItem[]> {
  try {
    const query = tag ? `?tag=${encodeURIComponent(tag)}` : '';
    return await request<ResourceItem[]>(`/resources${query}`);
  } catch {
    return [];
  }
}

export async function uploadResource(payload: any): Promise<ResourceItem> {
  return await request<ResourceItem>('/resources', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ----------------------------------------------------
// Reports & Moderation
// ----------------------------------------------------

export async function submitReport(payload: { target_type: string; target_id: string; reason: string; details?: string }): Promise<any> {
  return await request<any>('/moderation/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getModerationQueue(): Promise<ReportItem[]> {
  try {
    return await request<ReportItem[]>('/moderation/queue');
  } catch {
    return [];
  }
}

export async function getModerationAuditLogs(): Promise<any[]> {
  return await request<any[]>('/moderation/audit?limit=50');
}

export async function executeModerationAction(payload: any): Promise<any> {
  return await request<any>('/moderation/actions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ----------------------------------------------------
// Unified Search
// ----------------------------------------------------

export async function unifiedSearch(q: string, signal?: AbortSignal): Promise<any> {
  try {
    return await request<any>(`/search?q=${encodeURIComponent(q)}`, { signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    return {
      students: [],
      communities: [],
      commons_posts: [],
      resources: [],
      messages: [],
    };
  }
}
