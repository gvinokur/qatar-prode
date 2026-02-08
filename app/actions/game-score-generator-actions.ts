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
import { findTeamsInGroup } from '../db/tournament-group-repository';
import { findTournamentgroupById } from '../db/tournament-group-repository';

/**
 * Get the currently logged in user
 */
async function getLoggedInUser() {
  const session = await auth();
  return session?.user;
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

    // Validate input - must provide either groupId or playoffRoundId
    if (!groupId && !playoffRoundId) {
      return { success: false, error: 'Must provide either groupId or playoffRoundId' };
    }

    // Query games
    let games: ExtendedGameData[];
    let tournamentId: string;

    if (groupId) {
      // Get games in group
      games = await findGamesInGroup(groupId, true, true);
      const group = await findTournamentgroupById(groupId);
      if (!group) {
        return { success: false, error: 'Group not found' };
      }
      tournamentId = group.tournament_id;
    } else if (playoffRoundId) {
      // Get all tournament games and filter by playoff round
      // (There's no direct findGamesInPlayoffRound function, so we filter manually)
      const round = await db.selectFrom('tournament_playoff_rounds')
        .selectAll()
        .where('id', '=', playoffRoundId)
        .executeTakeFirst();

      if (!round) {
        return { success: false, error: 'Playoff round not found' };
      }

      tournamentId = round.tournament_id;
      const allGames = await findGamesInTournament(tournamentId, true);

      // Filter to games in this playoff round
      games = allGames.filter(game =>
        game.playoffStage?.tournament_playoff_round_id === playoffRoundId
      );
    } else {
      return { success: false, error: 'Invalid parameters' };
    }

    // Get existing results for these games
    const gameIds = games.map(g => g.id);
    const existingResults = await findGameResultByGameIds(gameIds, true);
    const resultsMap = new Map(existingResults.map(r => [r.game_id, r]));

    // Filter to unpublished games only (no result OR draft result)
    const gamesToFill = games.filter(game => {
      const result = resultsMap.get(game.id);
      return !result || result.is_draft;
    });

    const skippedCount = games.length - gamesToFill.length;

    if (gamesToFill.length === 0) {
      return {
        success: true,
        filledCount: 0,
        skippedCount
      };
    }

    // Generate scores and save (non-transactional, partial success is acceptable)
    for (const game of gamesToFill) {
      const matchScore = generateMatchScore(1.35);
      const existingResult = resultsMap.get(game.id);

      if (existingResult) {
        // Update existing draft result
        await updateGameResult(game.id, {
          home_score: matchScore.homeScore,
          away_score: matchScore.awayScore,
          home_penalty_score: matchScore.homePenaltyScore ?? undefined,
          away_penalty_score: matchScore.awayPenaltyScore ?? undefined,
          is_draft: false // Publish immediately
        });
      } else {
        // Create new result
        await createGameResult({
          game_id: game.id,
          home_score: matchScore.homeScore,
          away_score: matchScore.awayScore,
          home_penalty_score: matchScore.homePenaltyScore ?? undefined,
          away_penalty_score: matchScore.awayPenaltyScore ?? undefined,
          is_draft: false // Publish immediately
        });
      }
    }

    // Trigger full recalculation pipeline
    await calculateAndSavePlayoffGamesForTournament(tournamentId);

    if (groupId) {
      // Recalculate group standings
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

    await calculateGameScores(false, false);
    await calculateAndStoreQualifiedTeamsPoints(tournamentId);

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
    let games: ExtendedGameData[];
    let tournamentId: string;

    if (groupId) {
      games = await findGamesInGroup(groupId, true, true);
      const group = await findTournamentgroupById(groupId);
      if (!group) {
        return { success: false, error: 'Group not found' };
      }
      tournamentId = group.tournament_id;
    } else if (playoffRoundId) {
      const round = await db.selectFrom('tournament_playoff_rounds')
        .selectAll()
        .where('id', '=', playoffRoundId)
        .executeTakeFirst();

      if (!round) {
        return { success: false, error: 'Playoff round not found' };
      }

      tournamentId = round.tournament_id;
      const allGames = await findGamesInTournament(tournamentId, true);

      games = allGames.filter(game =>
        game.playoffStage?.tournament_playoff_round_id === playoffRoundId
      );
    } else {
      return { success: false, error: 'Invalid parameters' };
    }

    // Filter to games with results
    const gamesWithResults = games.filter(game => game.gameResult);

    if (gamesWithResults.length === 0) {
      return {
        success: true,
        clearedCount: 0
      };
    }

    // Clear game results (non-transactional, partial success is acceptable)
    // Set scores back to undefined and mark as draft
    for (const game of gamesWithResults) {
      await updateGameResult(game.id, {
        home_score: undefined,
        away_score: undefined,
        home_penalty_score: undefined,
        away_penalty_score: undefined,
        is_draft: true
      });
    }

    // Trigger recalculation to clean up guess scores
    await calculateGameScores(false, false);

    if (groupId) {
      // Recalculate group standings (without these results)
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

    await calculateAndStoreQualifiedTeamsPoints(tournamentId);

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
