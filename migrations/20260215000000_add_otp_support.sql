-- Migration: Add OTP (One-Time Password) support for passwordless email authentication
-- Story: #137 Passwordless Email OTP Login
-- Date: 2026-02-15

-- Step 1: Add otp_code field for 6-digit verification code
ALTER TABLE users
ADD COLUMN otp_code VARCHAR(6) NULL;

COMMENT ON COLUMN users.otp_code IS
  '6-digit OTP code for passwordless email authentication. Valid for 3 minutes with max 3 attempts. NULL when no active OTP.';

-- Step 2: Add otp_expiration field for 3-minute expiration
ALTER TABLE users
ADD COLUMN otp_expiration TIMESTAMP WITH TIME ZONE NULL;

COMMENT ON COLUMN users.otp_expiration IS
  'Expiration timestamp for OTP code (3 minutes from generation). NULL when no active OTP.';

-- Step 3: Add otp_attempts field for brute-force protection
ALTER TABLE users
ADD COLUMN otp_attempts INTEGER DEFAULT 0;

COMMENT ON COLUMN users.otp_attempts IS
  'Number of failed OTP verification attempts. Max 3 attempts before OTP is cleared. Resets to 0 on successful verification.';

-- Step 4: Add otp_last_request field for rate limiting
ALTER TABLE users
ADD COLUMN otp_last_request TIMESTAMP WITH TIME ZONE NULL;

COMMENT ON COLUMN users.otp_last_request IS
  'Timestamp of last OTP request. Used for rate limiting (1 request per minute per email). NULL when no recent request.';

-- Step 5: Create partial index on otp_code for fast OTP verification lookups
-- Partial index only includes rows where otp_code is not null (active OTPs)
CREATE INDEX idx_users_otp_code ON users (otp_code) WHERE otp_code IS NOT NULL;
