'use server'

import { auth } from '../../auth';
import { findGamesInGroup, findGamesInTournament } from '../db/game-repository';
import { findGameResultByGameIds, createGameResult, updateGameResult } from '../db/game-result-repository';
import { generateMatchScore } from '../utils/poisson-generator';
import { ExtendedGameData } from '../definitions';
import { db } from '../db/database'; // Used for playoff round queries
import {
  calculateAndSavePlayoffGamesForTournament,
  calculateAndStoreGroupPosition,
  calculateAndStoreQualifiedTeamsPoints,
  calculateGameScores
} from './backoffice-actions';
import { findTeamsInGroup, findTournamentgroupById } from '../db/tournament-group-repository';

/**
 * Get the currently logged in user
 */
async function getLoggedInUser() {
  const session = await auth();
  return session?.user;
}

/**
 * Query games and tournament ID based on groupId or playoffRoundId
 */
async function queryGamesForBulkOperation(
  groupId?: string,
  playoffRoundId?: string
): Promise<{ games: ExtendedGameData[]; tournamentId: string } | { error: string }> {
  if (groupId) {
    const games = await findGamesInGroup(groupId, true, true);
    const group = await findTournamentgroupById(groupId);
    if (!group) {
      return { error: 'Group not found' };
    }
    return { games, tournamentId: group.tournament_id };
  }

  if (playoffRoundId) {
    const round = await db.selectFrom('tournament_playoff_rounds')
      .selectAll()
      .where('id', '=', playoffRoundId)
      .executeTakeFirst();

    if (!round) {
      return { error: 'Playoff round not found' };
    }

    const allGames = await findGamesInTournament(round.tournament_id, true);
    const games = allGames.filter(game =>
      game.playoffStage?.tournament_playoff_round_id === playoffRoundId
    );

    return { games, tournamentId: round.tournament_id };
  }

  return { error: 'Invalid parameters' };
}

/**
 * Generate and save scores for games
 */
async function generateAndSaveScores(
  gamesToFill: ExtendedGameData[],
  resultsMap: Map<string, any>
): Promise<void> {
  for (const game of gamesToFill) {
    const isPlayoff = !!game.playoffStage;
    const matchScore = generateMatchScore(1.35, isPlayoff);
    const existingResult = resultsMap.get(game.id);

    if (existingResult) {
      await updateGameResult(game.id, {
        home_score: matchScore.homeScore,
        away_score: matchScore.awayScore,
        home_penalty_score: matchScore.homePenaltyScore ?? undefined,
        away_penalty_score: matchScore.awayPenaltyScore ?? undefined,
        is_draft: false
      });
    } else {
      await createGameResult({
        game_id: game.id,
        home_score: matchScore.homeScore,
        away_score: matchScore.awayScore,
        home_penalty_score: matchScore.homePenaltyScore ?? undefined,
        away_penalty_score: matchScore.awayPenaltyScore ?? undefined,
        is_draft: false
      });
    }
  }
}

/**
 * Clear scores for games by setting them to NULL
 */
async function clearScoresForGames(gamesWithResults: ExtendedGameData[]): Promise<void> {
  for (const game of gamesWithResults) {
    await updateGameResult(game.id, {
      home_score: undefined,
      away_score: undefined,
      home_penalty_score: undefined,
      away_penalty_score: undefined,
      is_draft: true
    });
  }
}

/**
 * Run full recalculation pipeline after score changes
 */
async function runRecalculationPipeline(
  tournamentId: string,
  groupId?: string
): Promise<void> {
  // First recalculate group standings (playoff calculation depends on this)
  if (groupId) {
    const group = await findTournamentgroupById(groupId);
    if (group) {
      const teams = await findTeamsInGroup(groupId);
      const teamIds = teams.map(t => t.team_id);
      const updatedGames = await findGamesInGroup(groupId, true, false);
      await calculateAndStoreGroupPosition(
        groupId,
        teamIds,
        updatedGames,
        group.sort_by_games_between_teams
      );
    }
  }

  // Then recalculate playoff teams (uses updated group standings)
  await calculateAndSavePlayoffGamesForTournament(tournamentId);
  await calculateGameScores(false, false);
  await calculateAndStoreQualifiedTeamsPoints(tournamentId);
}

