-- Add is_admin column to prode_group_participants
ALTER TABLE prode_group_participants ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE; 