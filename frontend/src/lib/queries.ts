import { 
  useQuery, 
  useInfiniteQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { 
  getPosts, 
  getPostsPaginated, 
  getColleges, 
  getCommunities, 
  getStudents, 
  createPost, 
  reactToPost, 
  getMyProfile,
  getProjects,
  createProject,
  requestToJoinProject,
  getCommunitiesPaginated,
  joinCommunity,
  createCommunity,
  getEvents,
  createEvent,
  rsvpEvent,
  getProject,
  getProjectTasks,
  createProjectTask,
  updateProjectTask,
  getMyPassport,
  getAdminAnalytics,
  getAdminPerformanceMetrics,
} from './api';
import { Post, College, Community, StudentProfile, ProjectItem, EventItem, TaskItem } from '@/types';

// Query Keys
export const queryKeys = {
  posts: (scope: string, tag?: string) => ['posts', scope, tag ?? 'all'] as const,
  infinitePosts: (scope: string, tag?: string) => ['posts', 'infinite', scope, tag ?? 'all'] as const,
  colleges: ['colleges'] as const,
  communities: (collegeId?: string) => ['communities', collegeId ?? 'all'] as const,
  students: (skill?: string) => ['students', skill ?? 'all'] as const,
  profile: ['profile', 'me'] as const,
  projects: ['projects'] as const,
  interestCircles: ['communities', 'cross-campus-interest'] as const,
  events: ['events'] as const,
};

// 1. Infinite Posts Query for Infinite Scrolling
export function useInfinitePostsQuery(
  scope: 'campus' | 'city' | 'commons' | 'opportunities',
  tag?: string,
  limit: number = 10
) {
  return useInfiniteQuery({
    queryKey: queryKeys.infinitePosts(scope, tag),
    queryFn: async ({ pageParam = 0 }) => {
      return await getPostsPaginated({
        scope,
        tag,
        limit,
        offset: pageParam,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextOffset : undefined;
    },
    staleTime: 30 * 1000, // 30s
  });
}

// 2. Regular Posts Query
export function usePostsQuery(scope: 'campus' | 'city' | 'commons' | 'opportunities', tag?: string) {
  return useQuery({
    queryKey: queryKeys.posts(scope, tag),
    queryFn: () => getPosts(scope, tag),
    staleTime: 30 * 1000,
  });
}

// 3. Colleges Query (Cached for 5 minutes)
export function useCollegesQuery() {
  return useQuery({
    queryKey: queryKeys.colleges,
    queryFn: getColleges,
    staleTime: 5 * 60 * 1000,
  });
}

// 4. Communities Query
export function useCommunitiesQuery(collegeId?: string) {
  return useQuery({
    queryKey: queryKeys.communities(collegeId),
    queryFn: () => getCommunities(collegeId),
    staleTime: 60 * 1000,
  });
}

// 5. Students Query
export function useStudentsQuery(skill?: string) {
  return useQuery({
    queryKey: queryKeys.students(skill),
    queryFn: () => getStudents(skill),
    staleTime: 60 * 1000,
  });
}

// 6. User Profile Query
export function useProfileQuery() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: getMyProfile,
    staleTime: 2 * 60 * 1000,
  });
}

// 7. Mutations with automatic cache invalidation
export function useCreatePostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => createPost(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useReactPostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, reactionType }: { postId: string; reactionType?: string }) =>
      reactToPost(postId, reactionType),
    onSuccess: (data) => {
      // Optimistically or selectively update post reaction
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}


// Project discovery and collaboration
export function useProjectsQuery() {
  return useQuery({ queryKey: queryKeys.projects, queryFn: getProjects, staleTime: 30_000 });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof createProject>[0]) => createProject(payload),
    onSuccess: (project) => queryClient.setQueryData<ProjectItem[]>(queryKeys.projects, (current = []) => [project, ...current]),
  });
}

export function useJoinProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, roleTitle, pitchNote }: { projectId: string; roleTitle: string; pitchNote: string }) =>
      requestToJoinProject(projectId, roleTitle, pitchNote),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
  });
}

export function useProjectQuery(projectId: string) {
  return useQuery({ queryKey: ['project', projectId], queryFn: () => getProject(projectId), enabled: Boolean(projectId) });
}

export function useProjectTasksQuery(projectId: string, enabled: boolean) {
  return useQuery({ queryKey: ['project', projectId, 'tasks'], queryFn: () => getProjectTasks(projectId), enabled: Boolean(projectId) && enabled, staleTime: 15_000 });
}

export function useCreateProjectTaskMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; status?: string; assignee_id?: string }) => createProjectTask(projectId, payload),
    onSuccess: (task) => queryClient.setQueryData<TaskItem[]>(['project', projectId, 'tasks'], (current = []) => [...current, task]),
  });
}

export function useUpdateProjectTaskMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) => updateProjectTask(projectId, taskId, { status }),
    onSuccess: (task) => queryClient.setQueryData<TaskItem[]>(['project', projectId, 'tasks'], (current = []) => current.map((item) => item.id === task.id ? task : item)),
  });
}

// Cross-campus interest circles
export function useInterestCirclesQuery() {
  return useQuery({
    queryKey: queryKeys.interestCircles,
    queryFn: async () => (await getCommunitiesPaginated({ communityType: 'CROSS_CAMPUS_INTEREST', limit: 20, offset: 0 })).items,
    staleTime: 60_000,
  });
}

export function useJoinCircleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (communityId: string) => joinCommunity(communityId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.interestCircles }),
  });
}

export function useCreateCircleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof createCommunity>[0]) => createCommunity(payload),
    onSuccess: (circle) => queryClient.setQueryData<Community[]>(queryKeys.interestCircles, (current = []) => [circle, ...current]),
  });
}

// Events
export function useEventsQuery() {
  return useQuery({ queryKey: queryKeys.events, queryFn: getEvents, staleTime: 30_000 });
}

export function useCreateEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof createEvent>[0]) => createEvent(payload),
    onSuccess: (event) => queryClient.setQueryData<EventItem[]>(queryKeys.events, (current = []) => [...current, event].sort((a, b) => a.starts_at.localeCompare(b.starts_at))),
  });
}

export function useRsvpEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: 'GOING' | 'INTERESTED' }) => rsvpEvent(eventId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.events }),
  });
}

// Private student passport
export function usePassportQuery() {
  return useQuery({
    queryKey: ['passport', 'me'],
    queryFn: async () => {
      const [profile, stats] = await Promise.all([getMyProfile(), getMyPassport()]);
      if (!profile) throw new Error('Your profile could not be loaded.');
      return { profile, stats };
    },
    staleTime: 60_000,
  });
}

// Restricted platform dashboards
export function useAdminAnalyticsQuery() {
  return useQuery({ queryKey: ['admin', 'analytics', 'overview'], queryFn: getAdminAnalytics, staleTime: 60_000, retry: false });
}

export function useAdminPerformanceMetricsQuery() {
  return useQuery({ queryKey: ['admin', 'performance', 'metrics'], queryFn: getAdminPerformanceMetrics, refetchInterval: 30_000, retry: false });
}
