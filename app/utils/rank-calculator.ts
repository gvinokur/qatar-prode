/**
 * Rank calculation utilities for leaderboards
 * Implements competition ranking (1-2-2-4 for ties)
 */

export interface RankableUser {
  [key: string]: any;
}

export type UserWithRank<T extends RankableUser> = T & {
  currentRank: number;
};

export type UserWithRankChange<T extends RankableUser> = UserWithRank<T> & {
  rankChange: number;  // Positive = moved up, negative = moved down, 0 = no change
};

/**
 * Calculate competition ranks for a list of users based on a numeric field
 * Implements competition ranking: [50, 45, 45, 40] → [1, 2, 2, 4]
 *
 * @param users - Array of users to rank
 * @param scoreField - Field name to use for ranking (e.g., 'totalPoints')
 * @returns Array of users with currentRank added
 */
export function calculateRanks<T extends RankableUser>(
  users: T[],
  scoreField: keyof T
): UserWithRank<T>[] {
  if (users.length === 0) return [];

  // Sort by score descending (highest first)
  const sorted = [...users].sort((a, b) => {
    const scoreA = Number(a[scoreField]) || 0;
    const scoreB = Number(b[scoreField]) || 0;
    return scoreB - scoreA;
  });

  let currentRank = 1;
  let previousScore: number | null = null;
  let usersAtCurrentScore = 0;

  return sorted.map((user) => {
    const score = Number(user[scoreField]) || 0;

    if (previousScore !== null && score < previousScore) {
      // Score changed, advance rank by number of users at previous score
      currentRank += usersAtCurrentScore;
      usersAtCurrentScore = 1;
    } else {
      // Same score or first user
      usersAtCurrentScore++;
    }

    previousScore = score;

    return {
      ...user,
      currentRank,
    };
  });
}

/**
 * Calculate ranks with day-over-day change comparison
 *
 * @param users - Array of users with current ranks
 * @param yesterdayScoreField - Field name for yesterday's score (e.g., 'yesterdayTotalPoints')
 * @returns Array of users with rankChange added
 */
export function calculateRanksWithChange<T extends RankableUser>(
  users: UserWithRank<T>[],
  yesterdayScoreField: keyof T
): UserWithRankChange<T>[] {
  // Calculate yesterday's ranks using the same users but different field
  const usersWithYesterdayData = users.map(user => ({
    ...user,
    _yesterdayScore: user[yesterdayScoreField],
  }));

  const yesterdayRanked = calculateRanks(usersWithYesterdayData, '_yesterdayScore');

  // Create map of userId to yesterday rank
  const yesterdayRankMap = new Map(
    yesterdayRanked.map(u => [u.userId || u.user_id || u.id, u.currentRank])
  );

  // Add rank change to each user
  return users.map(user => {
    const userId = (user as any).userId || (user as any).user_id || (user as any).id;
    const yesterdayRank = yesterdayRankMap.get(userId);

    // If no yesterday rank, treat as no change (user is new or no history)
    const rankChange = yesterdayRank === undefined
      ? 0
      : yesterdayRank - user.currentRank;  // Positive means moved up (lower rank number)

    return {
      ...user,
      rankChange,
    };
  });
}
