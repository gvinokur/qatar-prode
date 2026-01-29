-- Add onboarding fields to users table
-- Story #11: Progressive Onboarding Flow

ALTER TABLE users
  ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN onboarding_completed_at TIMESTAMP,
  ADD COLUMN onboarding_data JSONB;

-- Create index for querying users by onboarding status
CREATE INDEX idx_users_onboarding_completed ON users(onboarding_completed);

-- Add comments for documentation
COMMENT ON COLUMN users.onboarding_completed IS 'Whether user has completed the onboarding flow';
COMMENT ON COLUMN users.onboarding_completed_at IS 'Timestamp when onboarding was completed';
COMMENT ON COLUMN users.onboarding_data IS 'JSON object storing onboarding state: { currentStep: number, skippedSteps: number[], dismissedTooltips: string[], checklist: { items: [{id, completed, completedAt}] } }';
