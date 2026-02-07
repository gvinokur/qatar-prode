-- Migration: Migrate data from individual rows to JSONB format
-- Story #90: Refactor to Atomic Batch Updates with JSONB
-- Date: 2026-02-06
--
-- This migration moves existing data from tournament_qualified_teams_predictions
-- to the new tournament_user_group_positions_predictions JSONB format.
-- Each (user_id, tournament_id, group_id) combination becomes a single row
-- with all team positions stored in a JSONB array.

-- Step 1: Insert data into new JSONB table by aggregating old rows
INSERT INTO tournament_user_group_positions_predictions (
  user_id,
  tournament_id,
  group_id,
  team_predicted_positions,
  created_at,
  updated_at
)
SELECT
  user_id,
  tournament_id,
  group_id,
  jsonb_agg(
    jsonb_build_object(
      'team_id', team_id,
      'predicted_position', predicted_position,
      'predicted_to_qualify', predicted_to_qualify
    )
    ORDER BY predicted_position
  ) as team_predicted_positions,
  MIN(created_at) as created_at,
  MAX(updated_at) as updated_at
FROM tournament_qualified_teams_predictions
GROUP BY user_id, tournament_id, group_id;

-- Step 2: Verify migration success
-- Count rows in old table vs new table (grouped by user/tournament/group)
DO $$
DECLARE
  old_group_count INT;
  new_group_count INT;
BEGIN
  -- Count unique (user_id, tournament_id, group_id) combinations in old table
  SELECT COUNT(DISTINCT (user_id, tournament_id, group_id))
  INTO old_group_count
  FROM tournament_qualified_teams_predictions;

  -- Count rows in new table (each row is one group)
  SELECT COUNT(*)
  INTO new_group_count
  FROM tournament_user_group_positions_predictions;

  -- Raise notice with counts
  RAISE NOTICE 'Old table unique groups: %, New table rows: %', old_group_count, new_group_count;

  -- Verify counts match
  IF old_group_count != new_group_count THEN
    RAISE EXCEPTION 'Migration verification failed: Row counts do not match (old: %, new: %)',
      old_group_count, new_group_count;
  END IF;

  RAISE NOTICE 'Migration verification successful: All % groups migrated', new_group_count;
END $$;

-- Add comments explaining migration
COMMENT ON COLUMN tournament_user_group_positions_predictions.team_predicted_positions IS
  'JSONB array migrated from tournament_qualified_teams_predictions. Each object contains {team_id, predicted_position, predicted_to_qualify}.';
