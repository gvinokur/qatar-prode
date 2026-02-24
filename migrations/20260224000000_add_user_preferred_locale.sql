-- Add preferred_locale column to users table
-- This allows users to persist their language preference

ALTER TABLE users
ADD COLUMN preferred_locale VARCHAR(2) DEFAULT NULL;

-- Column details:
-- - VARCHAR(2) to store ISO language codes ('en', 'es')
-- - DEFAULT NULL: preference not set by default
-- - Nullable: users who haven't set preference will have NULL
