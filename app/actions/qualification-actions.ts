'use server';

import { revalidatePath } from 'next/cache';
import { getLoggedInUser } from './user-actions';
import {
  upsertGroupPositionsPrediction,
  getAllUserGroupPositionsPredictions,
} from '../db/qualified-teams-repository';
import { TeamPositionPrediction } from '../db/tables-definition';
import { db } from '../db/database';
import { QualificationPredictionError } from './qualification-errors';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '../../i18n.config';
import { PREDICTION_LOCK_OFFSET_MS } from '../utils/prediction-constants';
import { computeGroupStandingsFromGuesses } from '../utils/group-standings-calculator';
import { findGameGuessesByUserId } from '../db/game-guess-repository';

/**
 * Get tournament configuration for qualified teams feature
 * Used by client components to determine UI behavior
 */
export async function getTournamentQualificationConfig(tournamentId: string, locale: Locale = 'es'): Promise<{
  allowsThirdPlace: boolean;
  maxThirdPlace: number;
  isLocked: boolean;
}> {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  const tournament = await db
    .selectFrom('tournaments')
    .where('id', '=', tournamentId)
    .select(['is_active', 'allows_third_place_qualification', 'max_third_place_qualifiers'])
    .executeTakeFirst();

  if (!tournament) {
    throw new QualificationPredictionError(t('qualification.tournamentNotFound'), 'TOURNAMENT_NOT_FOUND');
  }

  // Check if predictions are locked after the lock window after tournament starts
  const { getTournamentStartDate } = await import('./tournament-actions');
  const tournamentStartDate = await getTournamentStartDate(tournamentId);
  const isPredictionLocked = tournamentStartDate
    ? Date.now() > tournamentStartDate.getTime() + PREDICTION_LOCK_OFFSET_MS
    : false;

  return {
    allowsThirdPlace: tournament.allows_third_place_qualification || false,
    maxThirdPlace: tournament.max_third_place_qualifiers || 0,
    isLocked: isPredictionLocked,
  };
}

/** Helper: Validate teams belong to group */
async function validateTeamsInGroup(teamIds: string[], groupId: string, locale: Locale = 'es'): Promise<void> {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  for (const teamId of teamIds) {
    const teamInGroup = await db
      .selectFrom('tournament_group_teams')
      .where('tournament_group_id', '=', groupId)
      .where('team_id', '=', teamId)
      .select('id')
      .executeTakeFirst();

    if (!teamInGroup) {
      throw new QualificationPredictionError(
        t('qualification.invalidTeamGroup', { teamId, groupId }),
        'INVALID_TEAM_GROUP'
      );
    }
  }
}

/** Helper: Validate no duplicate teams */
async function validateNoDuplicateTeams(teamIds: string[], locale: Locale = 'es'): Promise<void> {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  const unique = new Set(teamIds);
  if (unique.size !== teamIds.length) {
    throw new QualificationPredictionError(t('qualification.duplicateTeams'), 'DUPLICATE_TEAMS');
  }
}

/** Helper: Validate positions are valid and unique */
async function validatePositionsValidAndUnique(positions: number[], locale: Locale = 'es'): Promise<void> {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  // Check all positions >= 1
  if (positions.some((p) => p < 1)) {
    throw new QualificationPredictionError(
      t('qualification.invalidPosition'),
      'INVALID_POSITION'
    );
  }

  // Check positions are unique
  const unique = new Set(positions);
  if (unique.size !== positions.length) {
    throw new QualificationPredictionError(t('qualification.duplicatePositions'), 'DUPLICATE_POSITIONS');
  }
}

