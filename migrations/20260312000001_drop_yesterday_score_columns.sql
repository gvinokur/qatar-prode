-- Story #278: Remove yesterday-score columns from tournament_guesses.
-- These columns were superseded by tournament_score_history snapshots (Story #272/#277).
-- All write paths were removed in Story #283 before this migration was applied.

ALTER TABLE tournament_guesses DROP COLUMN IF EXISTS yesterday_tournament_score;
ALTER TABLE tournament_guesses DROP COLUMN IF EXISTS yesterday_total_game_score;
ALTER TABLE tournament_guesses DROP COLUMN IF EXISTS yesterday_boost_bonus;
ALTER TABLE tournament_guesses DROP COLUMN IF EXISTS last_score_update_date;
