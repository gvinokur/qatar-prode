'use server';

import { getLoggedInUser } from './user-actions';
import {
  batchUpsertQualificationPredictions,
  upsertGroupPositionsPrediction,
  getAllUserGroupPositionsPredictions,
} from '../db/qualified-teams-repository';
import { QualifiedTeamPredictionNew, TeamPositionPrediction } from '../db/tables-definition';
import { db } from '../db/database';
import { QualificationPredictionError } from './qualification-errors';

/** Helper: Validate teams belong to their specified groups */
async function validateTeamsBelongToGroups(
  predictions: QualifiedTeamPredictionNew[]
): Promise<void> {
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
        `El equipo ${teamId} no pertenece al grupo ${groupId}`,
        'INVALID_TEAM_GROUP'
      );
    }
  }
}

/** Helper: Validate position constraints (>= 1 and unique within group) */
function validatePositionConstraints(predictions: QualifiedTeamPredictionNew[]): void {
  // Check positions >= 1
  const invalidPositions = predictions.filter((p) => p.predicted_position < 1);
  if (invalidPositions.length > 0) {
    throw new QualificationPredictionError(
      'La posición predicha debe ser al menos 1',
      'INVALID_POSITION'
    );
  }

  // Check unique positions within each group
  const groupPositions = new Map<string, Set<number>>();
  for (const prediction of predictions) {
    const key = `${prediction.group_id}`;
    if (!groupPositions.has(key)) {
      groupPositions.set(key, new Set());
    }
    const positions = groupPositions.get(key)!;
    if (positions.has(prediction.predicted_position)) {
      throw new QualificationPredictionError(
        `La posición ${prediction.predicted_position} está asignada a múltiples equipos en el mismo grupo`,
        'DUPLICATE_POSITION'
      );
    }
    positions.add(prediction.predicted_position);
  }
}

/** Helper: Validate third place qualifiers don't exceed max */
async function validateThirdPlaceQualifiers(
  predictions: QualifiedTeamPredictionNew[],
  tournament: {
    allows_third_place_qualification: boolean | null;
    max_third_place_qualifiers: number | null;
  },
  userId: string,
  tournamentId: string
): Promise<void> {
  if (!tournament.allows_third_place_qualification) return;

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
  let countQuery = db
    .selectFrom('tournament_qualified_teams_predictions')
    .where('user_id', '=', userId)
    .where('tournament_id', '=', tournamentId)
    .where('predicted_position', '=', 3)
    .where('predicted_to_qualify', '=', true);

  // Only add 'not in' clause if there are team IDs to exclude
  if (batchTeamIds.length > 0) {
    countQuery = countQuery.where('team_id', 'not in', batchTeamIds);
  }

  const existingNotInBatch = await countQuery
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .executeTakeFirst();

  const existingCount = Number(existingNotInBatch?.count || 0);
  const totalThirdPlace = existingCount + newThirdPlaceCount;

  if (totalThirdPlace > maxThirdPlace) {
    throw new QualificationPredictionError(
      `Máximo ${maxThirdPlace} clasificados de tercer lugar permitidos. Actualmente tienes ${existingCount} seleccionados. Agregar ${newThirdPlaceCount} excedería el límite.`,
      'MAX_THIRD_PLACE_EXCEEDED'
    );
  }
}

