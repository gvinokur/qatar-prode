'use server'

import tournaments from "../../data/tournaments";
import { getTranslations, getLocale } from 'next-intl/server';
import type { Locale } from '../../i18n.config';
import { applyLocalization } from '../utils/localization-helper';
import {
  createTournament,
  createTournamentTeam,
  deleteTournament, deleteTournamentTeams, findTournamentById,
  findTournamentByName, updateTournament
} from "../db/tournament-repository";
import {
  createTeam,
  findTeamInTournament,
  findTeamsByIds,
  getTeamByName
} from "../db/team-repository";
import {
  createTournamentGroup,
  createTournamentGroupGame,
  createTournamentGroupTeam,
  deleteAllGroupsFromTournament,
  findGroupsWithGamesAndTeamsInTournament,
  findTeamsInGroup,
  updateTournamentGroupTeams
} from "../db/tournament-group-repository";
import {
  createPlayoffRound,
  createPlayoffRoundGame,
  deleteAllPlayoffRoundsInTournament, findPlayoffStagesWithGamesInTournament
} from "../db/tournament-playoff-repository";
import {
  GameNew,
  PlayerNew,
  Team,
  Tournament,
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
  updateGameResult,
  deleteAllGameResultsByTournamentId
} from "../db/game-result-repository";
import {calculatePlayoffTeams} from "../utils/playoff-teams-calculator";
import {getGameWinner, getGameLoser} from "../utils/score-utils";
import {isTeamWinnerRule} from "../utils/playoffs-rule-helper";
import {isGameResultPublishable} from "../utils/game-result-utils";
import {
  findAllGuessesForGamesWithResultsInDraft,
  updateGameGuess,
  updateGameGuessWithBoost,
  deleteAllGameGuessesByTournamentId
} from "../db/game-guess-repository";
import {calculateGroupPosition} from "../utils/group-position-calculator";
import {updatePlayoffGameGuesses} from "./guesses-actions";
import {customToMap, toMap} from "../utils/ObjectUtils";
import {db} from "../db/database";
import {calculateScoreForGame} from "../utils/game-score-calculator";
import {
  findTournamentGuessByTournament,
  updateTournamentGuess,
  deleteAllTournamentGuessesByTournamentId,
  recalculateGameScoresForUsers
} from "../db/tournament-guess-repository";
import {
  deleteAllTournamentGroupPositionsPredictions
} from "../db/qualified-teams-repository";
import {awardsDefinition} from "../utils/award-utils";
import {getLoggedInUser} from "./user-actions";
import { revalidatePath } from 'next/cache';
import { findAllUsers } from '../db/users-repository';
import {
  findUserIdsForTournament,
  addUsersToTournament,
  removeAllTournamentPermissions
} from '../db/tournament-view-permission-repository';
import {writeScoreSnapshot} from '../db/score-history-repository';
import {getTodayYYYYMMDD} from '../utils/date-utils';
import {recalculateGroupRankingsForUsers} from './group-ranking-actions';
import {findRecentUnscoredGames} from '../db/quick-score-repository';
import {calculateAndStoreQualifiedTeamsScores} from './qualified-teams-scoring-actions';


export async function deleteDBTournamentTree(tournament: Tournament, locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'backoffice' });
  const user = await getLoggedInUser();

  // Authorization: Only admins can delete tournaments
  if (!user?.isAdmin) {
    throw new Error(t('tournament.deleteUnauthorized'));
  }

  // Safety check: Only allow deletion of deactivated tournaments
  if (tournament.is_active) {
    throw new Error(t('tournament.cannotDeleteActive'));
  }

  revalidatePath(`/tournaments/${tournament.id}/backoffice`);

  // Clear foreign key references to prevent constraint violations during deletion
  await updateTournament(tournament.id, {
    best_player_id: null,
    best_goalkeeper_player_id: null,
    top_goalscorer_player_id: null,
    best_young_player_id: null,
    champion_team_id: null,
    runner_up_team_id: null,
    third_place_team_id: null,
  });

  // Delete all related entities in reverse order of dependencies
  // User-related data
  await deleteAllGameGuessesByTournamentId(tournament.id);
  await deleteAllTournamentGuessesByTournamentId(tournament.id);
  await deleteAllTournamentGroupPositionsPredictions(tournament.id);

  // Tournament structure and content
  await deleteAllPlayersInTournament(tournament.id);
  await deleteAllTournamentVenues(tournament.id);
  await deleteThirdPlaceRulesByTournament(tournament.id);
  await deleteAllGameResultsByTournamentId(tournament.id);
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

