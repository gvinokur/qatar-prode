-- Create tournament_view_permissions table for per-tournament user access control
CREATE TABLE tournament_view_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- Index for fast lookups when checking user permissions
CREATE INDEX idx_tournament_view_permissions_tournament_user
  ON tournament_view_permissions(tournament_id, user_id);

-- Index for querying all tournaments a user can access
CREATE INDEX idx_tournament_view_permissions_user
  ON tournament_view_permissions(user_id);

COMMENT ON TABLE tournament_view_permissions IS
  'Controls which users can view development tournaments in production';
