-- Migration: Cleanup old predictions table after JSONB migration
-- Story #90: Refactor to Atomic Batch Updates with JSONB
-- Date: 2026-02-06
--
-- IMPORTANT: Only run this migration after:
-- 1. Running 20260206000001_migrate_to_jsonb_positions.sql successfully
-- 2. Verifying all data migrated correctly
-- 3. Testing the application with the new JSONB structure
-- 4. Deploying code that uses updateGroupPositionsJsonb instead of updateQualificationPredictions
--
-- This migration removes the old table and its indexes after successful migration to JSONB format.

-- Step 1: Drop old indexes
DROP INDEX IF EXISTS idx_qualified_predictions_user_tournament;
DROP INDEX IF EXISTS idx_qualified_predictions_tournament_group;

-- Step 2: Drop old table
DROP TABLE IF EXISTS tournament_qualified_teams_predictions;

-- Step 3: Add comments documenting the migration
COMMENT ON TABLE tournament_user_group_positions_predictions IS
  'JSONB-based qualified teams predictions. Replaces tournament_qualified_teams_predictions table. Each row contains all team position predictions for a user/tournament/group combination in a JSONB array, enabling atomic batch updates.';

-- Step 4: Verification check
DO $$
DECLARE
  old_table_exists BOOLEAN;
BEGIN
  -- Check if old table still exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'tournament_qualified_teams_predictions'
  ) INTO old_table_exists;

  IF old_table_exists THEN
    RAISE WARNING 'Old table still exists after cleanup attempt';
  ELSE
    RAISE NOTICE 'Cleanup successful: Old table removed';
  END IF;
END $$;
