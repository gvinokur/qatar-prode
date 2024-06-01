import {createBaseFunctions} from "./base-repository";
import {TournamentGuess, TournamentGuessNew, TournamentGuessTable} from "./tables-definition";
import {db} from "./database";

const baseFunctions = createBaseFunctions<TournamentGuessTable, TournamentGuess>('tournament_guesses')

export const findTournamentGuessById = baseFunctions.findById
export const createTournamentGuess = baseFunctions.create
export const updateTournamentGuess = baseFunctions.update
export const deleteTournamentGuess = baseFunctions.delete

export async function findTournamentGuessByUserIdTournament(userId:string, tournamentId: string) {
  return db.selectFrom('tournament_guesses')
    .selectAll()
    .where('user_id', '=', userId)
    .where('tournament_id', '=', tournamentId)
    .executeTakeFirst()
}

export async function updateOrCreateTournamentGuess(guess: TournamentGuessNew) {

  const existingGuess = await findTournamentGuessByUserIdTournament(guess.user_id, guess.tournament_id)
  if(existingGuess) {
    await deleteTournamentGuess(existingGuess.id)
  }
  return createTournamentGuess(guess)


}
