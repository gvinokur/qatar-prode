-- Add display_name column to tournaments table
ALTER TABLE tournaments ADD COLUMN display_name BOOLEAN NOT NULL DEFAULT FALSE;
