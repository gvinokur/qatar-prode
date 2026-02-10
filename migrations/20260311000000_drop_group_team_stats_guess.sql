-- Migration: Drop archived group position prediction table
-- Story #91: Remove old group prediction table and migrate to new qualification system
-- Date: 2026-03-11 (scheduled - do not run before this date)
--
-- IMPORTANT: Only run this migration on or after March 11, 2026
-- This is 30 days after the table was archived (2026-02-09)
--
-- Prerequisites:
-- 1. Migration 20260209000000_archive_group_team_stats_guess.sql has been run
-- 2. At least 30 days have passed since archival (safety retention period)
-- 3. All code references to the table have been removed
-- 4. Application is deployed and stable with the new qualification system
--
-- This migration permanently drops the old tournament_group_team_stats_guess table.

-- Step 1: Final safety check - verify table is marked as deprecated
DO $$
DECLARE
  table_comment TEXT;
  deprecated BOOLEAN;
BEGIN
  -- Get table comment
  SELECT obj_description('tournament_group_team_stats_guess'::regclass) INTO table_comment;

  deprecated := (table_comment IS NOT NULL AND table_comment LIKE '%DEPRECATED%');

  IF NOT deprecated THEN
    RAISE EXCEPTION 'Safety check failed: Table is not marked as DEPRECATED. ' ||
                    'Ensure migration 20260209000000_archive_group_team_stats_guess.sql ran successfully.';
  END IF;

  RAISE NOTICE 'Safety check passed: Table is marked as DEPRECATED';
END $$;

-- Step 2: Drop dependent indexes
DROP INDEX IF EXISTS idx_tournament_group_team_guess_user;
DROP INDEX IF EXISTS idx_tournament_group_team_guess_group;

-- Step 3: Drop the table
DROP TABLE IF EXISTS tournament_group_team_stats_guess;

-- Step 4: Verification check
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- Check if table still exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'tournament_group_team_stats_guess'
  ) INTO table_exists;

  IF table_exists THEN
    RAISE WARNING 'Table still exists after drop attempt';
  ELSE
    RAISE NOTICE 'Migration successful: tournament_group_team_stats_guess table dropped';
    RAISE NOTICE 'Historical group position scores are preserved in tournament_guesses.group_position_score';
  END IF;
END $$;
