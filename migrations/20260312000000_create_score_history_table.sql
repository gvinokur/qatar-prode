CREATE TABLE tournament_score_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  tournament_id   UUID NOT NULL,
  snapshot_date   INTEGER NOT NULL,  -- YYYYMMDD (Argentina TZ, matches existing convention)
  total_game_score         INTEGER NOT NULL DEFAULT 0,
  total_boost_bonus        INTEGER NOT NULL DEFAULT 0,
  honor_roll_score         INTEGER NOT NULL DEFAULT 0,
  individual_awards_score  INTEGER NOT NULL DEFAULT 0,
  qualified_teams_score    INTEGER NOT NULL DEFAULT 0,
  group_position_score     INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER GENERATED ALWAYS AS (
    total_game_score + total_boost_bonus + honor_roll_score +
    individual_awards_score + qualified_teams_score + group_position_score
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT tournament_score_history_unique
    UNIQUE (user_id, tournament_id, snapshot_date),
  CONSTRAINT fk_score_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_score_history_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE INDEX idx_score_history_tournament_users
  ON tournament_score_history (tournament_id, user_id, snapshot_date ASC);
