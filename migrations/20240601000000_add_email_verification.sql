-- Add email verification fields to users table
ALTER TABLE users
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_token TEXT,
ADD COLUMN verification_token_expiration TIMESTAMP WITH TIME ZONE;

-- Create index for faster verification token lookups
CREATE INDEX IF NOT EXISTS users_verification_token_idx ON users (verification_token);