/** Throws if the game result is being published but fails the publishable check. Draft saves are allowed. */
function assertPublishable(game: ExtendedGameData): void {
  if (!game.gameResult || game.gameResult.is_draft) return;
  const isPlayoff = !!game.playoffStage;
  if (!isGameResultPublishable(game.gameResult, isPlayoff)) {
    throw new Error(`Cannot publish incomplete result for game ${game.id}`)
  }
}

/** Processes a single game result update, queuing republish candidates separately. */
async function processGameResult(game: ExtendedGameData, changedPublishedGames: ExtendedGameData[]): Promise<void> {
  if (!game.gameResult) return;
  const existingResult = await findGameResultByGameId(game.id, true);
  if (existingResult) {
    // Amendment #1: If changing scores on a published result, handle specially
    const scoresChanged =
      existingResult.home_score !== game.gameResult.home_score ||
      existingResult.away_score !== game.gameResult.away_score ||
      existingResult.home_penalty_score !== game.gameResult.home_penalty_score ||
      existingResult.away_penalty_score !== game.gameResult.away_penalty_score;
    if (!existingResult.is_draft && scoresChanged) {
      // Step 1: Set to draft with NEW scores (marks for cleanup)
      await updateGameResult(game.id, { ...game.gameResult, is_draft: true });
      changedPublishedGames.push(game);
      return;
    }
    // Guard: prevent publishing an incomplete result
    assertPublishable(game);
    await updateGameResult(game.id, game.gameResult);
  } else {
    // Guard: prevent publishing an incomplete result
    assertPublishable(game);
    await createGameResult(game.gameResult);
  }
}

export async function saveGameResults(gamesWithResults: ExtendedGameData[]) {
  //Save all results first
  const changedPublishedGames: ExtendedGameData[] = [];
  await Promise.all(gamesWithResults.map(game => processGameResult(game, changedPublishedGames)));

  // If we changed scores on published results, trigger cleanup then republish
  if (changedPublishedGames.length > 0) {
    // Step 2: Cleanup old scores (processes draft results)
    await calculateGameScores(true, false);

    // Step 3: Republish with new scores (guard: scores already validated on first save)
    await Promise.all(changedPublishedGames.map(game => {
      assertPublishable(game);
      return updateGameResult(game.id, { ...game.gameResult, is_draft: false })
    }));

    // Step 4: Recalculate with new scores (processes published results)
    await calculateGameScores(false, false);
  }
}

export async function getRecentUnscoredGames(locale: string): Promise<{ games: ExtendedGameData[], teamsMap: Record<string, Team> }> {
  const t = await getTranslations({ locale, namespace: 'backoffice' });
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error(t('unauthorized'));
  }

  const games = await findRecentUnscoredGames(24);
  const localizedGames = games.map(game => applyLocalization(game, locale, [
    { field: 'location', i18nField: 'location_i18n' }
  ]));

  const uniqueTeamIds = [...new Set(
    localizedGames.flatMap(g => [g.home_team, g.away_team].filter(Boolean) as string[])
  )];

  const teams = await findTeamsByIds(uniqueTeamIds);
  const localizedTeams = teams.map(team => applyLocalization(team, locale, [
    { field: 'name', i18nField: 'name_i18n' }
  ]));
  const teamsMap: Record<string, Team> = Object.fromEntries(localizedTeams.map(t => [t.id, t]));

  return { games: localizedGames, teamsMap };
}

export async function saveGamesAndRecalculate(
  games: ExtendedGameData[],
  tournamentId: string,
  locale: string
): Promise<void> {
  const user = await getLoggedInUser();
  if (!user?.isAdmin) throw new Error('Unauthorized');

  await saveGameResults(games);

  const groupGame = games.find(g => g.group);
  if (groupGame) {
    const groupId = groupGame.group!.tournament_group_id;
    const [groupGames, groupTeams, tournament] = await Promise.all([
      findGamesInGroup(groupId, true, false),
      findTeamsInGroup(groupId),
      findTournamentById(tournamentId),
    ]);
    const teamIds = groupTeams.map(t => t.team_id);
    const sortByH2H = tournament?.tiebreaker_mode === 'head_to_head';
    await calculateAndStoreGroupPosition(groupId, teamIds, groupGames, sortByH2H);
    await calculateAndSavePlayoffGamesForTournament(tournamentId);
    await calculateAndStoreQualifiedTeamsScores(tournamentId, locale as Locale);
  }

  const hasPublishedPlayoffGame = games.some(g => g.playoffStage && g.gameResult && !g.gameResult.is_draft);
  if (hasPublishedPlayoffGame) {
    await calculateAndSavePlayoffGamesForTournament(tournamentId);
  }

  await calculateGameScores(false, false, locale as Locale);
}

