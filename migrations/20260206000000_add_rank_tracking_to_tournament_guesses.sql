-- Migration: Add rank tracking columns to tournament_guesses
-- Story: UXI-016 Rank Change Animations
-- Date: 2026-02-06

-- Add column to track when tournament scores were last updated (YYYYMMDD format)
ALTER TABLE tournament_guesses
ADD COLUMN last_score_update_date INTEGER;

COMMENT ON COLUMN tournament_guesses.last_score_update_date IS
  'Date when tournament scores last changed, stored as YYYYMMDD integer (e.g., 20260206). Used for daily rank change tracking.';

-- Add column to store snapshot of previous day's tournament score
ALTER TABLE tournament_guesses
ADD COLUMN yesterday_tournament_score INTEGER;

COMMENT ON COLUMN tournament_guesses.yesterday_tournament_score IS
  'Snapshot of previous day''s total tournament score (sum of qualified_teams_score, honor_roll_score, individual_awards_score, group_position_score). Updated on first score change each day. Used to calculate day-over-day rank changes.';
