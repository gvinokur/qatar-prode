-- Migration: Add OAuth support with Google provider
-- Story: #136 Google OAuth Integration with Account Merging and Progressive Disclosure
-- Date: 2026-02-14

-- Step 1: Make password_hash nullable (for OAuth-only users)
ALTER TABLE users
ALTER COLUMN password_hash DROP NOT NULL;

COMMENT ON COLUMN users.password_hash IS
  'Hashed password for credentials auth. NULL for OAuth-only users. Use userHasPasswordAuth() to check.';

-- Step 2: Add auth_providers field to track authentication methods
ALTER TABLE users
ADD COLUMN auth_providers JSONB DEFAULT '["credentials"]'::jsonb;

COMMENT ON COLUMN users.auth_providers IS
  'Array of authentication providers enabled for this user. Values: "credentials", "google". Example: ["credentials", "google"] for users with both password and Google OAuth.';

-- Step 3: Add oauth_accounts field to store OAuth account mappings
ALTER TABLE users
ADD COLUMN oauth_accounts JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN users.oauth_accounts IS
  'Array of OAuth account objects. Structure: [{provider: "google", provider_user_id: "123", email: "user@gmail.com", connected_at: "2026-02-14T..."}]. Used for OAuth sign-in and account linking.';

-- Step 4: Add nickname_setup_required flag for OAuth signup flow
ALTER TABLE users
ADD COLUMN nickname_setup_required BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN users.nickname_setup_required IS
  'Indicates whether user needs to complete nickname setup after OAuth signup. Set to TRUE for new OAuth users without nickname, FALSE after nickname is set or for password users.';

-- Step 5: Create GIN index on oauth_accounts for fast OAuth lookups
CREATE INDEX idx_users_oauth_accounts ON users USING GIN (oauth_accounts);

-- Step 6: Backfill existing users with credentials auth provider
-- Only update users who have a password and don't already have auth_providers set
UPDATE users
SET auth_providers = '["credentials"]'::jsonb
WHERE password_hash IS NOT NULL
  AND (auth_providers IS NULL OR auth_providers = '[]'::jsonb);

-- Step 7: Set auth_providers to empty array for users without password (shouldn't exist, but defensive)
UPDATE users
SET auth_providers = '[]'::jsonb
WHERE password_hash IS NULL
  AND (auth_providers IS NULL OR auth_providers = '["credentials"]'::jsonb);
