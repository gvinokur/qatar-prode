import { useMemo } from 'react';
import { useCountdownContext } from '../components/context-providers/countdown-context-provider';
import {
  calculateDeadline,
  formatCountdown,
  getUrgencyLevel,
  calculateProgress,
  shouldShowProgressBar,
  type UrgencyLevel,
} from '../utils/countdown-utils';

interface GameCountdownState {
  /** Raw countdown string (e.g., "3h 45m") - for interpolation into translated string */
  countdown: string;
  /** Urgency level for color coding */
  urgency: UrgencyLevel;
  /** Progress bar percentage (0-100) */
  progressPercent: number;
  /** Time remaining in milliseconds */
  timeRemaining: number;
  /** Whether predictions are closed */
  isClosed: boolean;
  /** Whether progress bar should be shown (only within 48h window) */
  shouldShowProgressBar: boolean;
}

/**
 * Hook for calculating countdown state for a game's prediction deadline.
 * Subscribes to the shared countdown context for efficient updates.
 *
 * @param gameDate - The date and time when the game starts
 * @returns Countdown state including display text, urgency level, and progress
 */
export function useGameCountdown(gameDate: Date): GameCountdownState {
  const { currentTime } = useCountdownContext();

  return useMemo(() => {
    const deadline = calculateDeadline(gameDate);
    const timeRemaining = deadline - currentTime;
    const isClosed = timeRemaining <= 0;
    const urgency = getUrgencyLevel(timeRemaining);
    const progressPercent = calculateProgress(gameDate, currentTime);
    const shouldShowProgress = shouldShowProgressBar(timeRemaining);

    // Return raw countdown string for component-level formatting
    const countdown = formatCountdown(timeRemaining);

    return {
      countdown,
      urgency,
      progressPercent,
      timeRemaining,
      isClosed,
      shouldShowProgressBar: shouldShowProgress,
    };
  }, [gameDate, currentTime]);
}
