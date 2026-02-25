import React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import LockIcon from '@mui/icons-material/Lock';
import type { ExtendedGameData } from '../definitions';
import { TournamentPredictionCompletion } from '../db/tables-definition';

export type UrgencyLevel = 'urgent' | 'warning' | 'notice' | 'complete' | 'locked';

/**
 * Time constants for urgency calculations
 * Centralizes all time thresholds to avoid magic numbers
 */
export const URGENCY_TIME_CONSTANTS = {
  TOURNAMENT_LOCK_OFFSET_DAYS: 5,
  URGENT_THRESHOLD_HOURS: 2,
  WARNING_THRESHOLD_HOURS: 24,
  NOTICE_THRESHOLD_HOURS: 48
} as const;

/**
 * Maps urgency levels to MUI theme colors
 * Centralized to avoid code duplication across components
 */
export const URGENCY_COLOR_MAP: Record<UrgencyLevel, string> = {
  urgent: 'error.main',
  warning: 'warning.main',
  notice: 'info.main',
  complete: 'success.main',
  locked: 'info.main'
} as const;

/**
 * Determines the urgency level for game predictions based on deadlines and prediction status
 * @param games - List of games to evaluate
 * @param gameGuesses - Record of user's game predictions
 * @returns The most urgent level found across all games
 */
export function getGameUrgencyLevel(
  games: ExtendedGameData[] | undefined,
  gameGuesses: Record<string, any>
): UrgencyLevel {
  if (!games || games.length === 0) return 'complete';

  const ONE_HOUR = 60 * 60 * 1000;
  const now = Date.now();

  let hasUrgent = false;
  let hasWarning = false;
  let hasNotice = false;
  let allClosed = true;
  let allPredicted = true;

  games.forEach(game => {
    const guess = gameGuesses[game.id];
    const isPredicted = guess?.home_score != null &&
      guess?.away_score != null &&
      typeof guess.home_score === 'number' &&
      typeof guess.away_score === 'number';

    if (!isPredicted) {
      allPredicted = false;
    }

    const deadline = game.game_date.getTime() - ONE_HOUR;
    const timeUntilClose = deadline - now;

    if (timeUntilClose > -ONE_HOUR) {
      allClosed = false;
    }

    if (!isPredicted && timeUntilClose > -ONE_HOUR) {
      if (timeUntilClose < 2 * ONE_HOUR) {
        hasUrgent = true;
      } else if (timeUntilClose < 24 * ONE_HOUR) {
        hasWarning = true;
      } else if (timeUntilClose < 48 * ONE_HOUR) {
        hasNotice = true;
      }
    }
  });

  if (allClosed) return 'locked';
  if (allPredicted) return 'complete';
  if (hasUrgent) return 'urgent';
  if (hasWarning) return 'warning';
  if (hasNotice) return 'notice';
  return 'complete';
}

/**
 * Determines the urgency level for tournament predictions based on lock date
 * @param tournamentPredictions - Tournament prediction completion data
 * @param tournamentStartDate - Date when tournament starts
 * @returns The urgency level for tournament predictions
 */
export function getTournamentUrgencyLevel(
  tournamentPredictions: TournamentPredictionCompletion | undefined,
  tournamentStartDate: Date | undefined
): UrgencyLevel {
  if (!tournamentPredictions) return 'complete';

  if (tournamentPredictions.isPredictionLocked) return 'locked';
  if (tournamentPredictions.overallPercentage === 100) return 'complete';

  if (!tournamentStartDate) return 'notice';

  const lockTime = new Date(
    tournamentStartDate.getTime() +
    URGENCY_TIME_CONSTANTS.TOURNAMENT_LOCK_OFFSET_DAYS * 24 * 60 * 60 * 1000
  );
  const now = new Date();
  const hoursUntilLock = (lockTime.getTime() - now.getTime()) / (60 * 60 * 1000);

  if (hoursUntilLock < 0) return 'locked';
  if (hoursUntilLock < URGENCY_TIME_CONSTANTS.URGENT_THRESHOLD_HOURS) return 'urgent';
  if (hoursUntilLock < URGENCY_TIME_CONSTANTS.WARNING_THRESHOLD_HOURS) return 'warning';
  if (hoursUntilLock < URGENCY_TIME_CONSTANTS.NOTICE_THRESHOLD_HOURS) return 'notice';
  return 'notice';
}

