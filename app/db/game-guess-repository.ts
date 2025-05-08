import {db} from './database'
import {createBaseFunctions} from "./base-repository";
import {GameGuessTable, GameGuess, GameGuessUpdate, GameGuessNew} from "./tables-definition";
import {GameStatisticForUser} from "../../types/definitions";
import {integerPropType} from "@mui/utils";
import {cache} from "react";

const tableName = 'game_guesses'

const baseFunctions = createBaseFunctions<GameGuessTable, GameGuess>(tableName)

export const findGameGuessById = baseFunctions.findById
export const createGameGuess = baseFunctions.create
export const updateGameGuess = baseFunctions.update
export const deleteGameGuess = baseFunctions.delete

export const findGameGuessesByUserId = cache(async function (userId: string, tournamentId: string) {
  return db.selectFrom(tableName)
    .innerJoin('games', "games.id", 'game_guesses.game_id')
    .where('game_guesses.user_id', '=', userId)
    .where('games.tournament_id', '=', tournamentId)
    .selectAll(tableName)
    .execute()
})

export async function updateGameGuessByGameId(game_id: string, user_id: string, withUpdate: {home_team?: string | null, away_team?:string | null }) {

  return await db
    .updateTable(tableName)
    .set(withUpdate)
    .where("game_guesses.game_id", "=", game_id)
    .where("game_guesses.user_id", "=", user_id)
    .where(eb => eb.or([
      eb("game_guesses.home_team", "<>", withUpdate.home_team),
      eb("game_guesses.away_team", "<>", withUpdate.away_team)
    ]))
    .returningAll()
    .executeTakeFirst()
}

export async function updateOrCreateGuess(guess: GameGuessNew) {

   const existingGuess = await db
     .selectFrom(tableName)
     .selectAll()
     .where("game_guesses.game_id", "=", guess.game_id)
     .where("game_guesses.user_id", "=", guess.user_id)
     .executeTakeFirst()

   if(existingGuess) {
     //Always recreate the guess
     await deleteGameGuess(existingGuess.id)
   }
   return createGameGuess(guess)

}

export async function getGameGuessStatisticsForUsers(userIds: string[], tournamentId: string) {
  const statisticsForUsers = await db.selectFrom('game_guesses')
    .innerJoin('games', 'games.id', 'game_guesses.game_id')
    .where('game_guesses.user_id', 'in', userIds)
    .where('games.tournament_id', '=', tournamentId)
    .select('user_id')
    .select(eb => [
      eb.cast<number>(
        eb.fn.sum(
          eb.case()
            .when('game_guesses.score', '>', 0)
            .then(1)
            .else(0)
            .end()
        ),
        'integer'
      ).as('total_correct_guesses'),
      eb.cast<number>(
        eb.fn.sum(
          eb.case()
            .when('game_guesses.score', '>', 1)
            .then(1)
            .else(0)
            .end()
        ),
        'integer'
      ).as('total_exact_guesses'),
      eb.cast<number>(
        eb.fn.sum(eb.cast<number>('game_guesses.score', 'integer'))
        ,'integer'
      ).as('total_score'),
      eb.cast<number>(
        eb.fn.sum(
          eb.case()
            .when('games.game_type', '<>', 'group')
            .then(0)
            .when('game_guesses.score', '>', 0)
            .then(1)
            .else(0)
            .end()
        ),
        'integer'
      ).as('group_correct_guesses'),
      eb.cast<number>(
        eb.fn.sum(
          eb.case()
            .when('games.game_type', '<>', 'group')
            .then(0)
            .when('game_guesses.score', '>', 1)
            .then(1)
            .else(0)
            .end()
        ),
        'integer'
      ).as('group_exact_guesses'),
      eb.cast<number>(
        eb.fn.sum(
          eb.case()
            .when('games.game_type', '<>', 'group')
            .then(0)
            .else(eb.cast<number>('game_guesses.score', 'integer'))
            .end()
        ),
        'integer'
      ).as('group_score'),
      eb.cast<number>(
        eb.fn.sum(
          eb.case()
            .when('games.game_type', '=', 'group')
            .then(0)
            .when('game_guesses.score', '>', 0)
            .then(1)
            .else(0)
            .end()
        ),
        'integer'
      ).as('playoff_correct_guesses'),
      eb.cast<number>(
        eb.fn.sum(
          eb.case()
            .when('games.game_type', '=', 'group')
            .then(0)
            .when('game_guesses.score', '>', 1)
            .then(1)
            .else(0)
            .end()
        ),
        'integer'
      ).as('playoff_exact_guesses'),
      eb.cast<number>(
        eb.fn.sum(
          eb.case()
            .when('games.game_type', '=', 'group')
            .then(0)
            .else(eb.cast<number>('game_guesses.score', 'integer'))
            .end()
        ),
        'integer'
      ).as('playoff_score'),
    ])
    .groupBy('game_guesses.user_id')
    .execute()

  return statisticsForUsers as GameStatisticForUser[]
}

//--------------------------------------------------------------------------------------
export async function findAllGuessesForGamesWithResultsInDraft() {
  return db.selectFrom('game_guesses')
    .selectAll()
    .where('score', 'is not', null)
    .where((eb) =>
      eb.exists(
        eb.selectFrom('game_results')
          .selectAll()
          .whereRef('game_results.game_id', '=', 'game_guesses.game_id')
          .where('is_draft', '=', true)
      )
    ).execute()
}

export async function deleteAllUserGameGuesses(userId: string) {
  return db.deleteFrom(tableName)
    .where('user_id', '=', userId)
    .execute()
}
