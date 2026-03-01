-- Migration: Add public/private visibility and description to friend groups
-- Story #224: Public Groups with Discovery

ALTER TABLE prode_groups
  ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN description TEXT,
  ADD CONSTRAINT chk_description_length CHECK (char_length(description) <= 500);

-- Partial index for efficient public group queries
CREATE INDEX idx_prode_groups_is_public
  ON prode_groups(is_public)
  WHERE is_public = true;

-- Index for efficient case-insensitive name search on public groups
CREATE INDEX idx_prode_groups_name_public
  ON prode_groups(LOWER(name))
  WHERE is_public = true;
