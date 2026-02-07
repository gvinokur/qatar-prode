import { db } from './database';
import { createBaseFunctions } from './base-repository';
import {
  QualifiedTeamPredictionTable,
  QualifiedTeamPrediction,
  QualifiedTeamPredictionNew,
  TournamentUserGroupPositionsPrediction,
  TournamentUserGroupPositionsPredictionNew,
  TeamPositionPrediction,
} from './tables-definition';
import { cache } from 'react';

const tableName = 'tournament_qualified_teams_predictions';

const baseFunctions = createBaseFunctions<QualifiedTeamPredictionTable, QualifiedTeamPrediction>(tableName);

export const findQualificationPredictionById = baseFunctions.findById;
export const createQualificationPrediction = baseFunctions.create;
export const updateQualificationPrediction = baseFunctions.update;
export const deleteQualificationPrediction = baseFunctions.delete;

/**
 * Get all qualification predictions for a user in a specific tournament
 * Cached for performance
 */
export const getQualificationPredictions = cache(
  async function (userId: string, tournamentId: string): Promise<QualifiedTeamPrediction[]> {
    return db
      .selectFrom(tableName)
      .where('user_id', '=', userId)
      .where('tournament_id', '=', tournamentId)
      .selectAll()
      .orderBy('group_id')
      .orderBy('predicted_position')
      .execute();
  }
);

/**
 * Get qualification predictions for a specific group
 * Useful for group-by-group rendering
 */
export const getQualificationPredictionsByGroup = cache(
  async function (
    userId: string,
    tournamentId: string,
    groupId: string
  ): Promise<QualifiedTeamPrediction[]> {
    return db
      .selectFrom(tableName)
      .where('user_id', '=', userId)
      .where('tournament_id', '=', tournamentId)
      .where('group_id', '=', groupId)
      .selectAll()
      .orderBy('predicted_position')
      .execute();
  }
);

/**
 * Count how many third place qualifiers a user has selected
 * Used for validation against max_third_place_qualifiers
 */
export async function countThirdPlaceQualifiers(
  userId: string,
  tournamentId: string
): Promise<number> {
  const result = await db
    .selectFrom(tableName)
    .where('user_id', '=', userId)
    .where('tournament_id', '=', tournamentId)
    .where('predicted_position', '=', 3)
    .where('predicted_to_qualify', '=', true)
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .executeTakeFirstOrThrow();

  return Number(result.count);
}

/**
 * Upsert a qualification prediction (insert or update if exists)
 * Uses unique constraint on (user_id, tournament_id, group_id, team_id)
 */
export async function upsertQualificationPrediction(
  prediction: QualifiedTeamPredictionNew
): Promise<QualifiedTeamPrediction> {
  const existing = await db
    .selectFrom(tableName)
    .where('user_id', '=', prediction.user_id)
    .where('tournament_id', '=', prediction.tournament_id)
    .where('group_id', '=', prediction.group_id)
    .where('team_id', '=', prediction.team_id)
    .selectAll()
    .executeTakeFirst();

  if (existing) {
    // Update existing prediction
    return db
      .updateTable(tableName)
      .set({
        predicted_position: prediction.predicted_position,
        predicted_to_qualify: prediction.predicted_to_qualify,
        updated_at: new Date(),
      })
      .where('id', '=', existing.id)
      .returningAll()
      .executeTakeFirstOrThrow();
  } else {
    // Insert new prediction
    return createQualificationPrediction(prediction);
  }
}

/**
 * Batch upsert multiple qualification predictions
 * More efficient than calling upsertQualificationPrediction in a loop
 */
export async function batchUpsertQualificationPredictions(
  predictions: QualifiedTeamPredictionNew[]
): Promise<void> {
  if (predictions.length === 0) return;

  // Process predictions one at a time to handle upsert logic
  // Note: Could be optimized with a single ON CONFLICT DO UPDATE query
  // but Kysely doesn't have built-in upsert support yet
  for (const prediction of predictions) {
    await upsertQualificationPrediction(prediction);
  }
}

/**
 * Delete all qualification predictions for a user in a tournament
 * Used when resetting predictions or deleting user data
 */
export async function deleteAllQualificationPredictions(
  userId: string,
  tournamentId: string
): Promise<void> {
  await db
    .deleteFrom(tableName)
    .where('user_id', '=', userId)
    .where('tournament_id', '=', tournamentId)
    .execute();
}

/**
 * Delete all predictions for a specific group
 * Used when group structure changes
 */
export async function deleteQualificationPredictionsByGroup(
  userId: string,
  tournamentId: string,
  groupId: string
): Promise<void> {
  await db
    .deleteFrom(tableName)
    .where('user_id', '=', userId)
    .where('tournament_id', '=', tournamentId)
    .where('group_id', '=', groupId)
    .execute();
}

/**
 * Get all teams a user has predicted to qualify (positions 1-2 and 3rd place selections)
 * Returns team IDs grouped by whether they're direct qualifiers (1-2) or third place
 */