/** Helper: Validate qualification flags (positions 1-2 must be qualified) */
function validateQualificationFlags(predictions: QualifiedTeamPredictionNew[]): void {
  const invalidQualificationFlags = predictions.filter(
    (p) => p.predicted_position <= 2 && !p.predicted_to_qualify
  );
  if (invalidQualificationFlags.length > 0) {
    throw new QualificationPredictionError(
      'Los equipos en posiciones 1-2 deben estar marcados como clasificados',
      'INVALID_QUALIFICATION_FLAG'
    );
  }
}

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
    return { success: true, message: 'No hay predicciones para actualizar' };
  }

  // Validation: User authentication
  const user = await getLoggedInUser();
  if (!user?.id) {
    throw new QualificationPredictionError(
      'Debes iniciar sesión para actualizar predicciones',
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
      'Todas las predicciones deben ser para el mismo usuario y torneo',
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
      'Torneo no encontrado',
      'TOURNAMENT_NOT_FOUND'
    );
  }

  // Check if tournament is locked (predictions are locked when tournament is inactive or after first game starts)
  // Note: Full lock check would need to verify game dates, but for now we check is_active
  if (!tournament.is_active) {
    throw new QualificationPredictionError(
      'Las predicciones están bloqueadas para este torneo',
      'TOURNAMENT_LOCKED'
    );
  }

  // Validation: Teams belong to their specified groups
  await validateTeamsBelongToGroups(predictions);

  // Validation: Position constraints (>= 1 and unique within group)
  validatePositionConstraints(predictions);

  // Validation: Max third place qualifiers
  await validateThirdPlaceQualifiers(predictions, tournament, userId, tournamentId);

  // Validation: predicted_to_qualify logic (positions 1-2 must be qualified)
  validateQualificationFlags(predictions);

  // All validations passed - proceed with upsert
  try {
    await batchUpsertQualificationPredictions(predictions);

    return {
      success: true,
      message: `Actualizado${predictions.length === 1 ? '' : 's'} exitosamente ${predictions.length} predicción${predictions.length === 1 ? '' : 'es'}`,
    };
  } catch (error) {
    console.error('Error updating qualification predictions:', error);
    throw new QualificationPredictionError(
      'Error al guardar las predicciones. Por favor intenta de nuevo.',
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
    throw new QualificationPredictionError('Torneo no encontrado', 'TOURNAMENT_NOT_FOUND');
  }

  // Check if predictions are locked (5 days after tournament starts)
  // Same logic as tournament awards (honor roll, individual awards)
  const { getTournamentStartDate } = await import('./tournament-actions');
  const tournamentStartDate = await getTournamentStartDate(tournamentId);
  const isPredictionLocked = tournamentStartDate
    ? Date.now() > tournamentStartDate.getTime() + 5 * 24 * 60 * 60 * 1000
    : false;

  return {
    allowsThirdPlace: tournament.allows_third_place_qualification || false,
    maxThirdPlace: tournament.max_third_place_qualifiers || 0,
    isLocked: isPredictionLocked,
  };
}

/**
 * Batch update all team positions for a group in a single transaction
 * This ensures atomic updates - all succeed or all fail together
 *
 * @param groupId - The tournament group ID
 * @param tournamentId - The tournament ID
 * @param positionUpdates - Array of {teamId, position, qualifies}
 * @returns Updated predictions or error
 */