/**
 * Calculate urgency level for a specific tournament prediction category
 * @param completed - Number of predictions completed in this category
 * @param total - Total predictions needed in this category
 * @param isPredictionLocked - Whether predictions are locked
 * @param tournamentStartDate - Tournament start date (used to calculate lock time)
 * @returns Urgency level for this category
 */
export function getCategoryUrgencyLevel(
  completed: number,
  total: number,
  isPredictionLocked: boolean,
  tournamentStartDate: Date | undefined
): UrgencyLevel {
  if (isPredictionLocked) return 'locked';
  if (completed === total) return 'complete';
  if (!tournamentStartDate) return 'notice';  // Default to notice if no date

  // Lock time is TOURNAMENT_LOCK_OFFSET_DAYS after tournament start
  const lockTime = new Date(
    tournamentStartDate.getTime() +
    URGENCY_TIME_CONSTANTS.TOURNAMENT_LOCK_OFFSET_DAYS * 24 * 60 * 60 * 1000
  );
  const now = new Date();
  const hoursUntilLock = (lockTime.getTime() - now.getTime()) / (60 * 60 * 1000);

  if (hoursUntilLock < 0) return 'locked';
  if (hoursUntilLock < URGENCY_TIME_CONSTANTS.URGENT_THRESHOLD_HOURS) return 'urgent';
  if (hoursUntilLock < URGENCY_TIME_CONSTANTS.WARNING_THRESHOLD_HOURS) return 'warning';
  if (hoursUntilLock < URGENCY_TIME_CONSTANTS.NOTICE_THRESHOLD_HOURS) return 'notice';
  return 'notice';  // >48h = notice (not urgent, but incomplete)
}

/**
 * Get the worst (most urgent) urgency level from a list
 * Priority: urgent > warning > notice > complete > locked
 * @param levels - Urgency levels to compare
 * @returns The most urgent level
 */
export function getWorstUrgencyLevel(...levels: UrgencyLevel[]): UrgencyLevel {
  const priority: UrgencyLevel[] = ['urgent', 'warning', 'notice', 'complete', 'locked'];

  for (const level of priority) {
    if (levels.includes(level)) {
      return level;
    }
  }

  return 'complete';  // Fallback
}

/**
 * Returns the appropriate icon for a given urgency level
 * @param level - The urgency level
 * @param fontSize - Optional fontSize (default: '1.25rem' for 20px)
 * @returns A React icon component with appropriate styling
 */
export function getUrgencyIcon(level: UrgencyLevel, fontSize: number | string = '1.25rem') {
  const getIconSx = (color: string) => ({ color, fontSize });

  switch (level) {
    case 'urgent':
      return <ErrorIcon sx={getIconSx(URGENCY_COLOR_MAP.urgent)} />;
    case 'warning':
      return <WarningIcon sx={getIconSx(URGENCY_COLOR_MAP.warning)} />;
    case 'notice':
      return <InfoIcon sx={getIconSx(URGENCY_COLOR_MAP.notice)} />;
    case 'complete':
      return <CheckCircleIcon sx={getIconSx(URGENCY_COLOR_MAP.complete)} />;
    case 'locked':
      return <LockIcon sx={getIconSx(URGENCY_COLOR_MAP.locked)} />;
  }
}

/**
 * Checks if there are any games that need urgent attention (within 48 hours)
 * @param games - List of games to evaluate
 * @param gameGuesses - Record of user's game predictions
 * @returns True if any unpredicted games are closing within 48 hours
 */
export function hasUrgentGames(
  games: ExtendedGameData[] | undefined,
  gameGuesses: Record<string, any>
): boolean {
  if (!games || games.length === 0) return false;

  const ONE_HOUR = 60 * 60 * 1000;
  const now = Date.now();

  return games.some(game => {
    const guess = gameGuesses[game.id];
    const isPredicted = guess?.home_score != null &&
      guess?.away_score != null;

    if (isPredicted) return false;

    const deadline = game.game_date.getTime() - ONE_HOUR;
    const timeUntilClose = deadline - now;

    return timeUntilClose > -ONE_HOUR && timeUntilClose < 48 * ONE_HOUR;
  });
}
