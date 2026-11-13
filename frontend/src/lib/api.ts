import { 
  College, 
  StudentProfile, 
  Post, 
  Community, 
  Conversation, 
  MessageItem, 
  ProjectItem, 
  TaskItem, 
  EventItem,
  ResourceItem,
  ReportItem 
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

// Active simulated user for interactive demo
let activeUserId = 'aaaa0001-0000-0000-0000-000000000001'; // Default: Aarav Patel

export function setActiveUser(userId: string) {
  activeUserId = userId;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('commonground.activeUserId', userId);
  }
}

export function getActiveUserId(): string {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('commonground.activeUserId') || activeUserId;
  }
  return activeUserId;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    'X-User-Id': getActiveUserId(),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    // Graceful fallback for mock mode if backend is unreachable
    console.warn(`[API Client] Falling back to local data for ${endpoint}:`, err);
    throw err;
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
    return DEMO_USERS.find((u) => u.user_id === activeUserId) || DEMO_USERS[0];
  }
}

export async function completeOnboarding(payload: Partial<StudentProfile>): Promise<StudentProfile> {
  try {
    return await request<StudentProfile>('/profiles/onboarding', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    const existing = DEMO_USERS.find((u) => u.user_id === activeUserId) || DEMO_USERS[0];
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
    const newPost: Post = {
      id: `p-${Date.now()}`,
      author_id: activeUserId,
      author_name: 'Aarav Patel',
      author_handle: 'aarav_builder',
      author_verification: 'STAGE_3_INSTITUTIONAL_VERIFIED',
      category: payload.category,
      title: payload.title,
      body: payload.body,
      tags: payload.tags || [],
      is_cross_campus: payload.is_cross_campus || false,
      is_pinned: false,
      upvotes_count: 0,
      comments_count: 0,
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
    return {
      id: `msg-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: activeUserId,
      sender_name: 'Aarav Patel',
      sender_handle: 'aarav_builder',
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
    const newProj: ProjectItem = {
      id: `proj-${Date.now()}`,
      creator_id: activeUserId,
      creator_name: 'Aarav Patel',
      creator_college_name: 'RV College of Engineering',
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
