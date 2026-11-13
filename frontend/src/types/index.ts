export type PlatformRole = 'USER' | 'MODERATOR' | 'ADMIN';

export type VerificationStage = 
  | 'STAGE_1_PROVISIONAL'
  | 'STAGE_2_COMMUNITY_VALIDATED'
  | 'STAGE_3_INSTITUTIONAL_VERIFIED'
  | 'STAGE_4_OFFICIAL_PARTNER';

export type ProfileVisibility = 'PUBLIC' | 'CAMPUS_ONLY' | 'SHARED_COMMUNITIES_ONLY';

export type DMPermission = 'EVERYONE' | 'SAME_CAMPUS_OR_COMMUNITY' | 'NONE';

export type CommunityType = 
  | 'CAMPUS_HUB'
  | 'DEPARTMENT'
  | 'CLASS_COHORT'
  | 'CLUB'
  | 'CROSS_CAMPUS_INTEREST'
  | 'PROJECT_GROUP';

export type CommunityVisibility = 'PUBLIC' | 'CAMPUS_RESTRICTED' | 'PRIVATE_INVITE_ONLY';

export type MemberRole = 'MEMBER' | 'MODERATOR' | 'OWNER';

export type PostCategory = 
  | 'DISCUSSION'
  | 'QUESTION_QA'
  | 'ANNOUNCEMENT'
  | 'HANGOUT_MEME'
  | 'OPPORTUNITY';

export type ConversationType = 'DIRECT' | 'GROUP_CHAT' | 'ANNOUNCEMENT_CHANNEL';

export type ProjectStage = 'IDEA' | 'RECRUITING' | 'PROTOTYPING' | 'LIVE' | 'COMPLETED';

export type ReportTargetType = 
  | 'USER'
  | 'POST'
  | 'COMMENT'
  | 'MESSAGE'
  | 'COMMUNITY'
  | 'EVENT'
  | 'PROJECT'
  | 'RESOURCE';

export type ReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED_ACTION_TAKEN' | 'DISMISSED';

export interface College {
  id: string;
  name: string;
  slug: string;
  short_name: string;
  city: string;
  state: string;
  email_domains: string[];
  is_official_partner: boolean;
  is_active_cluster: boolean;
  member_count?: number;
  community_count?: number;
  created_at: string;
}

export interface StudentProfile {
  user_id: string;
  handle: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  college_id?: string;
  college_name?: string;
  verification_stage: VerificationStage;
  course_branch?: string;
  graduation_year?: number;
  skills: string[];
  interests: string[];
  collaboration_goals: string[];
  profile_visibility: ProfileVisibility;
  show_course_year: boolean;
  dm_permission: DMPermission;
  onboarding_completed: boolean;
  created_at: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  community_type: CommunityType;
  visibility: CommunityVisibility;
  college_id?: string;
  is_official_endorsed: boolean;
  invite_code?: string;
  member_count: number;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_handle: string;
  author_avatar?: string;
  author_verification: VerificationStage;
  community_id?: string;
  community_name?: string;
  college_id?: string;
  college_name?: string;
  category: PostCategory;
  title?: string;
  body: string;
  tags: string[];
  media_url?: string;
  media_type?: 'IMAGE' | 'VIDEO' | 'NONE';
  is_cross_campus: boolean;
  is_pinned: boolean;
  accepted_answer_comment_id?: string;
  opportunity_meta?: {
    type: string;
    deadline?: string;
    verification_label: 'VERIFIED' | 'COMMUNITY_SUBMITTED' | 'UNVERIFIED';
    external_url?: string;
  };
  poll?: {
    id: string;
    question: string;
    options: { id: string; text: string; votes: number }[];
    expires_at?: string;
  };
  upvotes_count: number;
  comments_count: number;
  shares_count?: number;
  liked_by_me?: boolean;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user_id: string;
  email: string;
  profile: StudentProfile;
}

export interface SignUpPayload {
  email: string;
  password: string;
  handle: string;
  display_name: string;
  college_id?: string;
  course_branch?: string;
  graduation_year?: number;
  bio?: string;
  skills?: string[];
  interests?: string[];
}

export interface LoginPayload {
  login: string;
  password: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_handle: string;
  author_avatar?: string;
  parent_comment_id?: string;
  body: string;
  is_useful_answer: boolean;
  upvotes_count: number;
  created_at: string;
}

export interface ResourceItem {
  id: string;
  uploader_id: string;
  uploader_name: string;
  title: string;
  description?: string;
  file_url?: string;
  external_link?: string;
  subject_tags: string[];
  is_pinned: boolean;
  is_public_commons: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  conversation_type: ConversationType;
  community_id?: string;
  title?: string;
  description?: string;
  created_at: string;
  last_message_at: string;
  last_message?: string;
}

export interface MessageItem {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name?: string;
  sender_handle?: string;
  reply_to_message_id?: string;
  body: string;
  attachments: { name: string; url: string; mime_type?: string; size_bytes?: number }[];
  is_announcement: boolean;
  is_pinned: boolean;
  created_at: string;
}

export interface ProjectItem {
  id: string;
  creator_id: string;
  creator_name?: string;
  creator_college_name?: string;
  college_id?: string;
  title: string;
  pitch: string;
  description: string;
  stage: ProjectStage;
  skills_needed: string[];
  open_roles: string[];
  is_cross_campus_open: boolean;
  repo_or_demo_links: { label: string; url: string }[];
  members_count: number;
  created_at: string;
}

export interface TaskItem {
  id: string;
  project_id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assignee_id?: string;
  created_at: string;
}

export interface EventItem {
  id: string;
  organizer_id: string;
  organizer_name?: string;
  community_id?: string;
  college_id?: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  is_online: boolean;
  venue_or_link: string;
  is_cross_campus: boolean;
  safety_notes?: string;
  rsvp_count: number;
  created_at: string;
}

export interface ReportItem {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  created_at: string;
  resolved_at?: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}
