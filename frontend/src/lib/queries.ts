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
  getMyProfile 
} from './api';
import { Post, College, Community, StudentProfile } from '@/types';

// Query Keys
export const queryKeys = {
  posts: (scope: string, tag?: string) => ['posts', scope, tag ?? 'all'] as const,
  infinitePosts: (scope: string, tag?: string) => ['posts', 'infinite', scope, tag ?? 'all'] as const,
  colleges: ['colleges'] as const,
  communities: (collegeId?: string) => ['communities', collegeId ?? 'all'] as const,
  students: (skill?: string) => ['students', skill ?? 'all'] as const,
  profile: ['profile', 'me'] as const,
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
