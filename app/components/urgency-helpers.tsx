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

  if (!tournamentStartDate) return 'complete';

  const lockTime = new Date(tournamentStartDate.getTime() + 5 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const hoursUntilLock = (lockTime.getTime() - now.getTime()) / (60 * 60 * 1000);

  if (hoursUntilLock < 0) return 'locked';
  if (hoursUntilLock < 2) return 'urgent';
  if (hoursUntilLock < 24) return 'warning';
  if (hoursUntilLock < 48) return 'notice';
  return 'complete';
}

/**
 * Returns the appropriate icon for a given urgency level
 * @param level - The urgency level
 * @returns A React icon component with appropriate styling
 */
export function getUrgencyIcon(level: UrgencyLevel) {
  switch (level) {
    case 'urgent':
      return <ErrorIcon sx={{ color: 'error.main', fontSize: '1.25rem' }} />;
    case 'warning':
      return <WarningIcon sx={{ color: 'warning.main', fontSize: '1.25rem' }} />;
    case 'notice':
      return <InfoIcon sx={{ color: 'info.main', fontSize: '1.25rem' }} />;
    case 'complete':
      return <CheckCircleIcon sx={{ color: 'success.main', fontSize: '1.25rem' }} />;
    case 'locked':
      return <LockIcon sx={{ color: 'action.disabled', fontSize: '1.25rem' }} />;
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
