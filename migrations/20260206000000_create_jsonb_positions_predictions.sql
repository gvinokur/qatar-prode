-- Migration: Create JSONB-based Group Positions Predictions Table
-- Story #90: Refactor to Atomic Batch Updates with JSONB
-- Date: 2026-02-06
--
-- This migration creates a new table that stores all team position predictions
-- for a user/tournament/group combination in a single JSONB field, enabling
-- atomic batch updates and eliminating race conditions from multiple individual updates.

-- Create new table for group positions predictions with JSONB
CREATE TABLE tournament_user_group_positions_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES tournament_groups(id) ON DELETE CASCADE,

  -- JSONB field containing array of team position predictions
  -- Structure: [{team_id: uuid, predicted_position: number, predicted_to_qualify: boolean}, ...]
  team_predicted_positions JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Unique constraint: One row per user/tournament/group combination
  UNIQUE(user_id, tournament_id, group_id)
);

-- Create indexes for performance
CREATE INDEX idx_group_positions_user_tournament
  ON tournament_user_group_positions_predictions(user_id, tournament_id);

CREATE INDEX idx_group_positions_tournament_group
  ON tournament_user_group_positions_predictions(tournament_id, group_id);

-- Create GIN index for JSONB field to support efficient queries
CREATE INDEX idx_group_positions_jsonb
  ON tournament_user_group_positions_predictions USING GIN (team_predicted_positions);

-- Add comments explaining the JSONB structure and validation approach
COMMENT ON TABLE tournament_user_group_positions_predictions IS
  'Stores all team position predictions for a user/tournament/group in a single JSONB field. This enables atomic batch updates and eliminates race conditions from individual row updates.';

COMMENT ON COLUMN tournament_user_group_positions_predictions.team_predicted_positions IS
  'JSONB array of team position predictions: [{team_id: uuid, predicted_position: number, predicted_to_qualify: boolean}, ...]. Server-side validation ensures no duplicate teams, no duplicate positions, and third-place qualifier limits are enforced.';

COMMENT ON COLUMN tournament_user_group_positions_predictions.user_id IS
  'User who made these predictions';

COMMENT ON COLUMN tournament_user_group_positions_predictions.tournament_id IS
  'Tournament these predictions belong to';

COMMENT ON COLUMN tournament_user_group_positions_predictions.group_id IS
  'Group these predictions belong to';
