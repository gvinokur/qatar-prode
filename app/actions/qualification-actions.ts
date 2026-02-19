'use server';

import { getTranslations } from 'next-intl/server';
import type { Locale } from '../../i18n.config';
import { getLoggedInUser } from './user-actions';
import {
  upsertGroupPositionsPrediction,
  getAllUserGroupPositionsPredictions,
} from '../db/qualified-teams-repository';
import { TeamPositionPrediction } from '../db/tables-definition';
import { db } from '../db/database';
import { QualificationPredictionError } from './qualification-errors';

/**
 * Get tournament configuration for qualified teams feature
 * Used by client components to determine UI behavior
 */
export async function getTournamentQualificationConfig(
  tournamentId: string,
  locale: Locale = 'es'
): Promise<{
  success: boolean;
  error?: string;
  data?: {
    allowsThirdPlace: boolean;
    maxThirdPlace: number;
    isLocked: boolean;
  };
}> {
  try {
    const t = await getTranslations({ locale, namespace: 'tournaments' });
    const tournament = await db
      .selectFrom('tournaments')
      .where('id', '=', tournamentId)
      .select(['is_active', 'allows_third_place_qualification', 'max_third_place_qualifiers'])
      .executeTakeFirst();

    if (!tournament) {
      return { success: false, error: t('qualification.tournamentNotFound') };
    }

    // Check if predictions are locked (5 days after tournament starts)
    // Same logic as tournament awards (honor roll, individual awards)
    const { getTournamentStartDate } = await import('./tournament-actions');
    const tournamentStartDate = await getTournamentStartDate(tournamentId);
    const isPredictionLocked = tournamentStartDate
      ? Date.now() > tournamentStartDate.getTime() + 5 * 24 * 60 * 60 * 1000
      : false;

    return {
      success: true,
      data: {
        allowsThirdPlace: tournament.allows_third_place_qualification || false,
        maxThirdPlace: tournament.max_third_place_qualifiers || 0,
        isLocked: isPredictionLocked,
      },
    };
  } catch (error) {
    console.error('Error getting tournament qualification config:', error);
    const tErrors = await getTranslations({ locale, namespace: 'errors' });
    return { success: false, error: tErrors('generic') };
  }
}

