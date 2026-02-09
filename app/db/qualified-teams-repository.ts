import { db } from './database';
import {
  TournamentUserGroupPositionsPrediction,
  TournamentUserGroupPositionsPredictionNew,
  TeamPositionPrediction,
} from './tables-definition';
import { cache } from 'react';

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
