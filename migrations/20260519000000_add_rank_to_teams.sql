-- Story #449: Team strength rankings
-- Lower rank = stronger (FIFA World Rankings convention)
-- Nullable: non-FIFA-2026 teams (Copa América, Euro, etc.) have no rank
-- CHECK constraint enforces valid FIFA ranking bounds (1–999)
ALTER TABLE teams ADD COLUMN rank INTEGER CHECK (rank IS NULL OR (rank > 0 AND rank < 1000));