/** Helper: Validate qualification flags for positions */
async function validateQualificationFlagsForPositions(
  updates: Array<{ position: number; qualifies: boolean }>,
  locale: Locale = 'es'
): Promise<void> {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  // Positions 1-2 must be qualified
  const invalidFlags = updates.filter((u) => u.position <= 2 && !u.qualifies);
  if (invalidFlags.length > 0) {
    throw new QualificationPredictionError(
      t('qualification.invalidQualificationFlag'),
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
  groupId: string,
  locale: Locale = 'es'
): Promise<void> {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  if (!tournament.allows_third_place_qualification) {
    // If tournament doesn't allow third place, position 3+ should not be qualified
    const invalidThirdPlace = updates.filter((u) => u.position >= 3 && u.qualifies);
    if (invalidThirdPlace.length > 0) {
      throw new QualificationPredictionError(
        t('qualification.thirdPlaceNotAllowed'),
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
      t('qualification.tooManyThirdPlace', { maxThirdPlace, totalThirdPlace }),
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
 * @returns Updated predictions or error
 */
export async function updateGroupPositionsJsonb(
  groupId: string,
  tournamentId: string,
  positionUpdates: Array<{ teamId: string; position: number; qualifies: boolean }>,
  locale: Locale = 'es'
): Promise<{ success: boolean; message: string }> {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  // Validation: User authentication
  const user = await getLoggedInUser();
  if (!user?.id) {
    return {
      success: false,
      message: t('qualification.unauthorized')
    };
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
    return {
      success: false,
      message: t('qualification.tournamentNotFound')
    };
  }

  // Check if editing is allowed via dev override (dev/preview environment + dev tournament)
  const isDevelopmentEnvironment = process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview';
  const isDevTournament = tournament.dev_only === true;
  const allowDevOverride = isDevelopmentEnvironment && isDevTournament;

  if (!tournament.is_active && !allowDevOverride) {
    return {
      success: false,
      message: t('qualification.tournamentLocked')
    };
  }

  const teamIds = positionUpdates.map((u) => u.teamId);
  const positionNumbers = positionUpdates.map((u) => u.position);

  // Run all validations - wrap in try-catch to convert thrown errors to return objects
  try {
    await validateTeamsInGroup(teamIds, groupId, locale);
    await validateNoDuplicateTeams(teamIds, locale);
    await validatePositionsValidAndUnique(positionNumbers, locale);
    await validateQualificationFlagsForPositions(positionUpdates, locale);
    await validateThirdPlaceForGroup(
      positionUpdates,
      {
        allows_third_place_qualification: tournament.allows_third_place_qualification ?? null,
        max_third_place_qualifiers: tournament.max_third_place_qualifiers ?? null
      },
      userId,
      tournamentId,
      groupId,
      locale
    );
  } catch (error) {
    // Convert QualificationPredictionError to return object
    if (error instanceof QualificationPredictionError) {
      return {
        success: false,
        message: error.message
      };
    }
    // Unexpected errors - log and return generic message
    console.error('Unexpected validation error:', error);
    return {
      success: false,
      message: t('qualification.saveFailed')
    };
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
    return {
      success: false,
      message: t('qualification.saveFailed')
    };
  }
}

/**
 * Bulk auto-fill QT predictions for all groups based on user's own game guess scores.
 * All-or-nothing: aborts without saving if any group has incomplete game predictions.
 */
export async function bulkAutoFillFromPredictions(
  tournamentId: string,
  locale: Locale = 'es'
): Promise<{ success: boolean; message: string; groupsProcessed: number }> {
  const t = await getTranslations({ locale, namespace: 'qualified-teams' });

  // 1. Auth
  const user = await getLoggedInUser();
  if (!user?.id) {
    return { success: false, message: t('page.saveError'), groupsProcessed: 0 };
  }
  const userId = user.id;

  // 2. Tournament lock check
  const tournament = await db
    .selectFrom('tournaments')
    .where('id', '=', tournamentId)
    .select(['id', 'is_active', 'allows_third_place_qualification', 'max_third_place_qualifiers', 'dev_only'])
    .executeTakeFirst();

  if (!tournament) {
    return { success: false, message: t('page.saveError'), groupsProcessed: 0 };
  }

  const isDevelopmentEnvironment = process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview';
  const isDevTournament = tournament.dev_only === true;
  const allowDevOverride = isDevelopmentEnvironment && isDevTournament;

  if (!tournament.is_active && !allowDevOverride) {
    return { success: false, message: t('page.lockedAlert'), groupsProcessed: 0 };
  }

  // 3. Fetch all groups for the tournament
  const groups = await db
    .selectFrom('tournament_groups')
    .where('tournament_id', '=', tournamentId)
    .select(['id', 'group_letter'])
    .execute();

  if (groups.length === 0) {
    return { success: false, message: t('page.saveError'), groupsProcessed: 0 };
  }

  // 4. Fetch all group-stage games with their group assignments
  const groupGamesRaw = await db
    .selectFrom('games')
    .innerJoin('tournament_group_games', 'tournament_group_games.game_id', 'games.id')
    .where('games.tournament_id', '=', tournamentId)
    .where('games.game_type', '=', 'group')
    .select([
      'games.id as game_id',
      'games.home_team',
      'games.away_team',
      'tournament_group_games.tournament_group_id as group_id',
    ])
    .execute();

  // 5. Fetch user's game guesses and build a map keyed by game_id
  const guesses = await findGameGuessesByUserId(userId, tournamentId);
  const guessMap: Record<string, { home_score: number | null; away_score: number | null }> = {};
  for (const guess of guesses) {
    guessMap[guess.game_id] = {
      home_score: guess.home_score ?? null,
      away_score: guess.away_score ?? null,
    };
  }

  // 6. Group games by group_id and check completeness (all-or-nothing)
  const gamesByGroup = new Map<string, typeof groupGamesRaw>();
  for (const game of groupGamesRaw) {
    if (!gamesByGroup.has(game.group_id)) {
      gamesByGroup.set(game.group_id, []);
    }
    gamesByGroup.get(game.group_id)!.push(game);
  }

  for (const [groupId, games] of gamesByGroup) {
    const incompleteCount = games.filter((g) => {
      const guess = guessMap[g.game_id];
      return !guess || guess.home_score === null || guess.away_score === null;
    }).length;
    if (incompleteCount > 0) {
      return {
        success: false,
        message: t('nudge.autoFillError'),
        groupsProcessed: 0,
      };
    }
  }

  // 7. Compute standings per group
  interface ThirdPlaceCandidate {
    teamId: string;
    groupId: string;
    points: number;
    goalDiff: number;
    goalsFor: number;
  }
  const thirdPlaceCandidates: ThirdPlaceCandidate[] = [];
  const standingsByGroup = new Map<string, ReturnType<typeof computeGroupStandingsFromGuesses>>();

  for (const group of groups) {
    const games = gamesByGroup.get(group.id) ?? [];
    const groupGames = games
      .filter((g) => g.home_team && g.away_team)
      .map((g) => ({ id: g.game_id, home_team: g.home_team!, away_team: g.away_team! }));

    const standings = computeGroupStandingsFromGuesses(groupGames, guessMap);
    standingsByGroup.set(group.id, standings);

    const third = standings.find((s) => s.position === 3);
    if (third) {
      thirdPlaceCandidates.push({
        teamId: third.teamId,
        groupId: group.id,
        points: third.points,
        goalDiff: third.goalDiff,
        goalsFor: third.goalsFor,
      });
    }
  }

  // 8. Select top maxThirdPlace 3rd-place teams
  const maxThirdPlace = tournament.max_third_place_qualifiers ?? 0;
  const allowsThirdPlace = tournament.allows_third_place_qualification ?? false;

  const qualifyingThirdPlaceGroupIds = new Set<string>();
  if (allowsThirdPlace && maxThirdPlace > 0) {
    thirdPlaceCandidates.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.teamId.localeCompare(b.teamId);
    });
    for (const candidate of thirdPlaceCandidates.slice(0, maxThirdPlace)) {
      qualifyingThirdPlaceGroupIds.add(candidate.groupId);
    }
  }

  // 9. Save all groups
  const { updatePlayoffGameGuesses } = await import('./guesses-actions');

  for (const group of groups) {
    const standings = standingsByGroup.get(group.id) ?? [];
    const positions: TeamPositionPrediction[] = standings.map((s) => ({
      team_id: s.teamId,
      predicted_position: s.position,
      predicted_to_qualify:
        s.position <= 2 ||
        (s.position === 3 && allowsThirdPlace && qualifyingThirdPlaceGroupIds.has(group.id)),
    }));

    await upsertGroupPositionsPrediction(userId, tournamentId, group.id, positions);
  }

  await updatePlayoffGameGuesses(tournamentId, { id: userId });

  revalidatePath(`/[locale]/tournaments/${tournamentId}/qualified-teams`, 'page');

  return { success: true, message: t('nudge.gamesFinished.message'), groupsProcessed: groups.length };
}
