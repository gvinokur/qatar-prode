'use server'

import { findParticipantsInGroup } from '../db/prode-group-repository';
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
  groupId: string,
  tournamentId: string
): Promise<ScoreHistoryResult> {
  // 1. Resolve current group members
  const participants = await findParticipantsInGroup(groupId);
  const userIds = participants.map((p) => p.user_id);

  if (userIds.length === 0) {
    return { userHistories: [], tournamentStartDate: null, tournamentEndDate: null, isEmpty: true };
  }

  // 2. Fetch display names
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

  // 4. Group snapshots by date, then compute per-date ranks
  // Map: date → Array<{ userId, totalPoints }>
  const snapshotsByDate = new Map<number, Array<{ userId: string; totalPoints: number }>>();

  for (const row of rawHistory) {
    const existing = snapshotsByDate.get(row.snapshot_date) ?? [];
    existing.push({ userId: row.user_id, totalPoints: row.total_points });
    snapshotsByDate.set(row.snapshot_date, existing);
  }

  // Map: userId → Map<date, rank>
  const ranksByUserAndDate = new Map<string, Map<number, number>>();

  for (const [date, usersOnDate] of snapshotsByDate.entries()) {
    const rankMap = computeRanksForDate(usersOnDate);
    for (const [userId, rank] of rankMap.entries()) {
      if (!ranksByUserAndDate.has(userId)) {
        ranksByUserAndDate.set(userId, new Map());
      }
      ranksByUserAndDate.get(userId)!.set(date, rank);
    }
  }

  // 5. Build per-user history arrays
  // Map: userId → snapshot rows (already sorted by snapshot_date asc from repo)
  const rowsByUser = new Map<string, typeof rawHistory>();
  for (const row of rawHistory) {
    const existing = rowsByUser.get(row.user_id) ?? [];
    existing.push(row);
    rowsByUser.set(row.user_id, existing);
  }

  const userHistories: UserScoreHistory[] = [];
  for (const userId of userIds) {
    const rows = rowsByUser.get(userId);
    if (!rows || rows.length === 0) continue;

    const dateRankMap = ranksByUserAndDate.get(userId) ?? new Map<number, number>();
    const data: ScoreHistoryDataPoint[] = rows.map((row) => ({
      date: row.snapshot_date,
      totalPoints: row.total_points,
      rank: dateRankMap.get(row.snapshot_date) ?? 1,
    }));

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