export async function getQualifiedTeamIds(
  userId: string,
  tournamentId: string
): Promise<{
  directQualifiers: string[];
  thirdPlaceQualifiers: string[];
  allQualifiedTeamIds: string[];
}> {
  const predictions = await getQualificationPredictions(userId, tournamentId);

  const directQualifiers = predictions
    .filter((p) => p.predicted_position <= 2)
    .map((p) => p.team_id);

  const thirdPlaceQualifiers = predictions
    .filter((p) => p.predicted_position === 3 && p.predicted_to_qualify)
    .map((p) => p.team_id);

  const allQualifiedTeamIds = [...directQualifiers, ...thirdPlaceQualifiers];

  return {
    directQualifiers,
    thirdPlaceQualifiers,
    allQualifiedTeamIds,
  };
}

/**
 * Get qualification prediction completion statistics for a user
 * Used for prediction dashboard and progress tracking
 */
export async function getQualificationPredictionStats(
  userId: string,
  tournamentId: string
): Promise<{
  totalGroups: number;
  predictedGroups: number;
  totalDirectQualifiers: number;
  predictedThirdPlace: number;
  maxThirdPlace: number;
}> {
  // Get total groups for this tournament
  const groupCount = await db
    .selectFrom('tournament_groups')
    .where('tournament_id', '=', tournamentId)
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .executeTakeFirstOrThrow();

  // Get tournament config for max third place qualifiers
  const tournament = await db
    .selectFrom('tournaments')
    .where('id', '=', tournamentId)
    .select(['max_third_place_qualifiers'])
    .executeTakeFirstOrThrow();

  // Get prediction statistics
  const predictions = await getQualificationPredictions(userId, tournamentId);

  // Count unique groups with predictions
  const uniqueGroups = new Set(predictions.map((p) => p.group_id));
  const predictedGroups = uniqueGroups.size;

  // Count direct qualifiers (positions 1-2)
  const totalDirectQualifiers = predictions.filter((p) => p.predicted_position <= 2).length;

  // Count third place selections
  const predictedThirdPlace = predictions.filter(
    (p) => p.predicted_position === 3 && p.predicted_to_qualify
  ).length;

  return {
    totalGroups: Number(groupCount.count),
    predictedGroups,
    totalDirectQualifiers,
    predictedThirdPlace,
    maxThirdPlace: tournament.max_third_place_qualifiers || 0,
  };
}

// ============================================================================
// JSONB-based Group Positions Functions
// ============================================================================

const jsonbTableName = 'tournament_user_group_positions_predictions';

/**
 * Get group positions prediction (JSONB format) for a specific group
 * Returns null if no predictions exist yet
 */
export const getGroupPositionsPrediction = cache(
  async function (
    userId: string,
    tournamentId: string,
    groupId: string
  ): Promise<TournamentUserGroupPositionsPrediction | null> {
    const result = await db
      .selectFrom(jsonbTableName)
      .where('user_id', '=', userId)
      .where('tournament_id', '=', tournamentId)
      .where('group_id', '=', groupId)
      .selectAll()
      .executeTakeFirst();

    return result || null;
  }
);

/**
 * Get all group positions predictions (JSONB format) for a user in a tournament
 * Returns array of all group predictions
 */
export const getAllUserGroupPositionsPredictions = cache(
  async function (
    userId: string,
    tournamentId: string
  ): Promise<TournamentUserGroupPositionsPrediction[]> {
    return db
      .selectFrom(jsonbTableName)
      .where('user_id', '=', userId)
      .where('tournament_id', '=', tournamentId)
      .selectAll()
      .orderBy('group_id')
      .execute();
  }
);

/**
 * Upsert group positions prediction (JSONB format)
 * Creates new row if doesn't exist, updates if exists
 * Uses unique constraint on (user_id, tournament_id, group_id)
 */
export async function upsertGroupPositionsPrediction(
  userId: string,
  tournamentId: string,
  groupId: string,
  positions: TeamPositionPrediction[]
): Promise<TournamentUserGroupPositionsPrediction> {
  const existing = await db
    .selectFrom(jsonbTableName)
    .where('user_id', '=', userId)
    .where('tournament_id', '=', tournamentId)
    .where('group_id', '=', groupId)
    .selectAll()
    .executeTakeFirst();

  if (existing) {
    // Update existing prediction
    return db
      .updateTable(jsonbTableName)
      .set({
        team_predicted_positions: JSON.stringify(positions),
        updated_at: new Date(),
      })
      .where('id', '=', existing.id)
      .returningAll()
      .executeTakeFirstOrThrow();
  } else {
    // Insert new prediction
    const newPrediction: TournamentUserGroupPositionsPredictionNew = {
      user_id: userId,
      tournament_id: tournamentId,
      group_id: groupId,
      team_predicted_positions: JSON.stringify(positions) as any,
    };

    return db
      .insertInto(jsonbTableName)
      .values(newPrediction)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}

/**
 * Delete group positions prediction (JSONB format) for a specific group
 */
export async function deleteGroupPositionsPrediction(
  userId: string,
  tournamentId: string,
  groupId: string
): Promise<void> {
  await db
    .deleteFrom(jsonbTableName)
    .where('user_id', '=', userId)
    .where('tournament_id', '=', tournamentId)
    .where('group_id', '=', groupId)
    .execute();
}

/**
 * Delete all group positions predictions (JSONB format) for a user in a tournament
 */
export async function deleteAllGroupPositionsPredictions(
  userId: string,
  tournamentId: string
): Promise<void> {
  await db
    .deleteFrom(jsonbTableName)
    .where('user_id', '=', userId)
    .where('tournament_id', '=', tournamentId)
    .execute();
}
