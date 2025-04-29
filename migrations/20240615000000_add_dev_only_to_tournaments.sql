-- Add dev_only field to tournaments table
ALTER TABLE tournaments
ADD COLUMN dev_only BOOLEAN DEFAULT FALSE;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS tournaments_dev_only_idx ON tournaments (dev_only);
