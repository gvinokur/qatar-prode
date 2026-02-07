'use server'

import tournaments from "../../data/tournaments";
import {
  createTournament,
  createTournamentTeam,
  deleteTournament, deleteTournamentTeams, findTournamentById,
  findTournamentByName, updateTournament
} from "../db/tournament-repository";
import {
  createTeam, findGuessedQualifiedTeams,
  findQualifiedTeams,
  findTeamInGroup,
  findTeamInTournament,
  getTeamByName
} from "../db/team-repository";
import {
  createTournamentGroup,
  createTournamentGroupGame,
  createTournamentGroupTeam,
  deleteAllGroupsFromTournament,
  findGroupsInTournament,
  findGroupsWithGamesAndTeamsInTournament, findTournamentgroupById, updateTournamentGroupTeams, findTeamsInGroup
} from "../db/tournament-group-repository";
import {
  createPlayoffRound,
  createPlayoffRoundGame,
  deleteAllPlayoffRoundsInTournament, findPlayoffStagesWithGamesInTournament
} from "../db/tournament-playoff-repository";
import {
  Game,
  GameGuess,
  GameNew,
  PlayerNew,
  Team,
  Tournament, TournamentGroup,
  TournamentGroupTeamNew, TournamentUpdate
} from "../db/tables-definition";
import {
  createGame,
  deleteAllGamesFromTournament, findAllGamesWithPublishedResultsAndGameGuesses,
  findGamesInGroup,
  findGamesInTournament,
  updateGame
} from "../db/game-repository";

import {
  findAllTournamentVenues,
  createTournamentVenue,
  deleteAllTournamentVenues
} from '../db/tournament-venue-repository';
import {
  findThirdPlaceRulesByTournament,
  createThirdPlaceRule,
  deleteThirdPlaceRulesByTournament
} from '../db/tournament-third-place-rules-repository';
import {
  createPlayer,
  findAllPlayersInTournamentWithTeamData,
  findPlayerByTeamAndTournament,
  updatePlayer,
  deleteAllPlayersInTournament
} from "../db/player-repository";
import {ExtendedGameData, ExtendedGroupData, ExtendedPlayoffRoundData} from "../definitions";
import {
  createGameResult,
  findGameResultByGameId,
  findGameResultByGameIds,
  updateGameResult
} from "../db/game-result-repository";
import {calculatePlayoffTeams} from "../utils/playoff-teams-calculator";
import {findAllUserTournamentGroupsWithoutGuesses, findAllTournamentGroupTeamGuessInGroup, deleteAllTournamentGroupTeamStatGuessesByTournamentId} from "../db/tournament-group-team-guess-repository";
import {
  findAllGuessesForGamesWithResultsInDraft,
  findGameGuessesByUserId,
  updateGameGuess,
  updateGameGuessWithBoost,
  deleteAllGameGuessesByTournamentId
} from "../db/game-guess-repository";
import {calculateGroupPosition} from "../utils/group-position-calculator";
import {updateOrCreateTournamentGroupTeamGuesses, updatePlayoffGameGuesses} from "./guesses-actions";
import {customToMap, toMap} from "../utils/ObjectUtils";
import {db} from "../db/database";
import {calculateScoreForGame} from "../utils/game-score-calculator";
import {
  findTournamentGuessByTournament,
  updateTournamentGuessWithSnapshot,
  updateTournamentGuessByUserIdTournamentWithSnapshot,
  deleteAllTournamentGuessesByTournamentId
} from "../db/tournament-guess-repository";
import {awardsDefinition} from "../utils/award-utils";
import {getLoggedInUser} from "./user-actions";
import { revalidatePath } from 'next/cache';
import { findAllUsers } from '../db/users-repository';
import {
  findUserIdsForTournament,
  addUsersToTournament,
  removeAllTournamentPermissions
} from '../db/tournament-view-permission-repository';


