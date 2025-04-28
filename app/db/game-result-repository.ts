import {db} from './database'
import {GameResultNew, GameResultUpdate} from "./tables-definition";
import {cache} from "react";

export function createGameResult(result: GameResultNew) {
  return db.insertInto('game_results')
    .values(result)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export function updateGameResult(gameId: string, result: GameResultUpdate) {
  console.log('updating result for game', gameId, result)
  return db.updateTable('game_results')
    .where('game_id', '=', gameId)
    .set(result)
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
