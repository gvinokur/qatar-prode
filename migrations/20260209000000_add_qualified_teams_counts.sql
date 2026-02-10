-- Add qualified teams correct and exact counts to tournament_guesses
-- These track the number of teams predicted correctly, separate from the points scored

ALTER TABLE tournament_guesses
ADD COLUMN IF NOT EXISTS qualified_teams_correct INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS qualified_teams_exact INTEGER DEFAULT 0;

-- Add helpful comments
COMMENT ON COLUMN tournament_guesses.qualified_teams_correct IS 'Count of teams correctly predicted to qualify (regardless of position)';
COMMENT ON COLUMN tournament_guesses.qualified_teams_exact IS 'Count of teams correctly predicted to qualify with exact position match';