export async function updateGroupPositionsBatch(
  groupId: string,
  tournamentId: string,
  positionUpdates: Array<{ teamId: string; position: number; qualifies: boolean }>
): Promise<{ success: boolean; message: string; predictions?: QualifiedTeamPredictionNew[] }> {
  // Validation: User authentication
  const user = await getLoggedInUser();
  if (!user?.id) {
    throw new QualificationPredictionError(
      'Debes iniciar sesión para actualizar predicciones',
      'UNAUTHORIZED'
    );
  }

  const userId = user.id;

  // Validation: Empty array
  if (positionUpdates.length === 0) {
    return { success: true, message: 'No hay predicciones para actualizar' };
  }

  // Validation: Tournament exists and is not locked
  const tournament = await db
    .selectFrom('tournaments')
    .where('id', '=', tournamentId)
    .select(['id', 'is_active', 'allows_third_place_qualification', 'max_third_place_qualifiers'])
    .executeTakeFirst();

  if (!tournament) {
    throw new QualificationPredictionError('Torneo no encontrado', 'TOURNAMENT_NOT_FOUND');
  }

  if (!tournament.is_active) {
    throw new QualificationPredictionError(
      'Las predicciones están bloqueadas para este torneo',
      'TOURNAMENT_LOCKED'
    );
  }

  // Validation: All teams belong to the specified group
  const teamIds = positionUpdates.map((u) => u.teamId);
  const teamsInGroup = await db
    .selectFrom('tournament_group_teams')
    .where('tournament_group_id', '=', groupId)
    .where('team_id', 'in', teamIds)
    .select('team_id')
    .execute();

  if (teamsInGroup.length !== teamIds.length) {
    throw new QualificationPredictionError(
      'Uno o más equipos no pertenecen al grupo especificado',
      'INVALID_TEAM_GROUP'
    );
  }

  // Validation: Positions are valid and unique
  const positionNumbers = positionUpdates.map((u) => u.position);
  if (positionNumbers.some((p) => p < 1)) {
    throw new QualificationPredictionError(
      'La posición predicha debe ser al menos 1',
      'INVALID_POSITION'
    );
  }

  const uniquePositions = new Set(positionNumbers);
  if (uniquePositions.size !== positionNumbers.length) {
    throw new QualificationPredictionError(
      'Las posiciones deben ser únicas dentro del grupo',
      'DUPLICATE_POSITION'
    );
  }

  // Validation: Qualification flags are correct for positions
  const invalidQualification = positionUpdates.find(
    (u) => u.position <= 2 && !u.qualifies
  );
  if (invalidQualification) {
    throw new QualificationPredictionError(
      'Los equipos en posiciones 1-2 deben estar marcados como clasificados',
      'INVALID_QUALIFICATION_FLAG'
    );
  }

  // Validation: Max third place qualifiers
  if (tournament.allows_third_place_qualification) {
    const maxThirdPlace = tournament.max_third_place_qualifiers || 0;
    const newThirdPlaceCount = positionUpdates.filter(
      (u) => u.position === 3 && u.qualifies
    ).length;

    // Count existing third place qualifiers in OTHER groups
    const existingInOtherGroups = await db
      .selectFrom('tournament_qualified_teams_predictions')
      .where('user_id', '=', userId)
      .where('tournament_id', '=', tournamentId)
      .where('group_id', '!=', groupId)
      .where('predicted_position', '=', 3)
      .where('predicted_to_qualify', '=', true)
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirst();

    const existingCount = Number(existingInOtherGroups?.count || 0);
    const totalThirdPlace = existingCount + newThirdPlaceCount;

    if (totalThirdPlace > maxThirdPlace) {
      throw new QualificationPredictionError(
        `Máximo ${maxThirdPlace} clasificados de tercer lugar permitidos. Otros grupos tienen ${existingCount} seleccionados. Este grupo intenta agregar ${newThirdPlaceCount}, lo cual excedería el límite.`,
        'MAX_THIRD_PLACE_EXCEEDED'
      );
    }
  }

  // Build predictions array
  const predictions: QualifiedTeamPredictionNew[] = positionUpdates.map((update) => ({
    user_id: userId,
    tournament_id: tournamentId,
    group_id: groupId,
    team_id: update.teamId,
    predicted_position: update.position,
    predicted_to_qualify: update.qualifies,
  }));

  // Execute batch update in transaction
  try {
    await batchUpsertQualificationPredictions(predictions);

    return {
      success: true,
      message: `Actualizadas ${predictions.length} predicciones exitosamente`,
      predictions,
    };
  } catch (error) {
    console.error('Error updating group positions:', error);
    throw new QualificationPredictionError(
      'Error al guardar las predicciones. Por favor intenta de nuevo.',
      'DATABASE_ERROR'
    );
  }
}

/**
 * Update all team positions for a group using JSONB atomic batch update
 * This is the preferred approach as it ensures atomic updates at the database level
 *
 * @param groupId - The tournament group ID
 * @param tournamentId - The tournament ID
 * @param positionUpdates - Array of {teamId, position, qualifies}
 * @returns Updated predictions or error
 */