export async function deleteDBTournamentTree(tournament: Tournament) {
  const user = await getLoggedInUser();

  // Authorization: Only admins can delete tournaments
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Only administrators can delete tournaments');
  }

  // Safety check: Only allow deletion of deactivated tournaments
  if (tournament.is_active) {
    throw new Error('Cannot delete an active tournament. Please deactivate it first.');
  }

  revalidatePath(`/tournaments/${tournament.id}/backoffice`);

  // Delete all related entities in reverse order of dependencies
  // User-related data
  await deleteAllGameGuessesByTournamentId(tournament.id);
  await deleteAllTournamentGuessesByTournamentId(tournament.id);
  await deleteAllTournamentGroupTeamStatGuessesByTournamentId(tournament.id);

  // Tournament structure and content
  await deleteAllPlayersInTournament(tournament.id);
  await deleteAllTournamentVenues(tournament.id);
  await deleteThirdPlaceRulesByTournament(tournament.id);
  await deleteAllGamesFromTournament(tournament.id);
  await deleteAllPlayoffRoundsInTournament(tournament.id);
  await deleteAllGroupsFromTournament(tournament.id);
  await deleteTournamentTeams(tournament.id);

  // Finally, delete the tournament itself
  await deleteTournament(tournament.id);
}

export async function generateDbTournamentTeamPlayers(tournamentName: string) {
  const result = await Promise.all(tournaments
    .filter(tournament => tournament.tournament_name === tournamentName)
    .map(async (tournament) => {
      if(tournament.players.length > 0) {
        const existingDBTournament = await findTournamentByName(tournamentName);
        if(!existingDBTournament) {
          throw "Cannot create players for a non existing tournament"
        }
        const teams = await findTeamInTournament(existingDBTournament.id);
        if(teams.length === 0) {
          throw "Cannot create players for a tournament without teams"
        }
        const teamsByNameMap: {[k:string]: Team} = customToMap(teams, (team) => team.name)

        await Promise.all(tournament.players.map(async (player) => {
          const playerTeam = teamsByNameMap[player.team]
          if (!playerTeam) {
            return
          }
          const existingPlayer = await findPlayerByTeamAndTournament(existingDBTournament.id, playerTeam.id, player.name)
          if(existingPlayer) {
           return updatePlayer(existingPlayer.id, {
             ...existingPlayer,
             age_at_tournament: player.age,
             position: player.position
           })
          } else {
            const newPlayer: PlayerNew = {
              tournament_id: existingDBTournament.id,
              team_id: playerTeam.id,
              name: player.name,
              age_at_tournament: player.age,
              position: player.position
            }

            return createPlayer(newPlayer)
          }

        }))

        return 'All players created'
      }
    }))

  return result
}

