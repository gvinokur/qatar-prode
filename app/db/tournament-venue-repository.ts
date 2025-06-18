import { db } from './database';
import { createBaseFunctions } from "./base-repository";
import {
  TournamentVenue,
  TournamentVenueNew,
  TournamentVenueTable
} from "./tables-definition";

// Create base CRUD functions for tournament venues
const baseFunctions = createBaseFunctions<TournamentVenueTable, TournamentVenue>('tournament_venues');

// Export the base functions
export const findTournamentVenueById = baseFunctions.findById;
export const updateTournamentVenue = baseFunctions.update;
export const createTournamentVenue = baseFunctions.create;
export const deleteTournamentVenue = baseFunctions.delete;

/**
 * Finds all tournament venues
 * @returns A promise that resolves to an array of all tournament venues
 */
export async function findAllTournamentVenues(tournamentId:string): Promise<TournamentVenue[]> {
  return await db.selectFrom('tournament_venues')
    .where('tournament_id', '=', tournamentId)
    .selectAll()
    .orderBy('name', 'asc')
    .execute();
}

/**
 * Finds a tournament venue by name
 * @param name - The name of the venue to find
 * @returns A promise that resolves to the found venue or undefined if not found
 */
export async function findTournamentVenueByName(name: string): Promise<TournamentVenue | undefined> {
  return await db.selectFrom('tournament_venues')
    .where('name', '=', name)
    .selectAll()
    .executeTakeFirst();
}

/**
 * Creates multiple tournament venues at once
 * @param venues - Array of venue data to create
 * @returns A promise that resolves to an array of created venues
 */
export async function createManyTournamentVenues(venues: TournamentVenueNew[]): Promise<TournamentVenue[]> {
  return await Promise.all(venues.map(venue => createTournamentVenue(venue)));
}
