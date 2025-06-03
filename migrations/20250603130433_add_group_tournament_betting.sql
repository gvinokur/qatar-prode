-- Enable pgcrypto for gen_random_uuid if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create table for group/tournament betting configuration
CREATE TABLE prode_group_tournament_betting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES prode_groups(id) ON DELETE CASCADE,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    betting_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    betting_amount DECIMAL(10,2),
    betting_payout_description TEXT,
    UNIQUE (group_id, tournament_id)
);

-- Create table for tracking payments per user per group/tournament
CREATE TABLE prode_group_tournament_betting_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_tournament_betting_id UUID NOT NULL REFERENCES prode_group_tournament_betting(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    has_paid BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (group_tournament_betting_id, user_id)
); 