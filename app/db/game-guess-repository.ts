import {db} from './database'
import {createBaseFunctions} from "./base-repository";
import {GameGuessTable, GameGuess, GameGuessUpdate, GameGuessNew} from "./tables-definition";

const tableName = 'game_guesses'

const baseFunctions = createBaseFunctions<GameGuessTable, GameGuess>(tableName)

export const findGameGuessById = baseFunctions.findById
export const createGameGuess = baseFunctions.create
export const updateGameGuess = baseFunctions.update
export const deleteGameGuess = baseFunctions.delete

export async function findGameGuessesByUserId(userId: string, tournamentId: string) {
  return db.selectFrom(tableName)
    .innerJoin('games', "games.id", 'game_guesses.game_id')
    .where('game_guesses.user_id', '=', userId)
    .where('games.tournament_id', '=', tournamentId)
    .selectAll(tableName)
    .execute()
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