export async function generateDbTournament(name: string, deletePrevious:boolean = false) {
  const result = await Promise.all(tournaments
    .filter(tournament => tournament.tournament_name === name)
    .map(async (tournament) => {
      const existingDBTournament = await findTournamentByName(name);
      try {
        if (existingDBTournament) {
          if (deletePrevious) {
            await deleteDBTournamentTree(existingDBTournament)
            return 'Primero lo borro'
          } else {
            return 'El torneo ya existe'
          }
        }

        //Create the tournament and get the id
        const {id: tournamentId} = await createTournament({
          short_name: tournament.tournament_short_name,
          long_name: tournament.tournament_name,
          theme: JSON.stringify(tournament.tournament_theme),
          is_active: true
        })

        //Get or create teams
        const teamMap: {
          [k: string]: string
        } = Object.fromEntries(await Promise.all(tournament.teams.map(async team => {
          //Check if exists, only create if not
          const dbTeam = await getTeamByName(team.name)
          if (dbTeam) {
            //TODO: Should it update?

            return [dbTeam.name, dbTeam.id]
          }
          // Create if it doesn't
          const {id: teamId} = await createTeam({
            name: team.name,
            short_name: team.short_name,
            theme: JSON.stringify({
              primary_color: team.primary_color,
              secondary_color: team.secondary_color
            })
          })

          return [team.name, teamId]
        })))

        //Create tournament-team association
        await Promise.all(Object.values(teamMap).map(async teamId => {
          return await createTournamentTeam({tournament_id: tournamentId, team_id: teamId})
        }))

        //Create groups
        const groupIdMap: {
          [k: string]: string
        } = Object.fromEntries(await Promise.all(tournament.groups.map(async group => {
          //Create group
          const {id: groupId} = await createTournamentGroup({
            tournament_id: tournamentId,
            group_letter: group.letter,
            sort_by_games_between_teams: false
          })

          //Associate all teams in this group
          await Promise.all(group.teams.map(async (teamName, index) => {
            await createTournamentGroupTeam({
              tournament_group_id: groupId,
              team_id: teamMap[teamName],
              position: index,
              games_played: 0,
              points: 0,
              win: 0,
              draw: 0,
              loss: 0,
              goals_for: 0,
              goals_against: 0,
              goal_difference: 0,
              conduct_score: 0,
              is_complete: false
            })
          }))

          return [group.letter, groupId]
        })))

        const playoffRoundMap: { [K: string]: string } = Object.fromEntries(await Promise.all(
          tournament.playoffs.map(async playoff => {
            const {id: playoffRoundId} = await createPlayoffRound({
              tournament_id: tournamentId,
              round_name: playoff.stage,
              round_order: playoff.order,
              total_games: playoff.games,
              is_final: playoff.is_final,
              is_third_place: playoff.is_third_place
            })

            return [playoff.stage, playoffRoundId]
          })))

        //Create all games!!
        await Promise.all(tournament.games.map(async game => {
          const newGame: GameNew = {
            tournament_id: tournamentId,
            game_number: game.game_number,
            home_team: game.home_team && teamMap[game.home_team],
            away_team: game.away_team && teamMap[game.away_team],
            game_date: game.date,
            location: game.location,
            home_team_rule: game.home_team_rule && JSON.stringify(game.home_team_rule),
            away_team_rule: game.away_team_rule && JSON.stringify(game.away_team_rule)
          }

          const {id: gameId} = await createGame(newGame)

          //Associate game to group or playoff
          if (game.group) {
            await createTournamentGroupGame({
              tournament_group_id: groupIdMap[game.group],
              game_id: gameId
            })
          } else if (game.playoff) {
            await createPlayoffRoundGame({
              tournament_playoff_round_id: playoffRoundMap[game.playoff],
              game_id: gameId
            })
          }
          }))
      } catch {
        return 'El campeonato no pudo ser creado'
      }
      return 'El campeonato fue creado exitosamente'
    }))

  return result;
}

export async function saveGameResults(gamesWithResults: ExtendedGameData[]) {
  //Save all results first
  await Promise.all(gamesWithResults.map(async (game) => {
    if(game.gameResult) {
      const existingResult = await findGameResultByGameId(game.id, true);
      if (existingResult) {
        return await updateGameResult(game.id, game.gameResult)
      } else {
        return await createGameResult(game.gameResult)
      }
    }
  }))
}

export async function saveGamesData(games: ExtendedGameData[]) {
  await Promise.all(games.map(async (game) => {
    const { home_team, away_team, game_date } = game;
    return await updateGame(game.id, {
      home_team,
      away_team,
      game_date
    })
  }))
}

export async function calculateAndSavePlayoffGamesForTournament(tournamentId: string) {
  type Tuple = [
    groups: ExtendedGroupData[],
    games: ExtendedGameData[],
    playoffStages: ExtendedPlayoffRoundData[],
  ]
  const [groups, games, playoffStages ] = await Promise.all([
    findGroupsWithGamesAndTeamsInTournament(tournamentId),
    findGamesInTournament(tournamentId),
    findPlayoffStagesWithGamesInTournament(tournamentId),
    ]) as Tuple

  const firstPlayoffStage = playoffStages[0]
  const gameResults = await findGameResultByGameIds(games.map(game => game.id), true)
  const gamesMap = toMap(games)
  const gameResultMap = customToMap(gameResults, (result) => result.game_id)

  const calculatedTeamsPerGame = await calculatePlayoffTeams(tournamentId, firstPlayoffStage, groups, gamesMap, gameResultMap, {})
  return Promise.all(firstPlayoffStage.games.map(async (game) => {
    return updateGame(game.game_id, {
      home_team: calculatedTeamsPerGame[game.game_id]?.homeTeam?.team_id || null,
      away_team: calculatedTeamsPerGame[game.game_id]?.awayTeam?.team_id || null
    })
  }))
}

export async function getGroupDataWithGamesAndTeams(tournamentId: string) {
  return findGroupsWithGamesAndTeamsInTournament(tournamentId)
}

