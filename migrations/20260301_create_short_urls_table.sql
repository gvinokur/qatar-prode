-- Migration: Create short_urls table for URL shortening feature
-- Story #235: Shortened Invitation URLs

CREATE TABLE short_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) NOT NULL,
  group_id UUID NOT NULL REFERENCES prode_groups(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  click_count INTEGER NOT NULL DEFAULT 0
);

-- Indexes for performance
CREATE UNIQUE INDEX idx_short_urls_code ON short_urls(code);
CREATE UNIQUE INDEX idx_short_urls_group ON short_urls(group_id);  -- One short URL per group
CREATE INDEX idx_short_urls_tournament ON short_urls(tournament_id);  -- For analytics queries

-- Comments for documentation
COMMENT ON TABLE short_urls IS 'Shortened URLs for friend group invitations';
COMMENT ON COLUMN short_urls.code IS 'Unique 6-character alphanumeric code for the short URL';
COMMENT ON COLUMN short_urls.group_id IS 'Friend group this short URL points to (one per group)';
COMMENT ON COLUMN short_urls.tournament_id IS 'Tournament context when URL was created (nullable, preserved for analytics)';
COMMENT ON COLUMN short_urls.click_count IS 'Number of times this short URL has been accessed';
