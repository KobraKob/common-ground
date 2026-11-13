CREATE TABLE IF NOT EXISTS mentorship_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    is_available BOOLEAN NOT NULL DEFAULT FALSE,
    topics TEXT NOT NULL DEFAULT '[]',
    bio TEXT NOT NULL DEFAULT '',
    availability_note VARCHAR(160) NOT NULL DEFAULT '',
    format VARCHAR(20) NOT NULL DEFAULT 'ONLINE',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_mentorship_profile_format CHECK (format IN ('ONLINE', 'IN_PERSON', 'BOTH'))
);

CREATE INDEX IF NOT EXISTS ix_mentorship_profiles_available
  ON mentorship_profiles (is_available, updated_at DESC);

CREATE TABLE IF NOT EXISTS mentorship_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_mentorship_request_pair UNIQUE (requester_id, mentor_id),
    CONSTRAINT ck_mentorship_request_status CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED')),
    CONSTRAINT ck_mentorship_request_distinct_users CHECK (requester_id <> mentor_id)
);

CREATE INDEX IF NOT EXISTS ix_mentorship_requests_mentor_status
  ON mentorship_requests (mentor_id, status);
CREATE INDEX IF NOT EXISTS ix_mentorship_requests_requester_status
  ON mentorship_requests (requester_id, status);