export async function calculateAllUsersGroupPositions(tournamentId: string) {
  const userGroupPairs = await findAllUserTournamentGroupsWithoutGuesses(tournamentId, false)
  const userIds = Array.from(new Set(userGroupPairs.map(pair => pair.user_id)))
  const groupIds = Array.from(new Set(userGroupPairs.map(pair => pair.tournament_group_id)))
  const guessesByUser: {[k:string]: {[y:string]: GameGuess}} = Object.fromEntries(
    await Promise.all(
      userIds.map(async (userId) => {
        const gameGuesses = await findGameGuessesByUserId(userId, tournamentId)
        const gameGuessesMap = customToMap(gameGuesses, (gameGuess) => gameGuess.game_id)
        return [
          userId,
          gameGuessesMap
        ]
      })
    ))
  const gamesByGroup: {[k:string]: Game[]} = Object.fromEntries(
    await Promise.all(
      groupIds.map(async (groupId) => [
        groupId,
        await findGamesInGroup(groupId, true, false)
      ])
    )
  )
  const teamsByGroup: {[k:string]: Team[]} = Object.fromEntries(
    await Promise.all(
      groupIds.map(async (groupId) => [
        groupId,
        await findTeamInGroup(groupId)
      ])
    )
  )
  const groupsById: { [k: string]: TournamentGroup } = Object.fromEntries(
    await Promise.all(
      groupIds.map(async (groupId) => [
        groupId,
        await findTournamentgroupById(groupId)
      ])
    ))
  return Promise.all(userGroupPairs
    .map(async ({user_id, tournament_group_id}) => {
    const groupGames: Game[] = gamesByGroup[tournament_group_id]
    const gameGuessesMap: {[k:string]: GameGuess} = guessesByUser[user_id]
    const teams = teamsByGroup[tournament_group_id]
    if(groupGames && gameGuessesMap && teams) {
      const guessedPositions = calculateGroupPosition(
        teams.map(team => team.id),
        groupGames.map(game => ({
          ...game,
          resultOrGuess: gameGuessesMap[game.id]
        })),
        groupsById[tournament_group_id].sort_by_games_between_teams
        ).map((teamStat, index) => ({
            user_id,
            tournament_group_id,
            position: index,
            ...teamStat
          }))
      return updateOrCreateTournamentGroupTeamGuesses(guessedPositions)
    }
  }))
}

export async function recalculateAllPlayoffFirstRoundGameGuesses(tournamentId: string) {
  const users = await db.selectFrom('users').select('id').execute();
  const updatedPlayoffGamesForUsers = await Promise.all(users.map(async (user) => {
    return updatePlayoffGameGuesses(tournamentId, user)
  }))
  return updatedPlayoffGamesForUsers
    .map(updatedPlayoffGamesForUsers => updatedPlayoffGamesForUsers?.filter(gameGuess => !!gameGuess) || [])
    .filter(updatedPlayoffGamesForUser => updatedPlayoffGamesForUser.length > 0)
}

export async function calculateGameScores(forceDrafts: boolean, forceAllGuesses: boolean) {
  const gamesWithResultAndGuesses = await findAllGamesWithPublishedResultsAndGameGuesses(forceDrafts, forceAllGuesses)
  const gameGuessesToClean = await findAllGuessesForGamesWithResultsInDraft()

  // Cache tournaments by ID
  const tournamentsMap = new Map<string, any>();

  const updatedGameGuesses = await Promise.all(gamesWithResultAndGuesses.map(async (game) => {
    // Get or cache tournament
    if (!tournamentsMap.has(game.tournament_id)) {
      const tournament = await findTournamentById(game.tournament_id);
      if (tournament) {
        tournamentsMap.set(game.tournament_id, tournament);
      }
    }
    const tournament = tournamentsMap.get(game.tournament_id);
    if (!tournament) {
      throw new Error(`Tournament ${game.tournament_id} not found`);
    }

    // Extract scoring config
    const scoringConfig = {
      game_exact_score_points: tournament.game_exact_score_points ?? 2,
      game_correct_outcome_points: tournament.game_correct_outcome_points ?? 1,
    };

    const gameGuesses = game.gameGuesses
    return Promise.all(gameGuesses.map(gameGuess => {
      // Calculate base score with config
      const baseScore = calculateScoreForGame(game, gameGuess, scoringConfig)

      // Boost type is already in gameGuess.boost_type
      return updateGameGuessWithBoost(gameGuess.id, baseScore, gameGuess.boost_type ?? null)
    }))
  }))

  const cleanedGameGuesses = await Promise.all(gameGuessesToClean.map(async (gameGuess) => {
    // Clear score, final_score, and boost_multiplier to avoid orphaned boost points
    return updateGameGuess(gameGuess.id, {
      score: null,
      final_score: null,
      boost_multiplier: null
    } as any)
  }))

  return {updatedGameGuesses, cleanedGameGuesses}
}