export async function saveAndPublishSingleGameResult(game: ExtendedGameData, locale: string): Promise<void> {
  const t = await getTranslations({ locale, namespace: 'backoffice' });
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error(t('unauthorized'));
  }

  const publishedGame: ExtendedGameData = {
    ...game,
    gameResult: game.gameResult ? { ...game.gameResult, is_draft: false } : game.gameResult,
  };
  await saveGamesAndRecalculate([publishedGame], publishedGame.tournament_id, locale);
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

  // Build a lookup from game_number → game for TeamWinnerRule resolution
  const gamesByNumber: { [gameNumber: number]: ExtendedGameData } = Object.fromEntries(
    Object.values(gamesMap).map(g => [g.game_number, g])
  )

  // Keep both maps in sync after in-memory updates so subsequent stages see resolved teams
  const updateLocalGame = (gameId: string, gameNumber: number, homeTeam: string | null, awayTeam: string | null) => {
    const updated = { ...gamesMap[gameId], home_team: homeTeam, away_team: awayTeam }
    gamesMap[gameId] = updated
    gamesByNumber[gameNumber] = updated
  }

  // Stage 0: seed from group positions (existing logic)
  const calculatedTeamsPerGame = await calculatePlayoffTeams(tournamentId, firstPlayoffStage, groups, gamesMap, gameResultMap, {})
  await Promise.all(firstPlayoffStage.games.map(async ({ game_id }) => {
    const homeTeam = calculatedTeamsPerGame[game_id]?.homeTeam?.team_id || null
    const awayTeam = calculatedTeamsPerGame[game_id]?.awayTeam?.team_id || null
    updateLocalGame(game_id, gamesMap[game_id].game_number, homeTeam, awayTeam)
    return updateGame(game_id, { home_team: homeTeam, away_team: awayTeam })
  }))

  // Stages 1+: propagate actual winners from published results
  for (let i = 1; i < playoffStages.length; i++) {
    await Promise.all(playoffStages[i].games.map(async ({ game_id }) => {
      const game = gamesMap[game_id]
      const homeRule = game.home_team_rule
      const awayRule = game.away_team_rule

      if (!isTeamWinnerRule(homeRule) || !isTeamWinnerRule(awayRule)) return

      const homeSourceGame = gamesByNumber[homeRule.game]
      const awaySourceGame = gamesByNumber[awayRule.game]

      const homePublished = homeSourceGame?.gameResult && !homeSourceGame.gameResult.is_draft
      let homeTeam: string | null = null
      if (homePublished) {
        homeTeam = (homeRule.winner ? getGameWinner(homeSourceGame!) : getGameLoser(homeSourceGame!)) ?? null
      }

      const awayPublished = awaySourceGame?.gameResult && !awaySourceGame.gameResult.is_draft
      let awayTeam: string | null = null
      if (awayPublished) {
        awayTeam = (awayRule.winner ? getGameWinner(awaySourceGame!) : getGameLoser(awaySourceGame!)) ?? null
      }

      updateLocalGame(game_id, game.game_number, homeTeam, awayTeam)
      return updateGame(game_id, { home_team: homeTeam, away_team: awayTeam })
    }))
  }
}

