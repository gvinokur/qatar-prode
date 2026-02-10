-- Migration: Archive old group position prediction table
-- Story #91: Remove old group prediction table and migrate to new qualification system
-- Date: 2026-02-09
--
-- IMPORTANT: This migration archives the old tournament_group_team_stats_guess table
-- without dropping it, preserving historical data for 30 days as a safety net.
--
-- The table will be fully dropped on or after March 11, 2026 via a separate migration.
--
-- Background:
-- - Story #90 introduced a new qualification prediction system with explicit checkboxes
-- - Old system: Users predicted complete final standings (positions 1-4)
-- - New system: Users only predict which teams will qualify (checkbox-based)
-- - These are fundamentally different prediction models, so no data migration is needed
-- - Historical group_position_score is preserved in tournament_guesses for displaying
--   past tournament scores as read-only legacy data

-- Step 1: Add deprecation comment to the table
COMMENT ON TABLE tournament_group_team_stats_guess IS
  'DEPRECATED (2026-02-09): This table stored predicted group final standings (complete positions 1-4). ' ||
  'Replaced by tournament_qualified_teams_predictions which tracks qualification predictions (checkbox-based). ' ||
  'No data migration needed - different prediction models. ' ||
  'Historical scores preserved in tournament_guesses.group_position_score for legacy display. ' ||
  'This table will be dropped on or after 2026-03-11 (30-day retention period).';

-- Step 2: Verification check
DO $$
DECLARE
  table_exists BOOLEAN;
  table_comment TEXT;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'tournament_group_team_stats_guess'
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE EXCEPTION 'Table tournament_group_team_stats_guess does not exist';
  END IF;

  -- Get table comment
  SELECT obj_description('tournament_group_team_stats_guess'::regclass) INTO table_comment;

  IF table_comment IS NULL OR table_comment NOT LIKE '%DEPRECATED%' THEN
    RAISE WARNING 'Table comment may not have been set correctly';
  ELSE
    RAISE NOTICE 'Migration successful: Table archived with deprecation comment';
    RAISE NOTICE 'Table will be dropped on or after 2026-03-11';
  END IF;
END $$;