export async function calculateAndStoreGroupPosition(group_id: string, teamIds: string[], groupGames: ExtendedGameData[], sortByGamesBetweenTeams: boolean) {
  const groupPositions: TournamentGroupTeamNew[] = calculateGroupPosition(
    teamIds,
    groupGames.map(game => ({
      ...game,
      resultOrGuess: game.gameResult
    })),
    sortByGamesBetweenTeams)
      .map((teamPosition, index) => ({
        ...teamPosition,
        tournament_group_id: group_id,
        position: index
      }))
  await updateTournamentGroupTeams(groupPositions)
}

export async function calculateAndStoreQualifiedTeamsPoints(tournamentId: string) {
  const users = await db.selectFrom('users').select('id').execute();
  const allQualifiedTeams = await findQualifiedTeams(tournamentId)

  return Promise.all(users.map(async (user) => {
    try{
      const userQualifiedTeams = await findGuessedQualifiedTeams(tournamentId, user.id)
      if(user.id === '45bd6e70-ed7b-41b6-a860-e05b5a19deb3') {
        // console.log(userQualifiedTeams) - removed for production
        // console.log(allQualifiedTeams) - removed for production
      }
      const correctGuesses = userQualifiedTeams.filter(team => allQualifiedTeams.find(allTeam => allTeam.id === team.id))
      const updatedTournamentGuess = await updateTournamentGuessByUserIdTournamentWithSnapshot(user.id, tournamentId, {
        qualified_teams_score: correctGuesses.length
      })
      
      return updatedTournamentGuess || {status: 'warning', warning: 'No tournament guess found for user ' + user.id}

    } catch (e) {
      console.error(e)
      return {error: 'Error calculating qualified teams points for user ' + user.id}
    }
  }))
}

export async function findDataForAwards(tournamentId: string) {
  const [tournament, players] =
    await Promise.all([findTournamentById(tournamentId), findAllPlayersInTournamentWithTeamData(tournamentId)])

  const {id: _id, theme: _theme, short_name: _short_name, long_name: _long_name, is_active: _is_active, ...tournamentUpdate} = tournament || {}

  return {
    tournamentUpdate,
    players
  }
}

export async function updateTournamentAwards(tournamentId: string, withUpdate: TournamentUpdate) {
  //Store and Calculate score for all users if not empty
  await updateTournament(tournamentId, withUpdate)

  // Get tournament for scoring config
  const tournament = await findTournamentById(tournamentId);
  if (!tournament) {
    throw new Error(`Tournament ${tournamentId} not found`);
  }

  const individual_award_points = tournament.individual_award_points ?? 3;
  const allTournamentGuesses = await findTournamentGuessByTournament(tournamentId)

  return await Promise.all(allTournamentGuesses.map(async (tournamentGuess) => {
    const awardsScore = awardsDefinition.reduce((accumScore, awardDefinition) => {
      if (withUpdate[awardDefinition.property]) {
        if (tournamentGuess[awardDefinition.property] === withUpdate[awardDefinition.property]) {
          return accumScore + individual_award_points
        }
      }
      return accumScore
    }, 0)
    return await updateTournamentGuessWithSnapshot(tournamentGuess.id, {
      individual_awards_score: awardsScore
    })
  }))
}

