import {db} from './database'
import {GameResultNew, GameResultUpdate} from "./tables-definition";

export function createGameResult(result: GameResultNew) {
  return db.insertInto('game_results')
    .values(result)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export function updateGameResult(gameId: string, result: GameResultUpdate) {
  return db.updateTable('game_results')
    .where('game_id', '=', gameId)
    .set(result)
    .returningAll()
    .executeTakeFirst()
}

export async function findGameResultByGameId(gameId: string, includeDrafts:boolean = false) {
  return db.selectFrom('game_results')
    .selectAll()
    .where('game_id', '=', gameId)
    //Always include non drafts
    .where('is_draft', 'in', [false, includeDrafts])
    .executeTakeFirst()
}

export async function findGameResultByGameIds(gameIds: string[], includeDrafts:boolean = false) {
  return db.selectFrom('game_results')
    .selectAll()
    .where('game_id', 'in', gameIds)
    //Always include non drafts
    .where('is_draft', 'in', [false, includeDrafts])
    .execute()
}
