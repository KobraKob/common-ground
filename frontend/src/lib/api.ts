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
}

export function getActiveUserId(): string {
  return activeUserId;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    'X-User-Id': activeUserId,
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
    if (!(err instanceof DOMException && err.name === 'AbortError')) {
      console.warn(`[API Client] Falling back to local data for ${endpoint}:`, err);
    }
    throw err;
  }
}

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
