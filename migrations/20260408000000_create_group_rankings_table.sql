CREATE TABLE group_rankings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id      UUID NOT NULL REFERENCES prode_groups(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  snapshot_date INTEGER NOT NULL,
  rank          INTEGER NOT NULL,
  score         INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT group_rankings_unique UNIQUE (user_id, group_id, tournament_id, snapshot_date)
);

CREATE INDEX idx_group_rankings_group_tournament
  ON group_rankings(group_id, tournament_id);

CREATE INDEX idx_group_rankings_group_tournament_date
  ON group_rankings(group_id, tournament_id, snapshot_date);
