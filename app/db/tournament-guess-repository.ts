import {createBaseFunctions} from "./base-repository";
import {TournamentGuess, TournamentGuessNew, TournamentGuessTable, TournamentGuessUpdate} from "./tables-definition";
import {db} from "./database";
import {getTodayYYYYMMDD} from "../utils/date-utils";

const baseFunctions = createBaseFunctions<TournamentGuessTable, TournamentGuess>('tournament_guesses')

export const findTournamentGuessById = baseFunctions.findById
export const createTournamentGuess = baseFunctions.create
export const updateTournamentGuess = baseFunctions.update
export const deleteTournamentGuess = baseFunctions.delete

/**
 * Update tournament guess with automatic daily snapshot for rank tracking
 * On first update each day, snapshots current tournament score to yesterday_tournament_score
 *
 * Note: Uses Argentina timezone for determining "today" (via getTodayYYYYMMDD).
 * This provides daily granularity for tournament score snapshots, while game scores
 * use a rolling 24-hour window for more dynamic rank changes.
 *
 * @param guessId - ID of the tournament guess to update
 * @param updates - Fields to update
 * @returns Updated tournament guess or undefined if not found
 */
export async function updateTournamentGuessWithSnapshot(
  guessId: string,
  updates: TournamentGuessUpdate
): Promise<TournamentGuess | undefined> {
  const existing = await findTournamentGuessById(guessId);

  if (!existing) {
    return undefined;
  }

  const today = getTodayYYYYMMDD();

  // Race condition protection: only snapshot on first update each day
  if (existing.last_score_update_date && today > existing.last_score_update_date) {
    // Calculate current total tournament score before update
    const currentTotal =
      (existing.honor_roll_score || 0) +
      (existing.individual_awards_score || 0) +
      (existing.qualified_teams_score || 0) +
      (existing.group_position_score || 0);

    updates.yesterday_tournament_score = currentTotal;
  }

  // Always update the last update date
  updates.last_score_update_date = today;

  return updateTournamentGuess(guessId, updates);
}

export async function updateTournamentGuessByUserIdTournament(userId:string, tournamentId: string, withUpdate: TournamentGuessUpdate) {
  return db.updateTable('tournament_guesses')
    .where('user_id', '=', userId)
    .where('tournament_id', '=', tournamentId)
    .set(withUpdate)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Update tournament guess by user and tournament with automatic daily snapshot for rank tracking
 * On first update each day, snapshots current tournament score to yesterday_tournament_score
 *
 * @param userId - ID of the user
 * @param tournamentId - ID of the tournament
 * @param updates - Fields to update
 * @returns Updated tournament guess or undefined if not found
 */
export async function updateTournamentGuessByUserIdTournamentWithSnapshot(
  userId: string,
  tournamentId: string,
  updates: TournamentGuessUpdate
): Promise<TournamentGuess | undefined> {
  const existing = await findTournamentGuessByUserIdTournament(userId, tournamentId);

  if (!existing) {
    return undefined;
  }

  const today = getTodayYYYYMMDD();

  // Race condition protection: only snapshot on first update each day
  if (existing.last_score_update_date && today > existing.last_score_update_date) {
    // Calculate current total tournament score before update
    const currentTotal =
      (existing.honor_roll_score || 0) +
      (existing.individual_awards_score || 0) +
      (existing.qualified_teams_score || 0) +
      (existing.group_position_score || 0);

    updates.yesterday_tournament_score = currentTotal;
  }

  // Always update the last update date
  updates.last_score_update_date = today;

  return updateTournamentGuessByUserIdTournament(userId, tournamentId, updates);
}

export async function findTournamentGuessByUserIdTournament(userId:string, tournamentId: string) {
  return db.selectFrom('tournament_guesses')
    .selectAll()
    .where('user_id', '=', userId)
    .where('tournament_id', '=', tournamentId)
    .executeTakeFirst()
}

export async function findTournamentGuessByUserIdsTournament(userIds: string[], tournamentId: string) {
  return db.selectFrom('tournament_guesses')
    .selectAll()
    .where('user_id', 'in', userIds)
    .where('tournament_id', '=', tournamentId)
    .execute()
}

export async function updateOrCreateTournamentGuess(guess: TournamentGuessNew) {
  const existingGuess = await findTournamentGuessByUserIdTournament(guess.user_id, guess.tournament_id)
  if(existingGuess) {
    await deleteTournamentGuess(existingGuess.id)
  }
  return createTournamentGuess(guess)
}

export async function findTournamentGuessByTournament(tournamentId: string) {
  return db.selectFrom('tournament_guesses')
    .selectAll()
    .where('tournament_id', '=', tournamentId)
    .execute()
}

export async function deleteAllUserTournamentGuesses(userId: string) {
  return db.deleteFrom('tournament_guesses')
    .where('user_id', '=', userId)
    .execute()
}

export async function deleteAllTournamentGuessesByTournamentId(tournamentId: string) {
  return db.deleteFrom('tournament_guesses')
    .where('tournament_id', '=', tournamentId)
    .execute();
}