export async function updateTournamentHonorRoll(tournamentId: string, withUpdate: TournamentUpdate) {
  //Store and calculate score for all users if the honor roll is not empty
  await updateTournament(tournamentId, withUpdate)

  // Get tournament for scoring config
  const tournament = await findTournamentById(tournamentId);
  if (!tournament) {
    throw new Error(`Tournament ${tournamentId} not found`);
  }

  const champion_points = tournament.champion_points ?? 5;
  const runner_up_points = tournament.runner_up_points ?? 3;
  const third_place_points = tournament.third_place_points ?? 1;

  if(withUpdate.champion_team_id || withUpdate.runner_up_team_id || withUpdate.third_place_team_id) {
    const allTournamentGuesses = await findTournamentGuessByTournament(tournamentId)
    return await Promise.all(allTournamentGuesses.map(async (tournamentGuess) => {
      let honorRollScore = 0
      if(withUpdate.champion_team_id &&
        tournamentGuess.champion_team_id === withUpdate.champion_team_id) {
        honorRollScore += champion_points
      }
      if(withUpdate.runner_up_team_id &&
        tournamentGuess.runner_up_team_id === withUpdate.runner_up_team_id) {
        honorRollScore += runner_up_points
      }
      if(withUpdate.third_place_team_id &&
        tournamentGuess.third_place_team_id === withUpdate.third_place_team_id) {
        honorRollScore += third_place_points
      }
      return await updateTournamentGuessWithSnapshot(tournamentGuess.id, {
        honor_roll_score: honorRollScore
      })
    }))
  }
}

/**
 * Creates a complete copy of a tournament including all related data
 * @param tournamentId - The ID of the tournament to copy
 * @param longName - Optional custom long name for the new tournament
 * @param shortName - Optional custom short name for the new tournament
 * @returns The newly created tournament
 */
