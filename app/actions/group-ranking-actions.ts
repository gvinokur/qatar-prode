'use server';

import { findProdeGroupById, findParticipantsInGroup } from '../db/prode-group-repository';
import { getUserScoresForTournament } from './prode-group-actions';
import { calculateRanks } from '../utils/rank-calculator';
import { getTodayYYYYMMDD } from '../utils/date-utils';
import {
  upsertGroupRankingSnapshots,
  getLatestTwoGroupRankingSnapshots,
  findGroupsForUsers,
  getLatestRankingsForGroupWithChange,
} from '../db/group-ranking-repository';
import { GroupRankingSnapshotNew } from '../db/tables-definition';

export interface MaterializedGroupRanking {
  userId: string
  groupId: string
  tournamentId: string
  currentRank: number
  currentScore: number
  snapshotDate: number        // YYYYMMDD of latest snapshot
  rankChange: number | null   // previousRank - currentRank: positive = improved, negative = dropped; null when only one snapshot
  previousRank: number | null // null when only one snapshot exists
}

/**
 * Fetches all members of a group, computes their scores, ranks them, and writes
 * today's snapshot via upsert. Internal use only — no auth check.
 */
export async function recalculateGroupRankings(
  groupId: string,
  tournamentId: string
): Promise<void> {
  const [group, participants] = await Promise.all([
    findProdeGroupById(groupId),
    findParticipantsInGroup(groupId),
  ]);

  if (!group) return;

  const memberIds = [group.owner_user_id, ...participants.map((p) => p.user_id)];
  const scores = await getUserScoresForTournament(memberIds, tournamentId);
  const ranked = calculateRanks(scores, 'totalPoints');
  const snapshotDate = getTodayYYYYMMDD();

  const snapshots: GroupRankingSnapshotNew[] = ranked.map((entry) => ({
    user_id: entry.userId,
    group_id: groupId,
    tournament_id: tournamentId,
    snapshot_date: snapshotDate,
    rank: entry.currentRank,
    score: entry.totalPoints,
  }));

  await upsertGroupRankingSnapshots(snapshots);
}

/**
 * Finds all groups containing at least one user from changedUserIds, then
 * recalculates rankings for each affected group. Each group is processed
 * independently — a failure in one does not abort others.
 */
export async function recalculateGroupRankingsForUsers(
  tournamentId: string,
  changedUserIds: string[]
): Promise<void> {
  if (changedUserIds.length === 0) return;

  const affectedGroups = await findGroupsForUsers(changedUserIds);
  if (affectedGroups.length === 0) return;

  await Promise.all(
    affectedGroups.map(async ({ id: groupId }) => {
      try {
        await recalculateGroupRankings(groupId, tournamentId);
      } catch (err) {
        console.error(
          `[recalculateGroupRankingsForUsers] Failed to recalculate rankings for group ${groupId}:`,
          err
        );
      }
    })
  );
}

/**
 * Server Action — returns materialized ranks for all users in a group as a Map
 * keyed by userId. rankChange is positive when rank improved (moved up).
 * Returns an empty Map when no snapshots exist or if the repository throws.
 */
export async function getMaterializedLeaderboardRanks(
  groupId: string,
  tournamentId: string
): Promise<Map<string, { currentRank: number; rankChange: number }>> {
  try {
    const rows = await getLatestRankingsForGroupWithChange(groupId, tournamentId)
    const result = new Map<string, { currentRank: number; rankChange: number }>()
    for (const row of rows) {
      result.set(row.userId, {
        currentRank: row.currentRank,
        rankChange: row.previousRank === null ? 0 : row.previousRank - row.currentRank,
      })
    }
    return result
  } catch (err) {
    console.error('[getMaterializedLeaderboardRanks] Failed to fetch materialized ranks:', err)
    return new Map()
  }
}

/**
 * Server Action — returns the latest materialized rank for a user in a group,
 * including rank change derived from the two most recent snapshots.
 * Returns null if no snapshots exist yet.
 */
export async function getGroupRankingForUser(
  userId: string,
  groupId: string,
  tournamentId: string
): Promise<MaterializedGroupRanking | null> {
  const rows = await getLatestTwoGroupRankingSnapshots(userId, groupId, tournamentId);

  if (rows.length === 0) return null;

  const current = rows[0];
  const previous = rows[1] ?? null;
  const rankChange = previous ? previous.rank - current.rank : null;

  return {
    userId: current.user_id,
    groupId: current.group_id,
    tournamentId: current.tournament_id,
    currentRank: current.rank,
    currentScore: current.score,
    snapshotDate: current.snapshot_date,
    rankChange,
    previousRank: previous?.rank ?? null,
  };
}
