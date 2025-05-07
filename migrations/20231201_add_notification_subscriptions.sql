-- Add notification_subscriptions column to users table
ALTER TABLE users ADD COLUMN notification_subscriptions JSONB DEFAULT NULL;

-- Add an index to improve query performance when filtering by subscriptions
CREATE INDEX idx_users_notification_subscriptions ON users USING GIN (notification_subscriptions);

-- Comment on the column to document its purpose
COMMENT ON COLUMN users.notification_subscriptions IS 'Stores push notification subscription data for the user across multiple devices';