/** Helper: Validate teams belong to group */
async function validateTeamsInGroup(teamIds: string[], groupId: string): Promise<void> {
  for (const teamId of teamIds) {
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

/** Helper: Validate no duplicate teams */
function validateNoDuplicateTeams(teamIds: string[]): void {
  const unique = new Set(teamIds);
  if (unique.size !== teamIds.length) {
    throw new QualificationPredictionError('Hay equipos duplicados', 'DUPLICATE_TEAMS');
  }
}

/** Helper: Validate positions are valid and unique */
function validatePositionsValidAndUnique(positions: number[]): void {
  // Check all positions >= 1
  if (positions.some((p) => p < 1)) {
    throw new QualificationPredictionError(
      'Todas las posiciones deben ser al menos 1',
      'INVALID_POSITION'
    );
  }

  // Check positions are unique
  const unique = new Set(positions);
  if (unique.size !== positions.length) {
    throw new QualificationPredictionError('Hay posiciones duplicadas', 'DUPLICATE_POSITIONS');
  }
}

/** Helper: Validate qualification flags for positions */
function validateQualificationFlagsForPositions(
  updates: Array<{ position: number; qualifies: boolean }>
): void {
  // Positions 1-2 must be qualified
  const invalidFlags = updates.filter((u) => u.position <= 2 && !u.qualifies);
  if (invalidFlags.length > 0) {
    throw new QualificationPredictionError(
      'Los equipos en posiciones 1 y 2 deben estar calificados',
      'INVALID_QUALIFICATION_FLAG'
    );
  }
}

/** Helper: Validate third place qualifiers for group */
async function validateThirdPlaceForGroup(
  updates: Array<{ position: number; qualifies: boolean }>,
  tournament: { allows_third_place_qualification: boolean | null; max_third_place_qualifiers: number | null },
  userId: string,
  tournamentId: string,
  groupId: string
): Promise<void> {
  if (!tournament.allows_third_place_qualification) {
    // If tournament doesn't allow third place, position 3+ should not be qualified
    const invalidThirdPlace = updates.filter((u) => u.position >= 3 && u.qualifies);
    if (invalidThirdPlace.length > 0) {
      throw new QualificationPredictionError(
        'Este torneo no permite calificar equipos de tercer lugar',
        'THIRD_PLACE_NOT_ALLOWED'
      );
    }
    return;
  }

  // Count third place selections for this group
  const thirdPlaceInGroup = updates.filter((u) => u.position === 3 && u.qualifies).length;

  // Get all user's other groups to count total third place selections
  const allGroupPredictions = await getAllUserGroupPositionsPredictions(userId, tournamentId);

  // Count third place selections across all OTHER groups
  const thirdPlaceInOtherGroups = allGroupPredictions
    .filter((gp) => gp.group_id !== groupId)
    .reduce((count, gp) => {
      const positions = gp.team_predicted_positions as unknown as TeamPositionPrediction[];
      return count + positions.filter((t) => t.predicted_position === 3 && t.predicted_to_qualify).length;
    }, 0);

  const totalThirdPlace = thirdPlaceInGroup + thirdPlaceInOtherGroups;
  const maxThirdPlace = tournament.max_third_place_qualifiers || 0;

  if (totalThirdPlace > maxThirdPlace) {
    throw new QualificationPredictionError(
      `Solo puedes seleccionar ${maxThirdPlace} equipos de tercer lugar en total. Tienes ${totalThirdPlace}.`,
      'TOO_MANY_THIRD_PLACE'
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
 * @param locale - The locale for error messages
 * @returns Updated predictions or error
 */
export async function updateGroupPositionsJsonb(
  groupId: string,
  tournamentId: string,
  positionUpdates: Array<{ teamId: string; position: number; qualifies: boolean }>,
  locale: Locale = 'es'
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const t = await getTranslations({ locale, namespace: 'tournaments' });

    // Validation: User authentication
    const user = await getLoggedInUser();
    if (!user?.id) {
      return { success: false, error: t('qualification.unauthorized') };
    }

    const userId = user.id;

    // Validation: Empty array
    if (positionUpdates.length === 0) {
      return { success: true, message: t('qualification.noUpdates') };
    }

    // Validation: Tournament exists and is not locked
    const tournament = await db
      .selectFrom('tournaments')
      .where('id', '=', tournamentId)
      .select(['id', 'is_active', 'allows_third_place_qualification', 'max_third_place_qualifiers', 'dev_only'])
      .executeTakeFirst();

    if (!tournament) {
      return { success: false, error: t('qualification.tournamentNotFound') };
    }

    // Check if editing is allowed via dev override (dev/preview environment + dev tournament)
    const isDevelopmentEnvironment = process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview';
    const isDevTournament = tournament.dev_only === true;
    const allowDevOverride = isDevelopmentEnvironment && isDevTournament;

    if (!tournament.is_active && !allowDevOverride) {
      return { success: false, error: t('qualification.tournamentLocked') };
    }

    const teamIds = positionUpdates.map((u) => u.teamId);
    const positionNumbers = positionUpdates.map((u) => u.position);

    // Run all validations
    await validateTeamsInGroup(teamIds, groupId);
    validateNoDuplicateTeams(teamIds);
    validatePositionsValidAndUnique(positionNumbers);
    validateQualificationFlagsForPositions(positionUpdates);
    await validateThirdPlaceForGroup(
      positionUpdates,
      {
        allows_third_place_qualification: tournament.allows_third_place_qualification ?? null,
        max_third_place_qualifiers: tournament.max_third_place_qualifiers ?? null
      },
      userId,
      tournamentId,
      groupId
    );

    // Build TeamPositionPrediction array for JSONB
    const positions: TeamPositionPrediction[] = positionUpdates.map((update) => ({
      team_id: update.teamId,
      predicted_position: update.position,
      predicted_to_qualify: update.qualifies,
    }));

    // Execute atomic JSONB upsert
    await upsertGroupPositionsPrediction(userId, tournamentId, groupId, positions);

    // Update playoff game guesses based on new qualification predictions
    // Import dynamically to avoid circular dependencies
    const { updatePlayoffGameGuesses } = await import('./guesses-actions');
    await updatePlayoffGameGuesses(tournamentId, { id: userId });

    return {
      success: true,
      message: t('qualification.updateSuccess', { count: positions.length }),
    };
  } catch (error) {
    console.error('Error updating group positions (JSONB):', error);
    // If it's a QualificationPredictionError, extract the Spanish message
    if (error instanceof QualificationPredictionError) {
      return { success: false, error: error.message };
    }
    const tErrors = await getTranslations({ locale, namespace: 'errors' });
    return { success: false, error: tErrors('generic') };
  }
}