export async function updateGroupPositionsJsonb(
  groupId: string,
  tournamentId: string,
  positionUpdates: Array<{ teamId: string; position: number; qualifies: boolean }>
): Promise<{ success: boolean; message: string }> {
  // Validation: User authentication
  const user = await getLoggedInUser();
  if (!user?.id) {
    throw new QualificationPredictionError(
      'Debes iniciar sesión para actualizar predicciones',
      'UNAUTHORIZED'
    );
  }

  const userId = user.id;

  // Validation: Empty array
  if (positionUpdates.length === 0) {
    return { success: true, message: 'No hay predicciones para actualizar' };
  }

  // Validation: Tournament exists and is not locked
  const tournament = await db
    .selectFrom('tournaments')
    .where('id', '=', tournamentId)
    .select(['id', 'is_active', 'allows_third_place_qualification', 'max_third_place_qualifiers'])
    .executeTakeFirst();

  if (!tournament) {
    throw new QualificationPredictionError('Torneo no encontrado', 'TOURNAMENT_NOT_FOUND');
  }

  if (!tournament.is_active) {
    throw new QualificationPredictionError(
      'Las predicciones están bloqueadas para este torneo',
      'TOURNAMENT_LOCKED'
    );
  }

  // Validation: All teams belong to the specified group
  const teamIds = positionUpdates.map((u) => u.teamId);
  const teamsInGroup = await db
    .selectFrom('tournament_group_teams')
    .where('tournament_group_id', '=', groupId)
    .where('team_id', 'in', teamIds)
    .select('team_id')
    .execute();

  if (teamsInGroup.length !== teamIds.length) {
    throw new QualificationPredictionError(
      'Uno o más equipos no pertenecen al grupo especificado',
      'INVALID_TEAM_GROUP'
    );
  }

  // Validation: No duplicate team_ids
  const uniqueTeamIds = new Set(teamIds);
  if (uniqueTeamIds.size !== teamIds.length) {
    throw new QualificationPredictionError(
      'No se puede asignar el mismo equipo a múltiples posiciones',
      'DUPLICATE_TEAM'
    );
  }

  // Validation: Positions are valid and unique
  const positionNumbers = positionUpdates.map((u) => u.position);
  if (positionNumbers.some((p) => p < 1)) {
    throw new QualificationPredictionError(
      'La posición predicha debe ser al menos 1',
      'INVALID_POSITION'
    );
  }

  const uniquePositions = new Set(positionNumbers);
  if (uniquePositions.size !== positionNumbers.length) {
    throw new QualificationPredictionError(
      'Las posiciones deben ser únicas dentro del grupo',
      'DUPLICATE_POSITION'
    );
  }

  // Validation: Qualification flags are correct for positions
  const invalidQualification = positionUpdates.find(
    (u) => u.position <= 2 && !u.qualifies
  );
  if (invalidQualification) {
    throw new QualificationPredictionError(
      'Los equipos en posiciones 1-2 deben estar marcados como clasificados',
      'INVALID_QUALIFICATION_FLAG'
    );
  }

  // Validation: Max third place qualifiers
  if (tournament.allows_third_place_qualification) {
    const maxThirdPlace = tournament.max_third_place_qualifiers || 0;
    const newThirdPlaceCount = positionUpdates.filter(
      (u) => u.position === 3 && u.qualifies
    ).length;

    // Get all other groups' predictions to count existing third place qualifiers
    const allGroupPredictions = await getAllUserGroupPositionsPredictions(userId, tournamentId);

    // Count third place qualifiers from OTHER groups (exclude current group)
    let existingThirdPlaceCount = 0;
    for (const groupPrediction of allGroupPredictions) {
      if (groupPrediction.group_id !== groupId) {
        const groupPositions = groupPrediction.team_predicted_positions as unknown as TeamPositionPrediction[];
        const thirdPlaceQualifiers = groupPositions.filter(
          (p) => p.predicted_position === 3 && p.predicted_to_qualify
        );
        existingThirdPlaceCount += thirdPlaceQualifiers.length;
      }
    }

    const totalThirdPlace = existingThirdPlaceCount + newThirdPlaceCount;

    if (totalThirdPlace > maxThirdPlace) {
      throw new QualificationPredictionError(
        `Máximo ${maxThirdPlace} clasificados de tercer lugar permitidos. Otros grupos tienen ${existingThirdPlaceCount} seleccionados. Este grupo intenta agregar ${newThirdPlaceCount}, lo cual excedería el límite.`,
        'MAX_THIRD_PLACE_EXCEEDED'
      );
    }
  }

  // Build TeamPositionPrediction array for JSONB
  const positions: TeamPositionPrediction[] = positionUpdates.map((update) => ({
    team_id: update.teamId,
    predicted_position: update.position,
    predicted_to_qualify: update.qualifies,
  }));

  // Execute atomic JSONB upsert
  try {
    await upsertGroupPositionsPrediction(userId, tournamentId, groupId, positions);

    return {
      success: true,
      message: `Actualizadas ${positions.length} predicciones exitosamente`,
    };
  } catch (error) {
    console.error('Error updating group positions (JSONB):', error);
    throw new QualificationPredictionError(
      'Error al guardar las predicciones. Por favor intenta de nuevo.',
      'DATABASE_ERROR'
    );
  }
}
