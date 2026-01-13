-- Migration: Add tournament_third_place_rules table
-- Date: 2026-01-13
-- Purpose: Store third-place assignment rules for tournaments with group stages
-- Related to: 2026 FIFA World Cup support (12 groups, 8 third-place qualifiers, 495 combinations)

-- Create the tournament_third_place_rules table
CREATE TABLE IF NOT EXISTS tournament_third_place_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    combination_key VARCHAR(50) NOT NULL,
    rules JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Unique constraint: one set of rules per combination per tournament
CREATE UNIQUE INDEX tournament_third_place_rules_tournament_combination_idx
    ON tournament_third_place_rules (tournament_id, combination_key);

-- Index for faster tournament lookups
CREATE INDEX tournament_third_place_rules_tournament_id_idx
    ON tournament_third_place_rules (tournament_id);

-- Add comments for documentation
COMMENT ON TABLE tournament_third_place_rules IS 'Stores third-place qualifier assignment rules for tournaments with group stages. Each combination represents a unique set of groups whose third-place teams qualify (e.g., "ABCDEFGH" for 8 qualifiers from groups A-H).';

COMMENT ON COLUMN tournament_third_place_rules.id IS 'Primary key';

COMMENT ON COLUMN tournament_third_place_rules.tournament_id IS 'Foreign key to tournaments table';

COMMENT ON COLUMN tournament_third_place_rules.combination_key IS 'Sorted group letters of qualified third-place teams (e.g., "ABCDEFGH"). Must be uppercase letters only.';

COMMENT ON COLUMN tournament_third_place_rules.rules IS 'JSONB mapping of bracket positions to group letters. Format: {"Position1": "A", "Position2": "B", ...}. Each position indicates which group''s third-place team plays in that playoff bracket slot.';

COMMENT ON COLUMN tournament_third_place_rules.created_at IS 'Timestamp when rule was created';

COMMENT ON COLUMN tournament_third_place_rules.updated_at IS 'Timestamp when rule was last updated';