interface AutoFillResult {
  success: boolean;
  filledCount?: number;
  skippedCount?: number;
  error?: string;
}

/**
 * Auto-fill game scores for a group or playoff round
 * Generates realistic scores using Poisson distribution
 * Only affects games without results OR with draft results (skips published games)
 * Immediately publishes generated scores and triggers full recalculation
 *
 * @param groupId - Tournament group ID (for group stage games)
 * @param playoffRoundId - Playoff round ID (for playoff games)
 * @returns Result with counts of filled and skipped games
 */
export async function autoFillGameScores(
  groupId?: string,
  playoffRoundId?: string
): Promise<AutoFillResult> {
  try {
    // Authorization check
    const user = await getLoggedInUser();
    if (!user?.isAdmin) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // Validate input
    if (!groupId && !playoffRoundId) {
      return { success: false, error: 'Must provide either groupId or playoffRoundId' };
    }

    // Query games
    const queryResult = await queryGamesForBulkOperation(groupId, playoffRoundId);
    if ('error' in queryResult) {
      return { success: false, error: queryResult.error };
    }
    const { games, tournamentId } = queryResult;

    // Get existing results and filter to unpublished games
    const gameIds = games.map(g => g.id);
    const existingResults = await findGameResultByGameIds(gameIds, true);
    const resultsMap = new Map(existingResults.map(r => [r.game_id, r]));

    const gamesToFill = games.filter(game => {
      const result = resultsMap.get(game.id);
      return !result || result.is_draft;
    });

    const skippedCount = games.length - gamesToFill.length;

    if (gamesToFill.length === 0) {
      return { success: true, filledCount: 0, skippedCount };
    }

    // Generate and save scores
    await generateAndSaveScores(gamesToFill, resultsMap);

    // Run recalculation pipeline
    await runRecalculationPipeline(tournamentId, groupId);

    return {
      success: true,
      filledCount: gamesToFill.length,
      skippedCount
    };

  } catch (error) {
    console.error('Error auto-filling game scores:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to auto-fill scores'
    };
  }
}

interface ClearResult {
  success: boolean;
  clearedCount?: number;
  error?: string;
}

/**
 * Clear all game scores in a group or playoff round
 * Deletes game_results records and triggers recalculation to clean up guess scores
 *
 * @param groupId - Tournament group ID (for group stage games)
 * @param playoffRoundId - Playoff round ID (for playoff games)
 * @returns Result with count of cleared games
 */
export async function clearGameScores(
  groupId?: string,
  playoffRoundId?: string
): Promise<ClearResult> {
  try {
    // Authorization check
    const user = await getLoggedInUser();
    if (!user?.isAdmin) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // Validate input
    if (!groupId && !playoffRoundId) {
      return { success: false, error: 'Must provide either groupId or playoffRoundId' };
    }

    // Query games
    const queryResult = await queryGamesForBulkOperation(groupId, playoffRoundId);
    if ('error' in queryResult) {
      return { success: false, error: queryResult.error };
    }
    const { games, tournamentId } = queryResult;

    // Filter to games with results
    const gamesWithResults = games.filter(game => game.gameResult);

    if (gamesWithResults.length === 0) {
      return { success: true, clearedCount: 0 };
    }

    // Clear scores
    await clearScoresForGames(gamesWithResults);

    // Run recalculation pipeline
    await runRecalculationPipeline(tournamentId, groupId);

    return {
      success: true,
      clearedCount: gamesWithResults.length
    };

  } catch (error) {
    console.error('Error clearing game scores:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear scores'
    };
  }
}
