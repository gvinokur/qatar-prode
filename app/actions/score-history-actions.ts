'use server'

import { findUsersByIds } from '../db/users-repository';
import { getScoreHistoryForUsers } from '../db/score-history-repository';
import { findFirstGameInTournament, findLastGameInTournament } from '../db/game-repository';

export interface ScoreHistoryDataPoint {
  date: number        // YYYYMMDD integer (same convention as snapshot_date)
  totalPoints: number
  rank: number        // Competition ranking (1224 style) relative to this group on this date
}

export interface UserScoreHistory {
  userId: string
  displayName: string
  data: ScoreHistoryDataPoint[]  // Only dates where this user has a snapshot (sparse OK)
}

export interface ScoreHistoryResult {
  userHistories: UserScoreHistory[]
  tournamentStartDate: number | null  // YYYYMMDD of first game; null if no games exist yet
  tournamentEndDate: number | null    // YYYYMMDD of last game; null if tournament has no games
  isEmpty: boolean                    // true when userHistories is empty (no snapshots at all)
}

/**
 * Convert a YYYYMMDD integer to a Date object (local time, no timezone shift).
 */
function yyyymmddToDate(d: number): Date {
  const year = Math.floor(d / 10000);
  const month = Math.floor((d % 10000) / 100) - 1; // 0-indexed
  const day = d % 100;
  return new Date(year, month, day);
}

/**
 * Convert a Date to a YYYYMMDD integer.
 */
function dateToYYYYMMDD(date: Date): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return y * 10000 + m * 100 + d;
}

/**
 * Compute 1224 competition ranks for a set of users on a specific date.
 * Users without a snapshot on this date are excluded (sparse history).
 * Returns a map from userId → rank.
 */
function computeRanksForDate(
  usersOnDate: Array<{ userId: string; totalPoints: number }>
): Map<string, number> {
  const sorted = [...usersOnDate].sort((a, b) => b.totalPoints - a.totalPoints);

  const rankMap = new Map<string, number>();
  let currentRank = 1;
  let previousPoints: number | null = null;
  let usersAtCurrentScore = 0;

  for (const user of sorted) {
    if (previousPoints !== null && user.totalPoints < previousPoints) {
      currentRank += usersAtCurrentScore;
      usersAtCurrentScore = 1;
    } else {
      usersAtCurrentScore++;
    }
    previousPoints = user.totalPoints;
    rankMap.set(user.userId, currentRank);
  }

  return rankMap;
}

/**
 * Fetch score history data for all current members of a group in a given tournament.
 * Ranks are computed per-date using 1224 competition ranking (ties share rank;
 * next rank skips). Users with no snapshot on a date are excluded from that date's
 * rank calculation (sparse history — connectNulls=false in charts).
 */
export async function getScoreHistoryForGroup(
  userIds: string[],
  tournamentId: string
): Promise<ScoreHistoryResult> {
  if (userIds.length === 0) {
    return { userHistories: [], tournamentStartDate: null, tournamentEndDate: null, isEmpty: true };
  }

  // 1. Fetch display names
  const users = await findUsersByIds(userIds);
  const displayNameByUserId = new Map(
    users.map((u) => [u.id, u.nickname ?? u.email])
  );

  // 3. Fetch raw snapshots + tournament date bounds (in parallel)
  const [rawHistory, firstGame, lastGame] = await Promise.all([
    getScoreHistoryForUsers(userIds, tournamentId),
    findFirstGameInTournament(tournamentId),
    findLastGameInTournament(tournamentId),
  ]);

  const tournamentStartDate = firstGame
    ? dateToYYYYMMDD(new Date(firstGame.game_date))
    : null;
  const tournamentEndDate = lastGame
    ? dateToYYYYMMDD(new Date(lastGame.game_date))
    : null;

  if (rawHistory.length === 0) {
    return {
      userHistories: [],
      tournamentStartDate,
      tournamentEndDate,
      isEmpty: true,
    };
  }

  // 4. Collect all unique dates (sorted) where ANY user has a snapshot
  const allDates = [...new Set(rawHistory.map((r) => r.snapshot_date))].sort((a, b) => a - b);

  // Build lookup: userId → Map<date, totalPoints>
  const snapshotPointsByUser = new Map<string, Map<number, number>>();
  for (const row of rawHistory) {
    if (!snapshotPointsByUser.has(row.user_id)) {
      snapshotPointsByUser.set(row.user_id, new Map());
    }
    snapshotPointsByUser.get(row.user_id)!.set(row.snapshot_date, row.total_points);
  }

  // 5. Forward-fill each user's last known score across all dates
  // Users with no prior data on a given date are excluded (line starts at first snapshot)
  const forwardFilledByUser = new Map<string, Map<number, number>>();
  for (const userId of userIds) {
    const snapshots = snapshotPointsByUser.get(userId) ?? new Map<number, number>();
    const filled = new Map<number, number>();
    let lastKnown: number | undefined;
    for (const date of allDates) {
      if (snapshots.has(date)) lastKnown = snapshots.get(date)!;
      if (lastKnown !== undefined) filled.set(date, lastKnown);
    }
    if (filled.size > 0) forwardFilledByUser.set(userId, filled);
  }

  // 6. Recompute per-date ranks using forward-filled values
  const ranksByUserAndDate = new Map<string, Map<number, number>>();
  for (const date of allDates) {
    const usersOnDate: Array<{ userId: string; totalPoints: number }> = [];
    for (const [userId, filledMap] of forwardFilledByUser) {
      if (filledMap.has(date)) usersOnDate.push({ userId, totalPoints: filledMap.get(date)! });
    }
    const rankMap = computeRanksForDate(usersOnDate);
    for (const [userId, rank] of rankMap.entries()) {
      if (!ranksByUserAndDate.has(userId)) ranksByUserAndDate.set(userId, new Map());
      ranksByUserAndDate.get(userId)!.set(date, rank);
    }
  }

  // 7. Build per-user history arrays from forward-filled data
  const userHistories: UserScoreHistory[] = [];
  for (const userId of userIds) {
    const filledMap = forwardFilledByUser.get(userId);
    if (!filledMap || filledMap.size === 0) continue;
    const dateRankMap = ranksByUserAndDate.get(userId) ?? new Map<number, number>();
    const data: ScoreHistoryDataPoint[] = [];
    for (const date of allDates) {
      if (filledMap.has(date)) {
        data.push({ date, totalPoints: filledMap.get(date)!, rank: dateRankMap.get(date) ?? 1 });
      }
    }
    userHistories.push({
      userId,
      displayName: displayNameByUserId.get(userId) ?? userId,
      data,
    });
  }

  return {
    userHistories,
    tournamentStartDate,
    tournamentEndDate,
    isEmpty: userHistories.length === 0,
  };
}
