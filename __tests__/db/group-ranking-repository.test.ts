import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  upsertGroupRankingSnapshots,
  getGroupRankingSnapshots,
  getLatestTwoGroupRankingSnapshots,
  findGroupsForUsers,
} from '../../app/db/group-ranking-repository';
import { db } from '../../app/db/database';
import { createMockSelectQuery, createMockInsertQuery } from './mock-helpers';
import { testFactories } from './test-factories';

vi.mock('../../app/db/database', () => ({
  db: { selectFrom: vi.fn(), insertInto: vi.fn() },
}));

describe('Group Ranking Repository', () => {
  const mockDb = vi.mocked(db);

  const user = testFactories.user();
  const group = testFactories.prodeGroup();
  const tournament = testFactories.tournament();
  const ranking = testFactories.groupRanking({
    user_id: user.id,
    group_id: group.id,
    tournament_id: tournament.id,
  });

  const snapshot = {
    user_id: user.id,
    group_id: group.id,
    tournament_id: tournament.id,
    snapshot_date: 20260601,
    rank: 1,
    score: 50,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // upsertGroupRankingSnapshots
  // ---------------------------------------------------------------------------
  describe('upsertGroupRankingSnapshots', () => {
    it('returns empty array without calling DB when snapshots is empty', async () => {
      const result = await upsertGroupRankingSnapshots([]);

      expect(result).toEqual([]);
      expect(mockDb.insertInto).not.toHaveBeenCalled();
    });

    it('inserts a new snapshot row when none exists for that date', async () => {
      const mockQuery = createMockInsertQuery([ranking]);
      mockQuery.execute.mockResolvedValue([ranking]);
      mockDb.insertInto.mockReturnValue(mockQuery as any);

      const result = await upsertGroupRankingSnapshots([snapshot]);

      expect(mockDb.insertInto).toHaveBeenCalledWith('group_rankings');
      expect(mockQuery.values).toHaveBeenCalledWith([snapshot]);
      expect(mockQuery.onConflict).toHaveBeenCalled();
      expect(mockQuery.returningAll).toHaveBeenCalled();
      expect(mockQuery.execute).toHaveBeenCalled();
      expect(result).toEqual([ranking]);
    });

    it('overwrites rank and score on same-day re-trigger (idempotent upsert)', async () => {
      const updatedRanking = { ...ranking, rank: 2, score: 45 };
      const updatedSnapshot = { ...snapshot, rank: 2, score: 45 };
      const mockQuery = createMockInsertQuery([updatedRanking]);
      mockQuery.execute.mockResolvedValue([updatedRanking]);
      mockDb.insertInto.mockReturnValue(mockQuery as any);

      const result = await upsertGroupRankingSnapshots([updatedSnapshot]);

      expect(result[0].rank).toBe(2);
      expect(result[0].score).toBe(45);
    });

    it('inserts multiple user snapshots for the same group in one call', async () => {
      const snapshot2 = { ...snapshot, user_id: 'user-2', rank: 2, score: 40 };
      const ranking2 = testFactories.groupRanking({ id: 'ranking-2', user_id: 'user-2', rank: 2, score: 40 });
      const mockQuery = createMockInsertQuery([ranking, ranking2]);
      mockQuery.execute.mockResolvedValue([ranking, ranking2]);
      mockDb.insertInto.mockReturnValue(mockQuery as any);

      const result = await upsertGroupRankingSnapshots([snapshot, snapshot2]);

      expect(mockQuery.values).toHaveBeenCalledWith([snapshot, snapshot2]);
      expect(result).toHaveLength(2);
    });

    it('does not overwrite rows from a different snapshot_date (conflict key is date-scoped)', async () => {
      const differentDateSnapshot = { ...snapshot, snapshot_date: 20260602 };
      const differentDateRanking = testFactories.groupRanking({ snapshot_date: 20260602 });
      const mockQuery = createMockInsertQuery([differentDateRanking]);
      mockQuery.execute.mockResolvedValue([differentDateRanking]);
      mockDb.insertInto.mockReturnValue(mockQuery as any);

      const result = await upsertGroupRankingSnapshots([differentDateSnapshot]);

      expect(result[0].snapshot_date).toBe(20260602);
      expect(mockQuery.onConflict).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // getGroupRankingSnapshots
  // ---------------------------------------------------------------------------
  describe('getGroupRankingSnapshots', () => {
    it('returns empty array when no snapshots exist', async () => {
      const mockQuery = createMockSelectQuery([]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await getGroupRankingSnapshots(group.id, tournament.id);

      expect(result).toEqual([]);
      expect(mockQuery.execute).toHaveBeenCalled();
    });

    it('returns rows ordered by snapshot_date ascending', async () => {
      const rows = [
        testFactories.groupRanking({ snapshot_date: 20260601 }),
        testFactories.groupRanking({ id: 'ranking-2', snapshot_date: 20260602 }),
      ];
      const mockQuery = createMockSelectQuery(rows);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await getGroupRankingSnapshots(group.id, tournament.id);

      expect(mockDb.selectFrom).toHaveBeenCalledWith('group_rankings');
      expect(mockQuery.where).toHaveBeenCalledWith('group_id', '=', group.id);
      expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', tournament.id);
      expect(mockQuery.orderBy).toHaveBeenCalledWith('snapshot_date', 'asc');
      expect(result).toEqual(rows);
    });

    it('does not return rows from a different group or tournament', async () => {
      const mockQuery = createMockSelectQuery([]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      await getGroupRankingSnapshots('other-group', 'other-tournament');

      expect(mockQuery.where).toHaveBeenCalledWith('group_id', '=', 'other-group');
      expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'other-tournament');
      expect(mockQuery.where).not.toHaveBeenCalledWith('group_id', '=', group.id);
    });
  });

  // ---------------------------------------------------------------------------
  // getLatestTwoGroupRankingSnapshots
  // ---------------------------------------------------------------------------
  describe('getLatestTwoGroupRankingSnapshots', () => {
    it('returns empty array when no snapshots exist', async () => {
      const mockQuery = createMockSelectQuery([]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await getLatestTwoGroupRankingSnapshots(user.id, group.id, tournament.id);

      expect(result).toEqual([]);
    });

    it('returns one row when only one snapshot exists', async () => {
      const mockQuery = createMockSelectQuery([ranking]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await getLatestTwoGroupRankingSnapshots(user.id, group.id, tournament.id);

      expect(result).toHaveLength(1);
    });

    it('returns two rows most-recent-first when multiple snapshots exist', async () => {
      const recent = testFactories.groupRanking({ snapshot_date: 20260602, rank: 1 });
      const older = testFactories.groupRanking({ id: 'ranking-2', snapshot_date: 20260601, rank: 2 });
      const mockQuery = createMockSelectQuery([recent, older]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await getLatestTwoGroupRankingSnapshots(user.id, group.id, tournament.id);

      expect(mockDb.selectFrom).toHaveBeenCalledWith('group_rankings');
      expect(mockQuery.where).toHaveBeenCalledWith('user_id', '=', user.id);
      expect(mockQuery.where).toHaveBeenCalledWith('group_id', '=', group.id);
      expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', tournament.id);
      expect(mockQuery.orderBy).toHaveBeenCalledWith('snapshot_date', 'desc');
      expect(mockQuery.limit).toHaveBeenCalledWith(2);
      expect(result[0].snapshot_date).toBe(20260602);
      expect(result[1].snapshot_date).toBe(20260601);
    });

    it('does not return rows from other users in the same group', async () => {
      const mockQuery = createMockSelectQuery([ranking]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      await getLatestTwoGroupRankingSnapshots(user.id, group.id, tournament.id);

      expect(mockQuery.where).toHaveBeenCalledWith('user_id', '=', user.id);
      expect(mockQuery.where).not.toHaveBeenCalledWith('user_id', '=', 'other-user');
    });
  });

  // ---------------------------------------------------------------------------
  // findGroupsForUsers
  // ---------------------------------------------------------------------------
  describe('findGroupsForUsers', () => {
    it('returns empty array without calling DB when userIds is empty', async () => {
      const result = await findGroupsForUsers([]);

      expect(result).toEqual([]);
      expect(mockDb.selectFrom).not.toHaveBeenCalled();
    });

    it('returns the group when the owner ID is in userIds', async () => {
      const mockQuery = createMockSelectQuery([{ id: group.id }]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findGroupsForUsers([group.owner_user_id]);

      expect(mockDb.selectFrom).toHaveBeenCalledWith('prode_groups');
      expect(mockQuery.leftJoin).toHaveBeenCalled();
      expect(mockQuery.distinct).toHaveBeenCalled();
      expect(result).toEqual([{ id: group.id }]);
    });

    it('returns the group when a non-owner participant ID is in userIds', async () => {
      const participantId = 'participant-user-id';
      const mockQuery = createMockSelectQuery([{ id: group.id }]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findGroupsForUsers([participantId]);

      expect(result).toEqual([{ id: group.id }]);
      expect(mockQuery.distinct).toHaveBeenCalled();
    });

    it('does not return duplicate group IDs when multiple members match', async () => {
      const mockQuery = createMockSelectQuery([{ id: group.id }]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findGroupsForUsers([group.owner_user_id, 'participant-2']);

      // distinct() ensures no duplicates — verify it was called
      expect(mockQuery.distinct).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('does not return groups where no member is in userIds', async () => {
      const mockQuery = createMockSelectQuery([]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findGroupsForUsers(['unrelated-user-id']);

      expect(result).toEqual([]);
    });
  });
});
