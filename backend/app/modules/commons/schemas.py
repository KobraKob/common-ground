from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field


class PostCreateRequest(BaseModel):
    category: str = "DISCUSSION"  # DISCUSSION, QUESTION_QA, ANNOUNCEMENT, HANGOUT_MEME, OPPORTUNITY
    title: Optional[str] = None
    body: str = Field(..., min_length=1)
    tags: List[str] = []
    media_url: Optional[str] = None
    media_type: Optional[str] = None  # IMAGE, VIDEO, NONE
    community_id: Optional[str] = None
    college_id: Optional[str] = None
    is_cross_campus: bool = False
    is_pinned: bool = False
    opportunity_meta: Optional[dict] = None  # { type, deadline, verification_label, external_url }
    poll_question: Optional[str] = None
    poll_options: Optional[List[str]] = None


class CommentCreateRequest(BaseModel):
    body: str = Field(..., min_length=1)
    parent_comment_id: Optional[str] = None


class PollVoteRequest(BaseModel):
    option_id: str


class ReactionRequest(BaseModel):
    reaction_type: str = "UPVOTE"


class CommentResponse(BaseModel):
    id: str
    post_id: str
    author_id: str
    author_name: str
    author_handle: str
    author_avatar: Optional[str] = None
    parent_comment_id: Optional[str] = None
    body: str
    is_useful_answer: bool
    upvotes_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class PostResponse(BaseModel):
    id: str
    author_id: str
    author_name: str
    author_handle: str
    author_avatar: Optional[str] = None
    author_verification: str
    community_id: Optional[str] = None
    community_name: Optional[str] = None
    college_id: Optional[str] = None
    college_name: Optional[str] = None
    category: str
    title: Optional[str] = None
    body: str
    tags: List[str] = []
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    is_cross_campus: bool
    is_pinned: bool
    accepted_answer_comment_id: Optional[str] = None
    opportunity_meta: Optional[dict] = None
    poll: Optional[dict] = None
    upvotes_count: int
    comments_count: int
    shares_count: int = 0
    liked_by_me: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class ResourceCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    file_url: Optional[str] = None
    external_link: Optional[str] = None
    subject_tags: List[str] = []
    community_id: Optional[str] = None
    college_id: Optional[str] = None
    is_public_commons: bool = True
    is_pinned: bool = False


class ResourceResponse(BaseModel):
    id: str
    uploader_id: str
    uploader_name: str
    title: str
    description: Optional[str] = None
    file_url: Optional[str] = None
    external_link: Optional[str] = None
    subject_tags: List[str] = []
    is_pinned: bool
    is_public_commons: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UnifiedSearchResponse(BaseModel):
    students: List[dict] = []
    communities: List[dict] = []
    commons_posts: List[dict] = []
    resources: List[dict] = []
    messages: List[dict] = []
