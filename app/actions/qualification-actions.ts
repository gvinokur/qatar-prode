'use server';

import { getLoggedInUser } from './user-actions';
import {
  batchUpsertQualificationPredictions,
  countThirdPlaceQualifiers,
} from '../db/qualified-teams-repository';
import { QualifiedTeamPredictionNew } from '../db/tables-definition';
import { db } from '../db/database';
import { QualificationPredictionError } from './qualification-errors';

/**
 * Validate and update qualification predictions for a user
 *
 * Business rules:
 * - User must be authenticated
 * - Tournament must not be locked
 * - Teams must belong to the specified groups
 * - Cannot exceed max third place qualifiers
 * - Each position can only be assigned to one team per group
 *
 * @param predictions - Array of qualification predictions to upsert
 * @returns Success status or throws error
 */
export async function updateQualificationPredictions(
  predictions: QualifiedTeamPredictionNew[]
): Promise<{ success: boolean; message: string }> {
  // Validation: Empty array
  if (predictions.length === 0) {
    return { success: true, message: 'No predictions to update' };
  }

  // Validation: User authentication
  const user = await getLoggedInUser();
  if (!user?.id) {
    throw new QualificationPredictionError(
      'You must be logged in to update predictions',
      'UNAUTHORIZED'
    );
  }

  const userId = user.id;
  const tournamentId = predictions[0].tournament_id;

  // Validation: All predictions must be for the same user and tournament
  const invalidPredictions = predictions.filter(
    (p) => p.user_id !== userId || p.tournament_id !== tournamentId
  );
  if (invalidPredictions.length > 0) {
    throw new QualificationPredictionError(
      'All predictions must be for the same user and tournament',
      'INVALID_DATA'
    );
  }

  // Validation: Tournament exists and is not locked
  const tournament = await db
    .selectFrom('tournaments')
    .where('id', '=', tournamentId)
    .select(['id', 'is_active', 'allows_third_place_qualification', 'max_third_place_qualifiers'])
    .executeTakeFirst();

  if (!tournament) {
    throw new QualificationPredictionError(
      'Tournament not found',
      'TOURNAMENT_NOT_FOUND'
    );
  }

  // Check if tournament is locked (predictions are locked when tournament is inactive or after first game starts)
  // Note: Full lock check would need to verify game dates, but for now we check is_active
  if (!tournament.is_active) {
    throw new QualificationPredictionError(
      'Predictions are locked for this tournament',
      'TOURNAMENT_LOCKED'
    );
  }

  // Validation: Teams belong to their specified groups
  const teamGroupPairs = predictions.map((p) => ({
    teamId: p.team_id,
    groupId: p.group_id,
  }));

  for (const { teamId, groupId } of teamGroupPairs) {
    const teamInGroup = await db
      .selectFrom('tournament_group_teams')
      .where('tournament_group_id', '=', groupId)
      .where('team_id', '=', teamId)
      .select('id')
      .executeTakeFirst();

    if (!teamInGroup) {
      throw new QualificationPredictionError(
        `Team ${teamId} does not belong to group ${groupId}`,
        'INVALID_TEAM_GROUP'
      );
    }
  }

  // Validation: Position constraints
  // Each position must be >= 1
  const invalidPositions = predictions.filter((p) => p.predicted_position < 1);
  if (invalidPositions.length > 0) {
    throw new QualificationPredictionError(
      'Predicted position must be at least 1',
      'INVALID_POSITION'
    );
  }

  // Validation: Unique positions within each group
  const groupPositions = new Map<string, Set<number>>();
  for (const prediction of predictions) {
    const key = `${prediction.group_id}`;
    if (!groupPositions.has(key)) {
      groupPositions.set(key, new Set());
    }
    const positions = groupPositions.get(key)!;
    if (positions.has(prediction.predicted_position)) {
      throw new QualificationPredictionError(
        `Position ${prediction.predicted_position} is assigned to multiple teams in the same group`,
        'DUPLICATE_POSITION'
      );
    }
    positions.add(prediction.predicted_position);
  }

  // Validation: Max third place qualifiers
  if (tournament.allows_third_place_qualification) {
    const maxThirdPlace = tournament.max_third_place_qualifiers || 0;

    // Count third place qualifiers in the current batch
    const newThirdPlaceCount = predictions.filter(
      (p) => p.predicted_position === 3 && p.predicted_to_qualify
    ).length;

    // Get team IDs from current batch to exclude from existing count
    const batchTeamIds = predictions
      .filter((p) => p.predicted_position === 3)
      .map((p) => p.team_id);

    // Count existing third place qualifiers NOT in the current batch
    const existingNotInBatch = await db
      .selectFrom('tournament_qualified_teams_predictions')
      .where('user_id', '=', userId)
      .where('tournament_id', '=', tournamentId)
      .where('predicted_position', '=', 3)
      .where('predicted_to_qualify', '=', true)
      .where('team_id', 'not in', batchTeamIds.length > 0 ? batchTeamIds : [''])
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirst();

    const existingCount = Number(existingNotInBatch?.count || 0);
    const totalThirdPlace = existingCount + newThirdPlaceCount;

    if (totalThirdPlace > maxThirdPlace) {
      throw new QualificationPredictionError(
        `Maximum ${maxThirdPlace} third place qualifiers allowed. You currently have ${existingCount} selected. Adding ${newThirdPlaceCount} would exceed the limit.`,
        'MAX_THIRD_PLACE_EXCEEDED'
      );
    }
  }

  // Validation: predicted_to_qualify logic
  // Positions 1-2 should always have predicted_to_qualify = true (auto-qualify)
  // Position 3+ can be true or false based on user selection
  const invalidQualificationFlags = predictions.filter(
    (p) => p.predicted_position <= 2 && !p.predicted_to_qualify
  );
  if (invalidQualificationFlags.length > 0) {
    throw new QualificationPredictionError(
      'Teams in positions 1-2 must be marked as qualifying',
      'INVALID_QUALIFICATION_FLAG'
    );
  }

  // All validations passed - proceed with upsert
  try {
    await batchUpsertQualificationPredictions(predictions);

    return {
      success: true,
      message: `Successfully updated ${predictions.length} prediction${predictions.length === 1 ? '' : 's'}`,
    };
  } catch (error) {
    console.error('Error updating qualification predictions:', error);
    throw new QualificationPredictionError(
      'Failed to save predictions. Please try again.',
      'DATABASE_ERROR'
    );
  }
}

/**
 * Get tournament configuration for qualified teams feature
 * Used by client components to determine UI behavior
 */
export async function getTournamentQualificationConfig(tournamentId: string): Promise<{
  allowsThirdPlace: boolean;
  maxThirdPlace: number;
  isLocked: boolean;
}> {
  const tournament = await db
    .selectFrom('tournaments')
    .where('id', '=', tournamentId)
    .select(['is_active', 'allows_third_place_qualification', 'max_third_place_qualifiers'])
    .executeTakeFirst();

  if (!tournament) {
    throw new QualificationPredictionError('Tournament not found', 'TOURNAMENT_NOT_FOUND');
  }

  return {
    allowsThirdPlace: tournament.allows_third_place_qualification || false,
    maxThirdPlace: tournament.max_third_place_qualifiers || 0,
    isLocked: !tournament.is_active,
  };
}
