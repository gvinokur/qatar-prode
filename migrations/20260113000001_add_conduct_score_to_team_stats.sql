-- Migration: Add conduct_score field to team statistics tables
-- Date: 2026-01-13
-- Purpose: Support FIFA 2026 World Cup conduct score tiebreaker
-- Tiebreaker order: Points → Goal Diff → Goals For → Conduct Score (lower is better) → FIFA Ranking

-- Add conduct_score field to tournament_group_teams (actual team stats)
ALTER TABLE tournament_group_teams
ADD COLUMN conduct_score INTEGER DEFAULT 0 NOT NULL;

-- Add conduct_score field to tournament_group_team_stats_guess (predicted stats)
ALTER TABLE tournament_group_team_stats_guess
ADD COLUMN conduct_score INTEGER DEFAULT 0 NOT NULL;

-- Add index for sorting/filtering by conduct score
CREATE INDEX tournament_group_teams_conduct_score_idx
    ON tournament_group_teams (conduct_score);

-- Add comments for documentation
COMMENT ON COLUMN tournament_group_teams.conduct_score IS 'Team fair play/conduct score based on disciplinary points. Calculation: +1 per yellow card, +3 per indirect red card (second yellow), +3 per yellow+red in same match, +4 per direct red card. Lower score is better. Used as tiebreaker after points, goal difference, and goals scored.';

COMMENT ON COLUMN tournament_group_team_stats_guess.conduct_score IS 'Predicted/guessed team conduct score for prediction purposes. Same calculation as tournament_group_teams.conduct_score.';
