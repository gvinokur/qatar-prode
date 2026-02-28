-- Create prode_group_join_requests table for join request/approval workflow
CREATE TABLE prode_group_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES prode_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  request_source VARCHAR(50) NOT NULL CHECK (request_source IN ('discovery', 'invite_link', 'email_invite')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by_user_id UUID REFERENCES users(id)
);

-- Partial unique index: only one pending request per user per group
-- Allows historical records (approved/rejected) while preventing duplicate pending requests
CREATE UNIQUE INDEX unique_pending_request ON prode_group_join_requests(group_id, user_id) WHERE status = 'pending';

-- Index for admin view: find pending requests for a group
CREATE INDEX idx_join_requests_group_status ON prode_group_join_requests(group_id, status);

-- Index for user view: find user's pending/resolved requests
CREATE INDEX idx_join_requests_user_status ON prode_group_join_requests(user_id, status);

-- Index for queries ordered by request date
CREATE INDEX idx_join_requests_status_created ON prode_group_join_requests(status, requested_at DESC);