export async function copyTournament(
  tournamentId: string,
  newStartDate?: Date,
  longName?: string,
  shortName?: string
): Promise<Tournament> {
  const user = await getLoggedInUser();

  // Check if user is admin
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Only administrators can copy tournaments');
  }

  // Validate newStartDate if provided
  if (newStartDate && Number.isNaN(newStartDate.getTime())) {
    throw new Error('Invalid start date provided');
  }

  // Get the original tournament
  const originalTournament = await findTournamentById(tournamentId);
  if (!originalTournament) {
    throw new Error('Tournament not found');
  }

  // Create a new tournament with modified name
  const newTournament = await createTournament({
    long_name: longName || `${originalTournament.long_name} - Copy`,
    short_name: shortName || `${originalTournament.short_name} - Copy`,
    theme: originalTournament.theme && JSON.stringify(originalTournament.theme) || undefined,
    is_active: false, // Start as inactive to prevent access during setup
    dev_only: originalTournament.dev_only || false,
    display_name: originalTournament.display_name || false,
    // Copy scoring configuration
    game_exact_score_points: originalTournament.game_exact_score_points,
    game_correct_outcome_points: originalTournament.game_correct_outcome_points,
    champion_points: originalTournament.champion_points,
    runner_up_points: originalTournament.runner_up_points,
    third_place_points: originalTournament.third_place_points,
    individual_award_points: originalTournament.individual_award_points,
    qualified_team_points: originalTournament.qualified_team_points,
    exact_position_qualified_points: originalTournament.exact_position_qualified_points,
    max_silver_games: originalTournament.max_silver_games,
    max_golden_games: originalTournament.max_golden_games
  });

  // Copy teams association
  const teamsInTournament = await findTeamInTournament(tournamentId);
  await Promise.all(teamsInTournament.map(team =>
    createTournamentTeam({
      tournament_id: newTournament.id,
      team_id: team.id
    })
  ));

  // Copy players
  const playersInTournament = await findAllPlayersInTournamentWithTeamData(tournamentId);
  await Promise.all(playersInTournament.map(player =>
    createPlayer({
      tournament_id: newTournament.id,
      team_id: player.team_id,
      name: player.name,
      age_at_tournament: player.age_at_tournament,
      position: player.position
    })
  ));

  // Copy venues
  const venues = await findAllTournamentVenues(tournamentId);
  await Promise.all(venues.map(venue =>
    createTournamentVenue({
      tournament_id: newTournament.id,
      name: venue.name,
      location: venue.location,
      picture_url: venue.picture_url
    })
  ));

  // Calculate date offset if newStartDate is provided
  let dateOffsetMs = 0;
  if (newStartDate) {
    const allGames = await findGamesInTournament(tournamentId);
    if (allGames.length > 0) {
      // Find first game date
      const firstGameDate = allGames
        .map(g => g.game_date)
        .sort((a, b) => a.getTime() - b.getTime())[0];

      // Calculate offset in milliseconds
      dateOffsetMs = newStartDate.getTime() - firstGameDate.getTime();
    }
  }

  // Helper function to shift dates
  const shiftDate = (originalDate: Date): Date => {
    if (dateOffsetMs === 0) return new Date(originalDate);
    return new Date(originalDate.getTime() + dateOffsetMs);
  };

  // Copy playoff rounds
  const playoffStages = await findPlayoffStagesWithGamesInTournament(tournamentId);
  const playoffStageIdMap = new Map<string, string>();

  await Promise.all(playoffStages.map(async (stage) => {
    const newStage = await createPlayoffRound({
      tournament_id: newTournament.id,
      round_name: stage.round_name,
      round_order: stage.round_order,
      total_games: stage.total_games,
      is_final: stage.is_final,
      is_third_place: stage.is_third_place,
      is_first_stage: stage.is_first_stage
    });

    playoffStageIdMap.set(stage.id, newStage.id);
  }))

  // Copy groups
  const groups = await findGroupsWithGamesAndTeamsInTournament(tournamentId);
  const groupIdMap = new Map<string, string>();

  await Promise.all(groups.map(async (group) => {
    const newGroup = await createTournamentGroup({
      tournament_id: newTournament.id,
      group_letter: group.group_letter,
      sort_by_games_between_teams: group.sort_by_games_between_teams || false
    });

    groupIdMap.set(group.id, newGroup.id);

    // Copy group teams
    await Promise.all(group.teams.map((teamAssoc, idx) =>
      createTournamentGroupTeam({
        tournament_group_id: newGroup.id,
        team_id: teamAssoc.team_id,
        position: idx + 1,
        games_played: 0,
        points: 0,
        win: 0,
        draw: 0,
        loss: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        conduct_score: 0,
        is_complete: false
      })))
  }))

  // Copy all games
  const games = await findGamesInTournament(tournamentId);
  const gameIdMap = new Map<string, string>();

  await Promise.all(games.map(async (game) => {
    const newGame: GameNew = {
      tournament_id: newTournament.id,
      game_number: game.game_number,
      home_team: game.home_team,
      away_team: game.away_team,
      game_date: shiftDate(game.game_date),
      location: game.location,
      game_type: game.game_type,
      game_local_timezone: game.game_local_timezone,
      home_team_rule: game.home_team_rule && JSON.stringify(game.home_team_rule) || undefined,
      away_team_rule: game.away_team_rule && JSON.stringify(game.away_team_rule) || undefined
    };

    const createdGame = await createGame(newGame);
    gameIdMap.set(game.id, createdGame.id);

    // Do not copy game results
  }))

  // Helper function to associate games with entities (groups or playoff stages)
  async function associateGamesWithEntities<T extends { id: string; games: Array<{ game_id: string }> }>(
    entities: T[],
    entityIdMap: Map<string, string>,
    gameIdMap: Map<string, string>,
    createAssociation: (_entityId: string, _gameId: string) => Promise<any>
  ): Promise<void> {
    const associations = entities.flatMap(entity =>
      entity.games.flatMap(gameAssoc => {
        const newEntityId = entityIdMap.get(entity.id);
        const newGameId = gameIdMap.get(gameAssoc.game_id);

        if (newEntityId && newGameId) {
          return [createAssociation(newEntityId, newGameId)];
        }
        return [];
      })
    );

    await Promise.all(associations);
  }

  // Associate games with groups
  await associateGamesWithEntities(
    groups,
    groupIdMap,
    gameIdMap,
    (groupId, gameId) => createTournamentGroupGame({
      tournament_group_id: groupId,
      game_id: gameId
    })
  );

  // Associate games with playoff stages
  await associateGamesWithEntities(
    playoffStages,
    playoffStageIdMap,
    gameIdMap,
    (stageId, gameId) => createPlayoffRoundGame({
      tournament_playoff_round_id: stageId,
      game_id: gameId
    })
  );

  // Copy third-place rules
  const thirdPlaceRules = await findThirdPlaceRulesByTournament(tournamentId);
  await Promise.all(thirdPlaceRules.map(rule =>
    createThirdPlaceRule({
      tournament_id: newTournament.id,
      combination_key: rule.combination_key,
      rules: JSON.stringify(rule.rules)
    })
  ));

  // Do not activate the tournament automatically
  return newTournament;
}

