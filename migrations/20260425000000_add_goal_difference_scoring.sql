-- Add goal difference scoring config to tournaments
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS game_correct_goal_difference_points INTEGER DEFAULT 2;

-- Recalibrate exact score default from 2 → 3 (to create clear tier separation: 1/2/3)
ALTER TABLE tournaments
ALTER COLUMN game_exact_score_points SET DEFAULT 3;

-- Update existing active tournaments to use the new exact score default of 3.
-- Only updates tournaments still at the old default of 2 (custom values are preserved).
UPDATE tournaments
SET game_exact_score_points = 3
WHERE game_exact_score_points = 2 OR game_exact_score_points IS NULL;

-- Add prediction tier to game_guesses (nullable for backward compat)
ALTER TABLE game_guesses
ADD COLUMN IF NOT EXISTS prediction_tier VARCHAR(20);

-- Add goal difference accuracy counts to tournament_guesses
ALTER TABLE tournament_guesses
ADD COLUMN IF NOT EXISTS total_goal_difference_guesses INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS group_goal_difference_guesses INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS playoff_goal_difference_guesses INTEGER NOT NULL DEFAULT 0;

-- Backfill prediction_tier for existing rows based on current score values.
-- Pre-migration: score=0 → missed, score=1 → correct, score≥2 → exact (no GD rows existed).
UPDATE game_guesses SET prediction_tier =
  CASE
    WHEN score IS NULL THEN NULL
    WHEN score = 0 THEN 'missed'
    WHEN score = 1 THEN 'correct'
    ELSE 'exact'
  END
WHERE prediction_tier IS NULL;

-- Bump score for existing exact-match guesses from 2 → 3 to reflect the new default.
-- These rows had score=2 (old exact default); they should now be worth 3pts.
UPDATE game_guesses
SET score = 3,
    final_score = ROUND(3 * COALESCE(boost_multiplier, 1))
WHERE prediction_tier = 'exact'
  AND score = 2;

-- tournament_guesses totals are rematerialized via application code post-migration
-- (same path as normal score recalculation via recalculateGameScoresForUsers).
