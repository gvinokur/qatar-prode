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
  createPlayer,
  findAllPlayersInTournamentWithTeamData,
  findPlayerByTeamAndTournament,
  updatePlayer
} from "../db/player-repository";
import {ExtendedGameData, ExtendedGroupData, ExtendedPlayoffRoundData} from "../definitions";
import {
  createGameResult,
  findGameResultByGameId,
  findGameResultByGameIds,
  updateGameResult
} from "../db/game-result-repository";
import {calculatePlayoffTeams} from "../utils/playoff-teams-calculator";
import {findAllUserTournamentGroupsWithoutGuesses, findAllTournamentGroupTeamGuessInGroup} from "../db/tournament-group-team-guess-repository";
import {
  findAllGuessesForGamesWithResultsInDraft,
  findGameGuessesByUserId,
  updateGameGuess
} from "../db/game-guess-repository";
import {calculateGroupPosition} from "../utils/group-position-calculator";
import {updateOrCreateTournamentGroupTeamGuesses, updatePlayoffGameGuesses} from "./guesses-actions";
import {customToMap, toMap} from "../utils/ObjectUtils";
import {db} from "../db/database";
import {calculateScoreForGame} from "../utils/game-score-calculator";
import {
  findTournamentGuessByTournament,
  updateTournamentGuess,
  updateTournamentGuessByUserIdTournament
} from "../db/tournament-guess-repository";
import {awardsDefinition} from "../utils/award-utils";
import {getLoggedInUser} from "./user-actions";

export async function deleteDBTournamentTree(tournament: Tournament) {
  // delete from tournament_playoff_round_games ;
  // delete from tournament_group_games;
  // TODO: Delete GameGuesses
  // delete from games;
  await deleteAllGamesFromTournament(tournament.id);
  // delete from tournament_playoff_rounds;
  await deleteAllPlayoffRoundsInTournament(tournament.id);
  // delete from tournament_group_teams;
  // delete from tournament_groups;
  await deleteAllGroupsFromTournament(tournament.id);
  // delete from tournament_teams;
  await deleteTournamentTeams(tournament.id)
  // TODO: Remove Groups
  // delete from tournaments
  await deleteTournament(tournament.id)
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
      } catch (e) {
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

  const calculatedTeamsPerGame = calculatePlayoffTeams(firstPlayoffStage, groups, gamesMap, gameResultMap, {})
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
  const updatedGameGuesses = await Promise.all(gamesWithResultAndGuesses.map(game => {
    const gameGuesses = game.gameGuesses
    return Promise.all(gameGuesses.map(gameGuess => {
      const score = calculateScoreForGame(game, gameGuess)
      return updateGameGuess(gameGuess.id, {
        score
      })
    }))
  }))
  const cleanedGameGuesses = await Promise.all(gameGuessesToClean.map(async (gameGuess) => {
    return updateGameGuess(gameGuess.id, {
      // @ts-ignore - setting to null to remove value
      score: null
    })
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
    const userQualifiedTeams = await findGuessedQualifiedTeams(tournamentId, user.id)
    const correctGuesses = userQualifiedTeams.filter(team => allQualifiedTeams.find(allTeam => allTeam.id === team.id))

    return await updateTournamentGuessByUserIdTournament(user.id, tournamentId, {
      qualified_teams_score: correctGuesses.length
    })
  }))
}

export async function findDataForAwards(tournamentId: string) {
  const [{id: _id, theme: _theme, short_name: _short_name, long_name: _long_name, is_active: _is_active, ...tournamentUpdate}, players] =
    await Promise.all([findTournamentById(tournamentId), findAllPlayersInTournamentWithTeamData(tournamentId)])

  return {
    tournamentUpdate,
    players
  }
}

export async function updateTournamentAwards(tournamentId: string, withUpdate: TournamentUpdate) {
  //Store and Calculate score for all users if not empty
  await updateTournament(tournamentId, withUpdate)
  const allTournamentGuesses = await findTournamentGuessByTournament(tournamentId)
  return await Promise.all(allTournamentGuesses.map(async (tournamentGuess) => {
    const awardsScore = awardsDefinition.reduce((accumScore, awardDefinition) => {
      if (withUpdate[awardDefinition.property]) {
        if (tournamentGuess[awardDefinition.property] === withUpdate[awardDefinition.property]) {
          return accumScore + 3
        }
      }
      return accumScore
    }, 0)
    return await updateTournamentGuess(tournamentGuess.id, {
      individual_awards_score: awardsScore
    })
  }))
}

