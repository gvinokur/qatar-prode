'use server'

import {getLoggedInUser} from "./user-actions";
import {GameGuessNew, TournamentGroupTeamStatsGuessNew, TournamentGuessNew, UserUpdate} from "../db/tables-definition";
import {updateGameGuess, updateGameGuessByGameId, updateOrCreateGuess} from "../db/game-guess-repository";
import {updateOrCreateTournamentGuess as dbUpdateOrCreateTournamentGuess} from "../db/tournament-guess-repository";
import {
  findAllTournamentGroupTeamGuessInGroup,
  upsertTournamentGroupTeamGuesses
} from "../db/tournament-group-team-guess-repository";
import {findGroupsInTournament} from "../db/tournament-group-repository";
import {calculatePlayoffTeamsFromPositions} from "../utils/playoff-teams-calculator";
import {ExtendedPlayoffRoundData} from "../definitions";
import {findPlayoffStagesWithGamesInTournament} from "../db/tournament-playoff-repository";
import {findGamesInTournament} from "../db/game-repository";
import {toMap} from "../utils/ObjectUtils";
import {Updateable} from "kysely";
import {db} from "../db/database";

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

export async function updatePlayoffGameGuesses(tournamentId: string, user?: UserUpdate) {
  const userId = (user || (await getLoggedInUser()))?.id
  const playoffStages:ExtendedPlayoffRoundData[] = await findPlayoffStagesWithGamesInTournament(tournamentId)
  const games = await findGamesInTournament(tournamentId)
  const groups = await findGroupsInTournament(tournamentId)
  if(!userId || playoffStages.length === 0) {
    return
  }
  const gamesMap = toMap(games)

  const guessedPositionsByGroup = Object.fromEntries(
    await Promise.all(
      groups.map(async (group) => [
        group.group_letter,
        await findAllTournamentGroupTeamGuessInGroup(userId, group.id)
      ])
    ))

  const playoffTeamsByGuess = calculatePlayoffTeamsFromPositions(
    playoffStages[0],
    gamesMap,
    guessedPositionsByGroup)

  // console.log('should update for user id', userId, playoffTeamsByGuess)

  return Promise.all(Object.keys(playoffTeamsByGuess).map(async (game_id) => {
    if(playoffTeamsByGuess[game_id].homeTeam?.team_id && playoffTeamsByGuess[game_id].awayTeam?.team_id) {
      //TODO: remove tempoarary fix
      const toFix = await db.selectFrom('game_guesses')
        .selectAll()
        .where('home_team', '=', playoffTeamsByGuess[game_id].homeTeam?.team_id)
        .where('away_team', '=', playoffTeamsByGuess[game_id].awayTeam?.team_id)
        .where('user_id', '=', userId)
        .where('game_id', 'is', null)
        .executeTakeFirst()

      if(toFix) {
        console.log('toFix', toFix)
      }

      if (toFix) {
        try {
          await db.updateTable('game_guesses')
            .set('game_id', game_id)
            .where('id', '=', toFix.id)
            .execute()
        } catch(e) {
          console.log(e, 'but continuing')
        }
      }
    }

    return updateGameGuessByGameId(game_id, userId, {
      home_team: playoffTeamsByGuess[game_id].homeTeam?.team_id || null,
      away_team: playoffTeamsByGuess[game_id].awayTeam?.team_id || null
    })
  }))
}
