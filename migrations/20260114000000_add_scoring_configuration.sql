-- Add scoring configuration fields to tournaments table
ALTER TABLE tournaments
  ADD COLUMN game_exact_score_points INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN game_correct_outcome_points INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN champion_points INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN runner_up_points INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN third_place_points INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN individual_award_points INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN qualified_team_points INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN exact_position_qualified_points INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN max_silver_games INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN max_golden_games INTEGER NOT NULL DEFAULT 0;

-- Add boost fields to game_guesses table
ALTER TABLE game_guesses
  ADD COLUMN boost_type VARCHAR(10) CHECK (boost_type IN ('silver', 'golden')),
  ADD COLUMN boost_multiplier NUMERIC DEFAULT 1.0,
  ADD COLUMN final_score INTEGER;

-- Backfill game_guesses with default values
UPDATE game_guesses SET
  boost_multiplier = 1.0,
  final_score = COALESCE(score, 0)
WHERE boost_multiplier IS NULL;
