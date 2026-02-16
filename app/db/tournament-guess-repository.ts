import {createBaseFunctions} from "./base-repository";
import {TournamentGuess, TournamentGuessNew, TournamentGuessTable, TournamentGuessUpdate} from "./tables-definition";
import {db} from "./database";
import {getTodayYYYYMMDD} from "../utils/date-utils";
import {legacyGetGameGuessStatisticsForUsers} from "./game-guess-repository";
import {customToMap} from "../utils/ObjectUtils";

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
    // UPDATE existing record - preserves fields not in 'guess' parameter
    // Cast to TournamentGuessUpdate for proper Kysely typing (Updateable vs Insertable)
    return updateTournamentGuess(existingGuess.id, guess as TournamentGuessUpdate)
  }
  // CREATE new record only when none exists
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

/**
 * Recalculate and materialize game scores for users in a tournament
 * Story #147: Performance optimization to materialize expensive SQL aggregations
 *
 * @param userIds - User IDs to recalculate (affected by game result)
 * @param tournamentId - Tournament ID
 * @returns Array of updated tournament guesses
 */
export async function recalculateGameScoresForUsers(
  userIds: string[],
  tournamentId: string
): Promise<TournamentGuess[]> {
  // Edge case: empty user IDs array
  if (!userIds || userIds.length === 0) {
    return [];
  }

  // Fetch aggregated game scores using legacy aggregation query
  // This ensures parity with on-demand calculations during materialization
  const gameStats = await legacyGetGameGuessStatisticsForUsers(userIds, tournamentId);

  // Build map for efficient lookup
  const statsByUserId = customToMap(gameStats, (stat) => stat.user_id);

  // Update each user's tournament_guesses with materialized scores
  // Note: We use sequential updates per user (not Promise.all) to avoid race conditions
  // within the same batch. Concurrent batches for different tournaments are still safe.
  const results: TournamentGuess[] = [];

  for (const userId of userIds) {
    const stats = statsByUserId[userId];

    // Ensure tournament_guesses row exists (create if needed)
    let tournamentGuess = await findTournamentGuessByUserIdTournament(userId, tournamentId);

    if (!tournamentGuess) {
      // User has game_guesses but no tournament_guesses row - create it
      try {
        tournamentGuess = await createTournamentGuess({
          user_id: userId,
          tournament_id: tournamentId,
        });
      } catch (error) {
        // If creation fails (e.g., constraint violation), skip this user
        console.error(`Failed to create tournament_guesses row for user ${userId}:`, error);
        continue;
      }
    }

    // Prepare updates with materialized scores
    const updates: TournamentGuessUpdate = {
      total_game_score: stats?.total_score || 0,
      group_stage_game_score: stats?.group_score || 0,
      playoff_stage_game_score: stats?.playoff_score || 0,
      total_boost_bonus: stats?.total_boost_bonus || 0,
      group_stage_boost_bonus: stats?.group_boost_bonus || 0,
      playoff_stage_boost_bonus: stats?.playoff_boost_bonus || 0,
      // Prediction accuracy counts (for stats page)
      total_correct_guesses: stats?.total_correct_guesses || 0,
      total_exact_guesses: stats?.total_exact_guesses || 0,
      group_correct_guesses: stats?.group_correct_guesses || 0,
      group_exact_guesses: stats?.group_exact_guesses || 0,
      playoff_correct_guesses: stats?.playoff_correct_guesses || 0,
      playoff_exact_guesses: stats?.playoff_exact_guesses || 0,
      // Yesterday snapshots
      yesterday_total_game_score: stats?.yesterday_total_score || 0,
      yesterday_boost_bonus: stats?.yesterday_boost_bonus || 0,
      // Date of last game used in calculation (not current timestamp)
      last_game_score_update_at: stats?.last_game_date || new Date(),
    };

    // Update with transaction-safe update
    const updated = await updateTournamentGuessByUserIdTournament(userId, tournamentId, updates);
    if (updated) {
      results.push(updated);
    }
  }

  return results;
}
