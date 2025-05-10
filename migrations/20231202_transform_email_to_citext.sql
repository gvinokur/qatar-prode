-- First, ensure the citext extension is available
CREATE EXTENSION IF NOT EXISTS citext;

-- Transform the email column from TEXT/VARCHAR to CITEXT
ALTER TABLE users ALTER COLUMN email TYPE citext;

-- Add a comment explaining the change
COMMENT ON COLUMN users.email IS 'User email address (case-insensitive)';
