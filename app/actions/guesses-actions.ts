'use server'

import {getLoggedInUser} from "./user-actions";
import {GameGuessNew, TournamentGroupTeamStatsGuessNew, TournamentGuessNew} from "../db/tables-definition";
import {updateOrCreateGuess} from "../db/game-guess-repository";
import {updateOrCreateTournamentGuess as dbUpdateOrCreateTournamentGuess} from "../db/tournament-guess-repository";
import {upsertTournamentGroupTeamGuesses} from "../db/tournament-group-team-guess-repository";

export async function updateOrCreateGameGuesses(gameGuesses: GameGuessNew[]) {
  const user = await getLoggedInUser()
  if(!user) {
    return 'Unauthorized action'
  }
  const createdGameGuesses = await Promise.all(
    gameGuesses.map(gameGuess => {
      return updateOrCreateGuess({
        ...gameGuess,
        user_id: user.id
      })
    })
  )
}

export async function updateOrCreateTournamentGuess(guess: TournamentGuessNew) {
  return dbUpdateOrCreateTournamentGuess(guess)
}

export async function updateOrCreateTournamentGroupTeamGuesses(groupTeamGuesses: TournamentGroupTeamStatsGuessNew[]) {
  return upsertTournamentGroupTeamGuesses(groupTeamGuesses)
}

export async function updatePlayoffGameGuesses(tournamentId: string) {
  console.log('update playoff game guesses on save')
}
