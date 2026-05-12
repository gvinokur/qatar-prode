-- Story #443: Configurable group tiebreaker rules per tournament
-- Adds tournament-level tiebreaker mode, replacing the per-group toggle.
-- Default 'standard' preserves existing tournament behavior on migration.
-- New tournaments will be created with 'head_to_head' via the UI default.

ALTER TABLE tournaments
  ADD COLUMN tiebreaker_mode TEXT NOT NULL DEFAULT 'standard';
