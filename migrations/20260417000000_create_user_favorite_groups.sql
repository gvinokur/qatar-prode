CREATE TABLE user_favorite_groups (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id   UUID NOT NULL REFERENCES prode_groups(id) ON DELETE CASCADE,
  is_main    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, group_id)
);

-- Enforce at most one main group per user
CREATE UNIQUE INDEX user_favorite_groups_main_idx
  ON user_favorite_groups(user_id) WHERE is_main = TRUE;
