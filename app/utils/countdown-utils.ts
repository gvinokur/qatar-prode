import { Theme } from '@mui/material/styles';

export const ONE_HOUR = 60 * 60 * 1000;

export type UrgencyLevel = 'safe' | 'notice' | 'warning' | 'urgent' | 'closed';

/**
 * Calculate the prediction deadline (1 hour before game start)
 */
export function calculateDeadline(gameDate: Date): number {
  return gameDate.getTime() - ONE_HOUR;
}

/**
 * Format milliseconds as human-readable countdown
 * Examples: "3h 45m", "45m", "2 days", "30s"
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) {
    return 'Closed';
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days === 1 ? '1 day' : `${days} days`;
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${hours}h`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${seconds}s`;
}

/**
 * Determine urgency level based on time remaining until deadline
 * - safe: >48h
 * - notice: 24-48h
 * - warning: 1-24h
 * - urgent: <1h
 * - closed: <0
 */
export function getUrgencyLevel(ms: number): UrgencyLevel {
  if (ms <= 0) {
    return 'closed';
  }

  const hours = ms / ONE_HOUR;

  if (hours < 1) {
    return 'urgent';
  }

  if (hours < 24) {
    return 'warning';
  }

  if (hours < 48) {
    return 'notice';
  }

  return 'safe';
}

/**
 * Calculate progress bar percentage (100% at 48h before deadline, 0% at deadline)
 */
export function calculateProgress(gameDate: Date, currentTime: number): number {
  const deadline = calculateDeadline(gameDate);
  const fortyEightHoursBefore = deadline - (48 * ONE_HOUR);

  if (currentTime >= deadline) {
    return 0;
  }

  if (currentTime <= fortyEightHoursBefore) {
    return 100;
  }

  const totalWindow = 48 * ONE_HOUR;
  const elapsed = currentTime - fortyEightHoursBefore;
  const remaining = totalWindow - elapsed;

  return Math.max(0, Math.min(100, (remaining / totalWindow) * 100));
}

/**
 * Get MUI theme color for urgency level
 */
export function getUrgencyColor(theme: Theme, urgency: UrgencyLevel): string {
  switch (urgency) {
    case 'safe':
      return theme.palette.success.main;
    case 'notice':
      return theme.palette.info.main;
    case 'warning':
      return theme.palette.warning.main;
    case 'urgent':
      return theme.palette.error.main;
    case 'closed':
      return theme.palette.text.disabled;
    default:
      return theme.palette.text.secondary;
  }
}
