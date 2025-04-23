-- Create tournament_venues table
CREATE TABLE IF NOT EXISTS tournament_venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    picture_url TEXT,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE
);

-- Add a unique constraint on the venue name
CREATE UNIQUE INDEX IF NOT EXISTS tournament_venues_name_idx ON tournament_venues (name);

-- Add an index on location for faster searches
CREATE INDEX IF NOT EXISTS tournament_venues_location_idx ON tournament_venues (location);

-- Add an index on tournament_id for faster joins
CREATE INDEX IF NOT EXISTS tournament_venues_tournament_id_idx ON tournament_venues (tournament_id);