/**
 * Calculates and stores the group position score for each user in a tournament.
 * Awards 1 point for each team whose guessed position matches the real position in a group (when both are complete).
 */
export async function calculateAndStoreGroupPositionScores(tournamentId: string) {
  // Get all users who have guesses for this tournament
  const users = await db.selectFrom('users').select('id').execute();
  // Get all groups in the tournament
  const groups = await findGroupsInTournament(tournamentId);

  // Get tournament for scoring config
  const tournament = await findTournamentById(tournamentId);
  if (!tournament) {
    throw new Error(`Tournament ${tournamentId} not found`);
  }

  const qualified_team_points = tournament.qualified_team_points ?? 1;
  const exact_position_qualified_points = tournament.exact_position_qualified_points ?? 1;

  // Get ALL qualified teams for this tournament
  const qualifiedTeams = await findQualifiedTeams(tournamentId);
  const qualifiedTeamIds = new Set(qualifiedTeams.map(t => t.id));

  // For each user, calculate their score
  await Promise.all(users.map(async (user) => {
    let totalScore = 0;
    for (const group of groups) {
      // Get the actual group positions (only if group is complete)
      const realPositions = await findTeamsInGroup(group.id);
      const groupIsComplete = realPositions.length > 0 && realPositions.every((t) => t.is_complete);
      if (!groupIsComplete) continue;
      // Get the user's guesses for this group (only if guess is complete)
      const userGuesses = await findAllTournamentGroupTeamGuessInGroup(user.id, group.id);
      const guessIsComplete = userGuesses.length > 0 && userGuesses.every((t) => t.is_complete);
      if (!guessIsComplete) continue;

      // NEW SCORING LOGIC: Qualification-aware scoring
      for (const real of realPositions) {
        const teamQualified = qualifiedTeamIds.has(real.team_id);
        const userGuess = userGuesses.find((g: any) => g.team_id === real.team_id);

        if (!userGuess) continue;

        if (teamQualified) {
          // Team qualified - check position accuracy
          if (userGuess.position === real.position) {
            // Exact position + qualified
            totalScore += exact_position_qualified_points;
          } else {
            // Qualified but wrong position
            totalScore += qualified_team_points;
          }
        }
        // If team didn't qualify: 0 points (even if position was correct)
      }
    }
    // Store the score in tournament_guesses
    await updateTournamentGuessByUserIdTournamentWithSnapshot(user.id, tournamentId, {
      group_position_score: totalScore
    });
  }));
}

/**
 * Updates conduct scores for teams in a tournament group
 * Requires admin access
 */
export async function updateGroupTeamConductScores(
  groupId: string,
  conductScores: { [teamId: string]: number }
) {
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }

  const { updateTeamConductScores } = await import('../db/tournament-group-repository');
  await updateTeamConductScores(conductScores, groupId);
}

/**
 * Get all users with permission data for a tournament
 */
export async function getTournamentPermissionData(tournamentId: string) {
  const [allUsers, permittedUserIds] = await Promise.all([
    findAllUsers(),
    findUserIdsForTournament(tournamentId)
  ])

  return {
    allUsers: allUsers.map(u => ({
      id: u.id,
      email: u.email,
      nickname: u.nickname,
      isAdmin: u.is_admin || false
    })),
    permittedUserIds
  }
}

/**
 * Update tournament view permissions
 */
export async function updateTournamentPermissions(
  tournamentId: string,
  userIds: string[]
) {
  // Remove all existing permissions and add new ones
  await removeAllTournamentPermissions(tournamentId)
  await addUsersToTournament(tournamentId, userIds)

  revalidatePath('/backoffice')
  revalidatePath('/tournaments/[id]', 'layout')
}
