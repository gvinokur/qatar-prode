-- Add third place qualification configuration columns to tournaments table

ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS allows_third_place_qualification BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS max_third_place_qualifiers INTEGER DEFAULT 4;

-- Add comments for documentation
COMMENT ON COLUMN tournaments.allows_third_place_qualification IS 'Whether this tournament allows third-place teams to qualify';
COMMENT ON COLUMN tournaments.max_third_place_qualifiers IS 'Maximum number of third-place teams that can qualify (typically 4)';
