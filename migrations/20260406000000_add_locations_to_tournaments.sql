-- Migration: 20260406000000_add_locations_to_tournaments.sql
-- Story #310: Add location data to tournaments for SportsEvent structured data

ALTER TABLE tournaments
  ADD COLUMN locations JSONB NOT NULL DEFAULT '[]'::jsonb;
