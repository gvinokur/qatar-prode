import { db } from './database';
import { GroupRanking, GroupRankingSnapshotNew } from './tables-definition';
import { sql } from 'kysely';

/**
 * Batch upsert daily rank snapshots for multiple users in a group.
 * On conflict (user_id, group_id, tournament_id, snapshot_date), overwrites rank and score
 * (last-write-wins within the same day — safe for repeated admin triggers).
 */
export async function upsertGroupRankingSnapshots(
  snapshots: GroupRankingSnapshotNew[]
): Promise<GroupRanking[]> {
  if (snapshots.length === 0) return [];

  return db
    .insertInto('group_rankings')
    .values(snapshots)
    .onConflict((oc) =>
      oc
        .constraint('group_rankings_unique')
        .doUpdateSet((eb) => ({
          rank: eb.ref('excluded.rank'),
          score: eb.ref('excluded.score'),
        }))
    )
    .returningAll()
    .execute();
}

/**
 * Returns all ranking snapshots for a group in a tournament, ordered by snapshot_date ascending.
 * Used for rank history charts.
 */
export async function getGroupRankingSnapshots(
  groupId: string,
  tournamentId: string
): Promise<GroupRanking[]> {
  return db
    .selectFrom('group_rankings')
    .selectAll()
    .where('group_id', '=', groupId)
    .where('tournament_id', '=', tournamentId)
    .orderBy('snapshot_date', 'asc')
    .execute();
}

/**
 * Returns the two most recent ranking snapshots for a specific user/group/tournament,
 * ordered by snapshot_date descending. Returns 0, 1, or 2 rows.
 * Used to derive rank change (rows[1].rank - rows[0].rank).
 */
export async function getLatestTwoGroupRankingSnapshots(
  userId: string,
  groupId: string,
  tournamentId: string
): Promise<GroupRanking[]> {
  return db
    .selectFrom('group_rankings')
    .selectAll()
    .where('user_id', '=', userId)
    .where('group_id', '=', groupId)
    .where('tournament_id', '=', tournamentId)
    .orderBy('snapshot_date', 'desc')
    .limit(2)
    .execute();
}

/**
 * Returns all users' latest-snapshot ranks with their display names for a group+tournament,
 * ordered by rank ascending. Uses a two-step query: first get the max snapshot_date,
 * then JOIN group_rankings with users at that date.
 * Returns empty array if no snapshots exist.
 */
export async function getLatestRankingsForGroup(
  groupId: string,
  tournamentId: string
): Promise<{ userId: string; userName: string; rank: number; score: number }[]> {
  const latestDateRow = await db
    .selectFrom('group_rankings')
    .select(db.fn.max('snapshot_date').as('maxDate'))
    .where('group_id', '=', groupId)
    .where('tournament_id', '=', tournamentId)
    .executeTakeFirst()

  if (latestDateRow?.maxDate == null) return []

  return db
    .selectFrom('group_rankings')
    .innerJoin('users', 'users.id', 'group_rankings.user_id')
    .select([
      'group_rankings.user_id as userId',
      sql<string>`COALESCE(users.nickname, users.email)`.as('userName'),
      'group_rankings.rank',
      'group_rankings.score',
    ])
    .where('group_rankings.group_id', '=', groupId)
    .where('group_rankings.tournament_id', '=', tournamentId)
    .where('group_rankings.snapshot_date', '=', latestDateRow.maxDate)
    .orderBy('group_rankings.rank', 'asc')
    .execute()
}

/**
 * Returns all users' ranks at the latest snapshot for a group+tournament, with
 * each user's rank at the penultimate snapshot for rank-change computation.
 * Three-step: (1) get the two most-recent distinct snapshot_dates, (2) fetch all
 * user ranks at the latest date, (3) fetch all user ranks at the penultimate date
 * (if it exists) and join.
 * Returns empty array when no snapshots exist.
 */
export async function getLatestRankingsForGroupWithChange(
  groupId: string,
  tournamentId: string
): Promise<{ userId: string; currentRank: number; previousRank: number | null; currentScore: number }[]> {
  // Step 1: Get the two most-recent distinct snapshot_dates
  const dateRows = await db
    .selectFrom('group_rankings')
    .select('snapshot_date')
    .where('group_id', '=', groupId)
    .where('tournament_id', '=', tournamentId)
    .distinct()
    .orderBy('snapshot_date', 'desc')
    .limit(2)
    .execute()

  if (dateRows.length === 0) return []

  const latestDate = dateRows[0].snapshot_date
  const penultimateDate = dateRows[1]?.snapshot_date ?? null

  // Step 2: Fetch all user ranks at the latest date
  const latestRows = await db
    .selectFrom('group_rankings')
    .select(['user_id', 'rank', 'score'])
    .where('group_id', '=', groupId)
    .where('tournament_id', '=', tournamentId)
    .where('snapshot_date', '=', latestDate)
    .execute()

  if (latestRows.length === 0) return []

  // Step 3: Fetch penultimate rows and build a lookup map
  let penultimateMap = new Map<string, number>()
  if (penultimateDate !== null) {
    const penultimateRows = await db
      .selectFrom('group_rankings')
      .select(['user_id', 'rank'])
      .where('group_id', '=', groupId)
      .where('tournament_id', '=', tournamentId)
      .where('snapshot_date', '=', penultimateDate)
      .execute()
    penultimateMap = new Map(penultimateRows.map(r => [r.user_id, r.rank]))
  }

  return latestRows.map(r => ({
    userId: r.user_id,
    currentRank: r.rank,
    previousRank: penultimateMap.get(r.user_id) ?? null,
    currentScore: r.score,
  }))
}

/**
 * Returns distinct group IDs where at least one member (owner or participant)
 * is in the given userIds list. Used to scope recalculation to only affected groups.
 */
export async function findGroupsForUsers(
  userIds: string[]
): Promise<{ id: string }[]> {
  if (userIds.length === 0) return [];

  return db
    .selectFrom('prode_groups')
    .leftJoin('prode_group_participants', 'prode_group_participants.prode_group_id', 'prode_groups.id')
    .select('prode_groups.id')
    .where((eb) =>
      eb.or([
        eb('prode_groups.owner_user_id', 'in', userIds),
        eb('prode_group_participants.participant_id', 'in', userIds),
      ])
    )
    .distinct()
    .execute();
}
