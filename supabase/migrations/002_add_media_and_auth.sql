-- CommonGround 002_add_media_and_auth.sql
-- Add media attachments, shares tracking, and auth credential support

ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_type VARCHAR(32);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS shares_count INT DEFAULT 0;

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Index on post media & author lookup
CREATE INDEX IF NOT EXISTS idx_posts_media ON posts(media_type) WHERE media_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
