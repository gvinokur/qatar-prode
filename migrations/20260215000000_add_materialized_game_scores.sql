-- Migration: Add materialized game score columns to tournament_guesses
-- Story #147: Materialize Score Calculations
-- Date: 2026-02-15

-- Add materialized score columns
ALTER TABLE tournament_guesses
  -- Game score totals (sum of game_guesses.score)
  ADD COLUMN total_game_score INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN group_stage_game_score INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN playoff_stage_game_score INTEGER DEFAULT 0 NOT NULL,

  -- Boost bonuses (sum of final_score - score)
  ADD COLUMN total_boost_bonus INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN group_stage_boost_bonus INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN playoff_stage_boost_bonus INTEGER DEFAULT 0 NOT NULL,

  -- Prediction accuracy counts (for stats page)
  ADD COLUMN total_correct_guesses INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN total_exact_guesses INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN group_correct_guesses INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN group_exact_guesses INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN playoff_correct_guesses INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN playoff_exact_guesses INTEGER DEFAULT 0 NOT NULL,

  -- Yesterday snapshots for rank tracking (24-hour window)
  ADD COLUMN yesterday_total_game_score INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN yesterday_boost_bonus INTEGER DEFAULT 0 NOT NULL,

  -- Timestamp of last game score update (date of last game used in calculation)
  ADD COLUMN last_game_score_update_at TIMESTAMP WITH TIME ZONE;

-- Add computed column for total points
ALTER TABLE tournament_guesses
  ADD COLUMN total_points INTEGER GENERATED ALWAYS AS (
    COALESCE(total_game_score, 0) +
    COALESCE(total_boost_bonus, 0) +
    COALESCE(qualified_teams_score, 0) +
    COALESCE(honor_roll_score, 0) +
    COALESCE(individual_awards_score, 0) +
    COALESCE(group_position_score, 0)
  ) STORED;
