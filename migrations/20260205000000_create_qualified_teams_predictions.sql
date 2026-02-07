-- Migration: Create Qualified Teams Predictions Table
-- Story #90: Visual Qualification Prediction Interface
-- Date: 2026-02-05

-- Create new table for qualified teams predictions
CREATE TABLE tournament_qualified_teams_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES tournament_groups(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  -- Position and qualification prediction
  predicted_position INT NOT NULL CHECK (predicted_position >= 1),
  predicted_to_qualify BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Unique constraints: Each team can only have one position per user/tournament/group
  UNIQUE(user_id, tournament_id, group_id, team_id),
  -- Each position can only be assigned to one team per user/tournament/group
  UNIQUE(user_id, tournament_id, group_id, predicted_position)
);

-- Create indexes for performance
CREATE INDEX idx_qualified_predictions_user_tournament
  ON tournament_qualified_teams_predictions(user_id, tournament_id);

CREATE INDEX idx_qualified_predictions_tournament_group
  ON tournament_qualified_teams_predictions(tournament_id, group_id);

-- Add tournament configuration columns
ALTER TABLE tournaments
  ADD COLUMN allows_third_place_qualification BOOLEAN DEFAULT FALSE,
  ADD COLUMN max_third_place_qualifiers INT DEFAULT 0;

-- Add qualification score column to tournament_guesses
ALTER TABLE tournament_guesses
  ADD COLUMN qualification_score INT DEFAULT 0;

-- Add comment explaining the flexible position constraint
COMMENT ON COLUMN tournament_qualified_teams_predictions.predicted_position IS
  'Position >= 1 to support future tournaments with varying group sizes (4, 5, 6+ teams per group)';

COMMENT ON COLUMN tournament_qualified_teams_predictions.predicted_to_qualify IS
  'User prediction: will this team qualify? TRUE for positions 1-2 (always), and for position 3+ if user selects as third-place qualifier';

COMMENT ON COLUMN tournaments.allows_third_place_qualification IS
  'Enable third place qualification selection (e.g., FIFA 2026: 8 best 3rd place teams across 12 groups)';

COMMENT ON COLUMN tournaments.max_third_place_qualifiers IS
  'Maximum number of third place teams that can qualify (e.g., 8 for FIFA 2026)';
