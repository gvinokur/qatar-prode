import {db} from './database'
import {GameResultNew, GameResultUpdate} from "./tables-definition";
import {cache} from "react";
import {sql} from "kysely";

export function createGameResult(result: GameResultNew) {
  return db.insertInto('game_results')
    .values(result)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export function updateGameResult(gameId: string, result: GameResultUpdate) {
  // Convert undefined values to SQL NULL (Kysely skips undefined by default)
  const processedResult: Record<string, any> = {};
  for (const [key, value] of Object.entries(result)) {
    processedResult[key] = value ?? sql`NULL`;
  }

  return db.updateTable('game_results')
    .where('game_id', '=', gameId)
    .set(processedResult)
    .returningAll()
    .executeTakeFirst()
}

export const findGameResultByGameId = cache(async function (gameId: string, includeDrafts:boolean = false) {
  return db.selectFrom('game_results')
    .selectAll()
    .where('game_id', '=', gameId)
    //Always include non drafts
    .where('is_draft', 'in', [false, includeDrafts])
    .executeTakeFirst()
})

export const findGameResultByGameIds = cache(async function(gameIds: string[], includeDrafts:boolean = false) {
  return db.selectFrom('game_results')
    .selectAll()
    .where('game_id', 'in', gameIds)
    //Always include non drafts
    .where('is_draft', 'in', [false, includeDrafts])
    .execute()
})

/**
 * Delete all game results for a tournament
 * Used when deleting a tournament (admin operation)
 */
export async function deleteAllGameResultsByTournamentId(tournamentId: string): Promise<void> {
  // First get all game IDs for this tournament
  const games = await db
    .selectFrom('games')
    .select('id')
    .where('tournament_id', '=', tournamentId)
    .execute();

  const gameIds = games.map(g => g.id);

  if (gameIds.length > 0) {
    await db
      .deleteFrom('game_results')
      .where('game_id', 'in', gameIds)
      .execute();
  }
}
