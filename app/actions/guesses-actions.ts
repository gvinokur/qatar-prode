'use server'

import {getLoggedInUser} from "./user-actions";
import {GameGuessNew, TournamentGuessNew, UserUpdate} from "../db/tables-definition";
import { updateGameGuessByGameId, updateOrCreateGuess} from "../db/game-guess-repository";
import {updateOrCreateTournamentGuess as dbUpdateOrCreateTournamentGuess} from "../db/tournament-guess-repository";
import {findGroupsInTournament} from "../db/tournament-group-repository";
import {calculatePlayoffTeamsFromPositions} from "../utils/playoff-teams-calculator";
import {ExtendedPlayoffRoundData} from "../definitions";
import {findPlayoffStagesWithGamesInTournament} from "../db/tournament-playoff-repository";
import {findGamesInTournament} from "../db/game-repository";
import {toMap} from "../utils/ObjectUtils";
import {db} from "../db/database";

export async function updateOrCreateGameGuesses(gameGuesses: GameGuessNew[]) {
  try {
    const user = await getLoggedInUser()
    if(!user) {
      throw new Error('Unauthorized action')
    }
    const _createdGameGuesses = await Promise.all(
      gameGuesses.map(gameGuess => {
        return updateOrCreateGuess({
          ...gameGuess,
          user_id: user.id
        })
      })
    )
    return { success: true }
  } catch (error: any) {
    // Return error message so client can display it
    return { success: false, error: error.message || 'Failed to save prediction' }
  }
}

export async function updateOrCreateTournamentGuess(guess: TournamentGuessNew) {
  try {
    return await dbUpdateOrCreateTournamentGuess(guess)
  } catch {
    return { success: false, error: 'Failed to update tournament guess' };
  }
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

  // Get user's qualification predictions (JSONB table)
  const { getAllUserGroupPositionsPredictions } = await import('../db/qualified-teams-repository')
  const qualificationPredictions = await getAllUserGroupPositionsPredictions(userId, tournamentId)

  // Build guessedPositionsByGroup from qualification predictions
  const guessedPositionsByGroup = Object.fromEntries(
    groups.map((group) => {
      const groupPrediction = qualificationPredictions.find(p => p.group_id === group.id)

      if (!groupPrediction) {
        return [group.group_letter, []]
      }

      // Extract team positions from JSONB and convert to standings format
      const positions = groupPrediction.team_predicted_positions as unknown as Array<{
        team_id: string
        predicted_position: number
        predicted_to_qualify: boolean
      }>

      // Sort by predicted position and convert to standings format
      const standings = positions
        .sort((a, b) => a.predicted_position - b.predicted_position)
        .map(p => ({
          team_id: p.team_id,
          position: p.predicted_position,
          // These fields aren't used by playoff calculation, but include for compatibility
          points: 0,
          games_played: 0,
          win: 0,
          draw: 0,
          loss: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
          conduct_score: 0,
          is_complete: true, // Mark as complete so playoff calculator accepts this group
        }))

      return [group.group_letter, standings]
    })
  )

  const playoffTeamsByGuess = await calculatePlayoffTeamsFromPositions(
    tournamentId,
    playoffStages[0],
    gamesMap,
    guessedPositionsByGroup)

  return Promise.all(Object.keys(playoffTeamsByGuess).map(async (game_id) => {
    if(playoffTeamsByGuess[game_id].homeTeam?.team_id && playoffTeamsByGuess[game_id].awayTeam?.team_id) {
      // Fix orphaned game guesses that don't have a game_id but match home/away teams
      const orphanedGuess = await db.selectFrom('game_guesses')
        .selectAll()
        .where('home_team', '=', playoffTeamsByGuess[game_id].homeTeam?.team_id)
        .where('away_team', '=', playoffTeamsByGuess[game_id].awayTeam?.team_id)
        .where('user_id', '=', userId)
        .where('game_id', 'is', null)
        .executeTakeFirst()

      if (orphanedGuess) {
        try {
          await db.updateTable('game_guesses')
            .set('game_id', game_id)
            .where('id', '=', orphanedGuess.id)
            .execute()
        } catch {
          // Continue execution even if update fails
        }
      }
    }

    return updateGameGuessByGameId(game_id, userId, {
      home_team: playoffTeamsByGuess[game_id].homeTeam?.team_id || null,
      away_team: playoffTeamsByGuess[game_id].awayTeam?.team_id || null
    })
  }))
}
