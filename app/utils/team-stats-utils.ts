/**
 * Team Stats Utility Functions
 *
 * These are pure utility functions that can be safely used in both
 * client and server components. They have no database dependencies.
 */

import { TeamStats } from '../db/tables-definition';

/**
 * Check if all team positions in a group are complete
 */
export const groupCompleteReducer = (teamPositions: TeamStats[]): boolean => {
  return teamPositions.reduce<boolean>(
    (previousValue, teamPosition) => previousValue && teamPosition.is_complete,
    true
  );
};
