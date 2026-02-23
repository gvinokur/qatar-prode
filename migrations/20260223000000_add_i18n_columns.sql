-- Add internationalization JSONB columns to tables
-- Story #157: i18n Support
-- Date: 2026-02-23
--
-- This migration adds JSONB columns to store translated content for various tournament entities.
-- Each column stores translations as a JSON object: { "en": "English text", "es": "Spanish text", ... }

-- Add i18n columns to tournaments table
ALTER TABLE tournaments
  ADD COLUMN long_name_i18n JSONB,
  ADD COLUMN short_name_i18n JSONB;

COMMENT ON COLUMN tournaments.long_name_i18n IS 'Internationalized long tournament name: { "en": "...", "es": "...", ... }';
COMMENT ON COLUMN tournaments.short_name_i18n IS 'Internationalized short tournament name: { "en": "...", "es": "...", ... }';

-- Add i18n columns to teams table
ALTER TABLE teams
  ADD COLUMN name_i18n JSONB;

COMMENT ON COLUMN teams.name_i18n IS 'Internationalized team name: { "en": "...", "es": "...", ... }';

-- Add i18n columns to tournament_playoff_rounds table
ALTER TABLE tournament_playoff_rounds
  ADD COLUMN round_name_i18n JSONB;

COMMENT ON COLUMN tournament_playoff_rounds.round_name_i18n IS 'Internationalized playoff round name: { "en": "...", "es": "...", ... }';

-- Add i18n columns to games table
ALTER TABLE games
  ADD COLUMN location_i18n JSONB;

COMMENT ON COLUMN games.location_i18n IS 'Internationalized game location: { "en": "...", "es": "...", ... }';
