'use server'

import {getLoggedInUser} from "./user-actions";
import {GameGuessNew, TournamentGuessNew, UserUpdate} from "../db/tables-definition";
import { updateGameGuessByGameId, updateOrCreateGuess, findGameGuessesByUserId} from "../db/game-guess-repository";
import {updateOrCreateTournamentGuess as dbUpdateOrCreateTournamentGuess} from "../db/tournament-guess-repository";
import {findGroupsInTournament, findTournamentgroupById} from "../db/tournament-group-repository";
import {calculatePlayoffTeamsFromPositions} from "../utils/playoff-teams-calculator";
import {ExtendedPlayoffRoundData} from "../definitions";
import {findPlayoffStagesWithGamesInTournament} from "../db/tournament-playoff-repository";
import {findGamesInTournament, findGamesInGroup} from "../db/game-repository";
import {toMap} from "../utils/ObjectUtils";
import {db} from "../db/database";
import {calculateGroupPosition} from "../utils/group-position-calculator";

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

  // Calculate group positions from game guesses for each group
  const userGameGuesses = await findGameGuessesByUserId(userId, tournamentId)
  const gameGuessesMap = userGameGuesses.reduce((map, guess) => {
    map[guess.game_id] = guess
    return map
  }, {} as Record<string, any>)

  const guessedPositionsByGroup = Object.fromEntries(
    await Promise.all(
      groups.map(async (group) => {
        const groupGames = await findGamesInGroup(group.id)
        const groupData = await findTournamentgroupById(group.id)

        // Calculate standings from game guesses
        const teamIds = groupGames.reduce((ids, game) => {
          if (game.home_team && !ids.includes(game.home_team)) ids.push(game.home_team)
          if (game.away_team && !ids.includes(game.away_team)) ids.push(game.away_team)
          return ids
        }, [] as string[])

        const standings = calculateGroupPosition(
          teamIds,
          groupGames.map(game => ({
            ...game,
            resultOrGuess: gameGuessesMap[game.id]
          })),
          groupData?.sort_by_games_between_teams
        )

        return [group.group_letter, standings]
      })
    ))

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