export async function getGroupDataWithGamesAndTeams(tournamentId: string) {
  // Note: This function returns groups with only game_id and team_id arrays,
  // not full game/team objects, so no localization can be applied here.
  // Localization should be done where full objects are fetched.
  const [groups, tournament] = await Promise.all([
    findGroupsWithGamesAndTeamsInTournament(tournamentId),
    findTournamentById(tournamentId),
  ]);
  return {
    groups,
    // story #443: expose tournament-level tiebreaker mode for backoffice components
    tiebreakerMode: tournament?.tiebreaker_mode ?? 'standard',
  };
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

export async function calculateGameScores(forceDrafts: boolean, forceAllGuesses: boolean, locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
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
      throw new Error(t('notFound'));
    }

    // Extract scoring config
    const scoringConfig = {
      game_exact_score_points: tournament.game_exact_score_points ?? 3,
      game_correct_outcome_points: tournament.game_correct_outcome_points ?? 1,
      game_correct_goal_difference_points: tournament.game_correct_goal_difference_points ?? 2,
    };

    const gameGuesses = game.gameGuesses
    return Promise.all(gameGuesses.map(gameGuess => {
      // Calculate base score and tier with config
      const { score: baseScore, tier } = calculateScoreForGame(game, gameGuess, scoringConfig)

      // Boost type is already in gameGuess.boost_type
      return updateGameGuessWithBoost(gameGuess.id, baseScore, gameGuess.boost_type ?? null, tier)
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

  // NEW: Materialize scores for affected users (Story #147)
  // Group by tournament for efficient batching
  const usersByTournament = new Map<string, Set<string>>();

  // Add users from games with published results
  for (const game of gamesWithResultAndGuesses) {
    if (!usersByTournament.has(game.tournament_id)) {
      usersByTournament.set(game.tournament_id, new Set());
    }
    game.gameGuesses.forEach(guess => {
      usersByTournament.get(game.tournament_id)!.add(guess.user_id);
    });
  }

  // Add users from cleaned game guesses (unpublished/draft results)
  // These users also need rematerialization since their scores changed
  const validCleanedGuesses = cleanedGameGuesses.filter(g => g != null);
  if (validCleanedGuesses.length > 0) {
    // Get unique game IDs from cleaned guesses
    const cleanedGameIds = [...new Set(validCleanedGuesses.map(g => g.game_id))];

    // Fetch games to get tournament IDs
    const cleanedGames = await db
      .selectFrom('games')
      .where('id', 'in', cleanedGameIds)
      .select(['id', 'tournament_id'])
      .execute();

    const gameIdToTournamentId = customToMap(cleanedGames, g => g.id);

    // Add cleaned guess users to their tournaments
    validCleanedGuesses.forEach(guess => {
      const game = gameIdToTournamentId[guess.game_id];
      if (!game) return;

      if (!usersByTournament.has(game.tournament_id)) {
        usersByTournament.set(game.tournament_id, new Set());
      }
      usersByTournament.get(game.tournament_id)!.add(guess.user_id);
    });
  }

  // Materialize scores for each tournament
  await Promise.all(
    Array.from(usersByTournament.entries()).map(([tournamentId, userIds]) =>
      recalculateGameScoresForUsers(Array.from(userIds), tournamentId)
    )
  );

  // Recalculate group rank snapshots for affected users (Story #315)
  await Promise.all(
    Array.from(usersByTournament.entries()).map(([tournamentId, userIds]) =>
      recalculateGroupRankingsForUsers(tournamentId, Array.from(userIds))
    )
  );

  return {updatedGameGuesses, cleanedGameGuesses}
}

export async function calculateAndStoreGroupPosition(group_id: string, teamIds: string[], groupGames: ExtendedGameData[], sortByGamesBetweenTeams: boolean) {
  const currentTeamStats = await findTeamsInGroup(group_id)
  const conductScores: Record<string, number> = Object.fromEntries(
    currentTeamStats.map(t => [t.team_id, t.conduct_score ?? 0])
  )

  const groupPositions: TournamentGroupTeamNew[] = calculateGroupPosition(
    teamIds,
    groupGames.map(game => ({
      ...game,
      resultOrGuess: game.gameResult
    })),
    sortByGamesBetweenTeams,
    conductScores)
      .map((teamPosition, index) => ({
        ...teamPosition,
        tournament_group_id: group_id,
        position: index
      }))
  await updateTournamentGroupTeams(groupPositions)
}

export async function findDataForAwards(tournamentId: string) {
  const locale = await getLocale()
  const [tournament, players] =
    await Promise.all([findTournamentById(tournamentId), findAllPlayersInTournamentWithTeamData(tournamentId)])

  const {id: _id, theme: _theme, short_name: _short_name, long_name: _long_name, is_active: _is_active, short_name_i18n: _short_name_i18n, long_name_i18n: _long_name_i18n, locations: _locations, ...tournamentUpdate} = tournament || {}

  // Localize team objects within players
  const localizedPlayers = players.map(player => ({
    ...player,
    team: applyLocalization(player.team, locale, [
      { field: 'name', i18nField: 'name_i18n' }
    ])
  }));

  return {
    tournamentUpdate,
    players: localizedPlayers
  }
}

export async function updateTournamentAwards(tournamentId: string, withUpdate: TournamentUpdate, locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  //Store and Calculate score for all users if not empty
  await updateTournament(tournamentId, withUpdate)

  // Get tournament for scoring config
  const tournament = await findTournamentById(tournamentId);
  if (!tournament) {
    throw new Error(t('notFound'));
  }

  const individual_award_points = tournament.individual_award_points ?? 3;
  const allTournamentGuesses = await findTournamentGuessByTournament(tournamentId)

  const results = await Promise.all(allTournamentGuesses.map(async (tournamentGuess) => {
    const awardsScore = awardsDefinition.reduce((accumScore, awardDefinition) => {
      if (withUpdate[awardDefinition.property]) {
        if (tournamentGuess[awardDefinition.property] === withUpdate[awardDefinition.property]) {
          return accumScore + individual_award_points
        }
      }
      return accumScore
    }, 0)
    const updatedGuess = await updateTournamentGuess(tournamentGuess.id, {
      individual_awards_score: awardsScore
    })
    if (updatedGuess) {
      await writeScoreSnapshot({
        user_id: tournamentGuess.user_id,
        tournament_id: tournamentId,
        snapshot_date: getTodayYYYYMMDD(),
        total_game_score: updatedGuess.total_game_score ?? 0,
        total_boost_bonus: updatedGuess.total_boost_bonus ?? 0,
        honor_roll_score: updatedGuess.honor_roll_score ?? 0,
        individual_awards_score: updatedGuess.individual_awards_score ?? 0,
        qualified_teams_score: updatedGuess.qualified_teams_score ?? 0,
        group_position_score: updatedGuess.group_position_score ?? 0,
      });
    }
    return updatedGuess
  }))

  // Recalculate group rank snapshots for all tournament participants (Story #315)
  const affectedUserIds = allTournamentGuesses.map(g => g.user_id);
  await recalculateGroupRankingsForUsers(tournamentId, affectedUserIds);

  return results
}

export async function updateTournamentHonorRoll(tournamentId: string, withUpdate: TournamentUpdate, locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  //Store and calculate score for all users if the honor roll is not empty
  await updateTournament(tournamentId, withUpdate)

  // Get tournament for scoring config
  const tournament = await findTournamentById(tournamentId);
  if (!tournament) {
    throw new Error(t('notFound'));
  }

  const champion_points = tournament.champion_points ?? 5;
  const runner_up_points = tournament.runner_up_points ?? 3;
  const third_place_points = tournament.third_place_points ?? 1;

  if(withUpdate.champion_team_id || withUpdate.runner_up_team_id || withUpdate.third_place_team_id) {
    const allTournamentGuesses = await findTournamentGuessByTournament(tournamentId)
    const results = await Promise.all(allTournamentGuesses.map(async (tournamentGuess) => {
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
      const updatedGuess = await updateTournamentGuess(tournamentGuess.id, {
        honor_roll_score: honorRollScore
      })
      if (updatedGuess) {
        await writeScoreSnapshot({
          user_id: tournamentGuess.user_id,
          tournament_id: tournamentId,
          snapshot_date: getTodayYYYYMMDD(),
          total_game_score: updatedGuess.total_game_score ?? 0,
          total_boost_bonus: updatedGuess.total_boost_bonus ?? 0,
          honor_roll_score: updatedGuess.honor_roll_score ?? 0,
          individual_awards_score: updatedGuess.individual_awards_score ?? 0,
          qualified_teams_score: updatedGuess.qualified_teams_score ?? 0,
          group_position_score: updatedGuess.group_position_score ?? 0,
        });
      }
      return updatedGuess
    }))

    // Recalculate group rank snapshots for all tournament participants (Story #315)
    const affectedUserIds = allTournamentGuesses.map(g => g.user_id);
    await recalculateGroupRankingsForUsers(tournamentId, affectedUserIds);

    return results
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
  shortName?: string,
  locale: Locale = 'es'
): Promise<Tournament> {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  const user = await getLoggedInUser();

  // Check if user is admin
  if (!user?.isAdmin) {
    throw new Error(t('unauthorized'));
  }

  // Validate newStartDate if provided
  if (newStartDate && Number.isNaN(newStartDate.getTime())) {
    throw new Error(t('invalidStartDate'));
  }

  // Get the original tournament
  const originalTournament = await findTournamentById(tournamentId);
  if (!originalTournament) {
    throw new Error(t('notFound'));
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
    game_correct_goal_difference_points: originalTournament.game_correct_goal_difference_points,
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
  return applyLocalization(newTournament, locale, [
    { field: 'long_name', i18nField: 'long_name_i18n' },
    { field: 'short_name', i18nField: 'short_name_i18n' }
  ]);
}

/**
 * Updates conduct scores for teams in a tournament group
 * Requires admin access
 */
export async function updateGroupTeamConductScores(
  groupId: string,
  conductScores: { [teamId: string]: number },
  locale: Locale = 'es'
) {
  const t = await getTranslations({ locale, namespace: 'backoffice' });
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error(t('unauthorized'));
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
