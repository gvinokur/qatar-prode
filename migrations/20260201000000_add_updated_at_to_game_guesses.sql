-- Add updated_at timestamp for optimistic locking on game_guesses
ALTER TABLE game_guesses
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing records with current timestamp
UPDATE game_guesses
SET updated_at = CURRENT_TIMESTAMP
WHERE updated_at IS NULL;
