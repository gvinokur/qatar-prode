'use server';

import { calculateQualifiedTeamsScore } from '../utils/qualified-teams-scoring';
import { getLoggedInUser } from './user-actions';
import { findTournamentById } from '../db/tournament-repository';
import { db } from '../db/database';
import { revalidatePath } from 'next/cache';

/**
 * Result type for batch scoring operation
 */
interface BatchScoringResult {
  success: boolean;
  message: string;
  usersProcessed: number;
  errors: string[];
  totalScoreSum?: number; // For validation
}

/**
 * Result type for single user scoring
 */
interface SingleUserScoringResult {
  success: boolean;
  message?: string;
  score?: number;
  breakdown?: any;
}

/**
 * Helper function to calculate correct and exact counts from breakdown
 * Reduces cognitive complexity by extracting nested loops
 */
function calculateCountsFromBreakdown(breakdown: any[]): { correctCount: number; exactCount: number } {
  let correctCount = 0;
  let exactCount = 0;

  for (const group of breakdown) {
    for (const team of group.teams) {
      // Count teams that qualified and user predicted to qualify
      if (team.predictedToQualify && team.actuallyQualified) {
        correctCount++;

        // Check if it was exact position match
        if (team.predictedPosition === team.actualPosition) {
          exactCount++;
        }
      }
    }
  }

  return { correctCount, exactCount };
}

/**
 * Calculate and store qualified teams scores for ALL users in a tournament
 *
 * Process:
 * 1. Validate tournament exists and groups are complete
 * 2. Clear all existing qualified_teams_score (set to 0) for idempotency
 * 3. Process each user: calculate score and update database
 * 4. Return summary with success/error counts
 *
 * @param tournamentId - Tournament ID to calculate scores for
 * @returns Batch scoring result with summary
 */
export async function calculateAndStoreQualifiedTeamsScores(
  tournamentId: string
): Promise<BatchScoringResult> {
  try {
    // Validate tournament exists
    const tournament = await findTournamentById(tournamentId);
    if (!tournament) {
      return {
        success: false,
        message: `Tournament ${tournamentId} not found`,
        usersProcessed: 0,
        errors: [`Tournament not found: ${tournamentId}`],
      };
    }

    // Get all users who made predictions for this tournament
    const usersWithPredictions = await db
      .selectFrom('tournament_user_group_positions_predictions')
      .where('tournament_id', '=', tournamentId)
      .select('user_id')
      .distinct()
      .execute();

    const userIds = usersWithPredictions.map((u) => u.user_id);

    if (userIds.length === 0) {
      return {
        success: true,
        message: 'No users with predictions found for this tournament',
        usersProcessed: 0,
        errors: [],
        totalScoreSum: 0,
      };
    }

    // Clear all existing qualified_teams_score for idempotency
    await db
      .updateTable('tournament_guesses')
      .set({ qualified_teams_score: 0 })
      .where('tournament_id', '=', tournamentId)
      .execute();

    // Process each user
    let usersProcessed = 0;
    let totalScoreSum = 0;
    const errors: string[] = [];

    for (const userId of userIds) {
      try {
        // Calculate score for this user
        const scoringResult = await calculateQualifiedTeamsScore(userId, tournamentId);

        // Calculate counts from breakdown
        const { correctCount, exactCount } = calculateCountsFromBreakdown(scoringResult.breakdown);

        // Update tournament_guesses with the calculated score and counts
        // Use atomic upsert (no transaction needed - supported by PostgreSQL)
        await db
          .insertInto('tournament_guesses')
          .values({
            user_id: userId,
            tournament_id: tournamentId,
            qualified_teams_score: scoringResult.totalScore,
            qualified_teams_correct: correctCount,
            qualified_teams_exact: exactCount,
          })
          .onConflict((oc) =>
            oc.columns(['user_id', 'tournament_id']).doUpdateSet({
              qualified_teams_score: scoringResult.totalScore,
              qualified_teams_correct: correctCount,
              qualified_teams_exact: exactCount,
            })
          )
          .execute();

        usersProcessed++;
        totalScoreSum += scoringResult.totalScore;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`User ${userId}: ${errorMessage}`);
        console.error(`Error calculating score for user ${userId}:`, error);
        // Continue processing other users
      }
    }

    // Revalidate relevant paths
    revalidatePath(`/tournaments/${tournamentId}/stats`);
    revalidatePath(`/tournaments/${tournamentId}`);

    return {
      success: true,
      message: `Processed ${usersProcessed} out of ${userIds.length} users`,
      usersProcessed,
      errors,
      totalScoreSum,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in calculateAndStoreQualifiedTeamsScores:', error);
    return {
      success: false,
      message: `Error calculating scores: ${errorMessage}`,
      usersProcessed: 0,
      errors: [errorMessage],
    };
  }
}

/**
 * Calculate score for a SINGLE user (useful for testing/debugging)
 *
 * @param userId - User ID to calculate score for
 * @param tournamentId - Tournament ID
 * @returns Single user scoring result with breakdown
 */
export async function calculateUserQualifiedTeamsScore(
  userId: string,
  tournamentId: string
): Promise<SingleUserScoringResult> {
  try {
    const scoringResult = await calculateQualifiedTeamsScore(userId, tournamentId);

    return {
      success: true,
      score: scoringResult.totalScore,
      breakdown: scoringResult.breakdown,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error calculating score for user ${userId}:`, error);
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Admin-only trigger for qualified teams scoring
 * This is called from the backoffice UI
 *
 * @param tournamentId - Tournament ID to calculate scores for
 * @returns Batch scoring result
 */
export async function triggerQualifiedTeamsScoringAction(
  tournamentId: string
): Promise<BatchScoringResult> {
  // Authorization check
  const user = await getLoggedInUser();
  if (!user) {
    return {
      success: false,
      message: 'Unauthorized: You must be logged in',
      usersProcessed: 0,
      errors: ['User not authenticated'],
    };
  }

  // Note: Optional admin check can be added here if needed
  // if (!user.isAdmin) {
  //   return {
  //     success: false,
  //     message: 'Unauthorized: Only administrators can trigger scoring',
  //     usersProcessed: 0,
  //     errors: ['User is not an administrator'],
  //   };
  // }

  // Execute the scoring calculation
  return await calculateAndStoreQualifiedTeamsScores(tournamentId);
}
