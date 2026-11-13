CREATE TABLE IF NOT EXISTS event_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    marked_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    marked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_event_attendance UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS ix_event_attendance_user_marked
  ON event_attendance (user_id, marked_at DESC);