export async function updateTournamentHonorRoll(tournamentId: string, withUpdate: TournamentUpdate) {
  //Store and calculate score for all users if the honor roll is not empty
  await updateTournament(tournamentId, withUpdate)
  if(withUpdate.champion_team_id || withUpdate.runner_up_team_id || withUpdate.third_place_team_id) {
    const allTournamentGuesses = await findTournamentGuessByTournament(tournamentId)
    return await Promise.all(allTournamentGuesses.map(async (tournamentGuess) => {
      let honorRollScore = 0
      if(withUpdate.champion_team_id &&
        tournamentGuess.champion_team_id === withUpdate.champion_team_id) {
        honorRollScore += 5
      }
      if(withUpdate.runner_up_team_id &&
        tournamentGuess.runner_up_team_id === withUpdate.runner_up_team_id) {
        honorRollScore += 3
      }
      if(withUpdate.third_place_team_id &&
        tournamentGuess.third_place_team_id === withUpdate.third_place_team_id) {
        honorRollScore += 1
      }
      return await updateTournamentGuess(tournamentGuess.id, {
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
  longName?: string,
  shortName?: string
): Promise<Tournament> {
  const user = await getLoggedInUser();

  // Check if user is admin
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Only administrators can copy tournaments');
  }

  // Get the original tournament
  const originalTournament = await findTournamentById(tournamentId);
  if (!originalTournament) {
    throw new Error('Tournament not found');
  }

  // Create a new tournament with modified name
  const newTournament = await createTournament({
    long_name: longName || `${originalTournament.long_name} - copy`,
    short_name: shortName || `${originalTournament.short_name} - copy`,
    theme: originalTournament.theme && JSON.stringify(originalTournament.theme) || undefined,
    is_active: false, // Start as inactive to prevent access during setup
    dev_only: true // Mark as dev_only by default for safety
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
      game_date: new Date(game.game_date),
      location: game.location,
      game_type: game.game_type,
      home_team_rule: game.home_team_rule && JSON.stringify(game.home_team_rule) || undefined,
      away_team_rule: game.away_team_rule && JSON.stringify(game.away_team_rule) || undefined
    };

    const createdGame = await createGame(newGame);
    gameIdMap.set(game.id, createdGame.id);

    // Do not copy game results
  }))

  // Associate games with groups and playoff stages
  await Promise.all(groups.flatMap(group =>
    group.games.map(async gameAssoc => {
      const newGroupId = groupIdMap.get(group.id);
      const newGameId = gameIdMap.get(gameAssoc.game_id);

      if (newGroupId && newGameId) {
        await createTournamentGroupGame({
          tournament_group_id: newGroupId,
          game_id: newGameId
        });
      }
      return Promise.resolve();
    })).filter(p => p !== undefined))

  // Associate games with playoff stages
  await Promise.all(playoffStages.flatMap(stage =>
    stage.games.map(gameAssoc => {
      const newStageId = playoffStageIdMap.get(stage.id);
      const newGameId = gameIdMap.get(gameAssoc.game_id);

      if (newStageId && newGameId) {
        return createPlayoffRoundGame({
          tournament_playoff_round_id: newStageId,
          game_id: newGameId
        });
      }
      return Promise.resolve(); // For cases where IDs aren't found
    })
  ).filter(p => p !== undefined));

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
      // Compare positions
      for (let i = 0; i < realPositions.length; i++) {
        const real = realPositions[i];
        const guess = userGuesses.find((g: any) => g.team_id === real.team_id);
        if (guess && guess.position === real.position) {
          totalScore += 1;
        }
      }
    }
    // Store the score in tournament_guesses
    await updateTournamentGuessByUserIdTournament(user.id, tournamentId, {
      group_position_score: totalScore
    });
  }));
}
