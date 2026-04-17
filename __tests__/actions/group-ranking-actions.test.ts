import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as groupRankingRepository from '../../app/db/group-ranking-repository';
import * as prodeGroupRepository from '../../app/db/prode-group-repository';
import * as prodeGroupActions from '../../app/actions/prode-group-actions';
import * as rankCalculator from '../../app/utils/rank-calculator';
import * as dateUtils from '../../app/utils/date-utils';
import {
  recalculateGroupRankings,
  recalculateGroupRankingsForUsers,
  getGroupRankingForUser,
  getMaterializedLeaderboardRanks,
} from '../../app/actions/group-ranking-actions';
import { testFactories } from '../db/test-factories';

// Prevent Next.js server action resolution errors
vi.mock('../../auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next-intl/server', () => ({ getTranslations: vi.fn() }));

vi.mock('../../app/db/group-ranking-repository');
vi.mock('../../app/db/prode-group-repository');
vi.mock('../../app/actions/prode-group-actions');
vi.mock('../../app/utils/rank-calculator');
vi.mock('../../app/utils/date-utils');

const mockUpsertGroupRankingSnapshots = vi.mocked(groupRankingRepository.upsertGroupRankingSnapshots);
const mockGetLatestTwoGroupRankingSnapshots = vi.mocked(groupRankingRepository.getLatestTwoGroupRankingSnapshots);
const mockFindGroupsForUsers = vi.mocked(groupRankingRepository.findGroupsForUsers);
const mockGetLatestRankingsForGroupWithChange = vi.mocked(groupRankingRepository.getLatestRankingsForGroupWithChange);

const mockFindProdeGroupById = vi.mocked(prodeGroupRepository.findProdeGroupById);
const mockFindParticipantsInGroup = vi.mocked(prodeGroupRepository.findParticipantsInGroup);

const mockGetUserScoresForTournament = vi.mocked(prodeGroupActions.getUserScoresForTournament);
const mockCalculateRanks = vi.mocked(rankCalculator.calculateRanks);
const mockGetTodayYYYYMMDD = vi.mocked(dateUtils.getTodayYYYYMMDD);

describe('Group Ranking Actions', () => {
  const user = testFactories.user({ id: 'user-1' });
  const user2 = testFactories.user({ id: 'user-2' });
  const group = testFactories.prodeGroup({ id: 'group-1', owner_user_id: user.id });
  const tournament = testFactories.tournament({ id: 'tournament-1' });
  const TODAY = 20260601;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTodayYYYYMMDD.mockReturnValue(TODAY);
    mockUpsertGroupRankingSnapshots.mockResolvedValue([]);
  });

  // ---------------------------------------------------------------------------
  // recalculateGroupRankings
  // ---------------------------------------------------------------------------
  describe('recalculateGroupRankings', () => {
    it('upserts snapshots for all group members with correct rank and score', async () => {
      const participantRecord = { user_id: user2.id, is_admin: false };
      mockFindProdeGroupById.mockResolvedValue(group as any);
      mockFindParticipantsInGroup.mockResolvedValue([participantRecord]);
      mockGetUserScoresForTournament.mockResolvedValue([
        { userId: user.id, totalPoints: 50 } as any,
        { userId: user2.id, totalPoints: 40 } as any,
      ]);
      mockCalculateRanks.mockReturnValue([
        { userId: user.id, totalPoints: 50, currentRank: 1 } as any,
        { userId: user2.id, totalPoints: 40, currentRank: 2 } as any,
      ]);

      await recalculateGroupRankings(group.id, tournament.id);

      expect(mockFindProdeGroupById).toHaveBeenCalledWith(group.id);
      expect(mockFindParticipantsInGroup).toHaveBeenCalledWith(group.id);
      expect(mockGetUserScoresForTournament).toHaveBeenCalledWith(
        [user.id, user2.id],
        tournament.id
      );
      expect(mockCalculateRanks).toHaveBeenCalledWith(expect.any(Array), 'totalPoints');
      expect(mockUpsertGroupRankingSnapshots).toHaveBeenCalledWith([
        {
          user_id: user.id,
          group_id: group.id,
          tournament_id: tournament.id,
          snapshot_date: TODAY,
          rank: 1,
          score: 50,
        },
        {
          user_id: user2.id,
          group_id: group.id,
          tournament_id: tournament.id,
          snapshot_date: TODAY,
          rank: 2,
          score: 40,
        },
      ]);
    });

    it('applies competition ranking on tied scores (1-2-2-4 style)', async () => {
      mockFindProdeGroupById.mockResolvedValue(group as any);
      mockFindParticipantsInGroup.mockResolvedValue([]);
      mockGetUserScoresForTournament.mockResolvedValue([
        { userId: user.id, totalPoints: 50 } as any,
        { userId: user2.id, totalPoints: 50 } as any,
      ]);
      // calculateRanks returns both at rank 1 due to tie
      mockCalculateRanks.mockReturnValue([
        { userId: user.id, totalPoints: 50, currentRank: 1 } as any,
        { userId: user2.id, totalPoints: 50, currentRank: 1 } as any,
      ]);

      await recalculateGroupRankings(group.id, tournament.id);

      const upsertCall = mockUpsertGroupRankingSnapshots.mock.calls[0][0];
      expect(upsertCall.every((s) => s.rank === 1)).toBe(true);
    });

    it('uses today YYYYMMDD as snapshot_date', async () => {
      mockFindProdeGroupById.mockResolvedValue(group as any);
      mockFindParticipantsInGroup.mockResolvedValue([]);
      mockGetUserScoresForTournament.mockResolvedValue([{ userId: user.id, totalPoints: 30 } as any]);
      mockCalculateRanks.mockReturnValue([{ userId: user.id, totalPoints: 30, currentRank: 1 } as any]);
      mockGetTodayYYYYMMDD.mockReturnValue(20260701);

      await recalculateGroupRankings(group.id, tournament.id);

      const upsertCall = mockUpsertGroupRankingSnapshots.mock.calls[0][0];
      expect(upsertCall[0].snapshot_date).toBe(20260701);
    });

    it('shapes each snapshot as GroupRankingSnapshotNew with correct fields', async () => {
      mockFindProdeGroupById.mockResolvedValue(group as any);
      mockFindParticipantsInGroup.mockResolvedValue([]);
      mockGetUserScoresForTournament.mockResolvedValue([{ userId: user.id, totalPoints: 55 } as any]);
      mockCalculateRanks.mockReturnValue([{ userId: user.id, totalPoints: 55, currentRank: 1 } as any]);

      await recalculateGroupRankings(group.id, tournament.id);

      const snapshot = mockUpsertGroupRankingSnapshots.mock.calls[0][0][0];
      expect(snapshot).toMatchObject({
        user_id: user.id,
        group_id: group.id,
        tournament_id: tournament.id,
        snapshot_date: TODAY,
        rank: 1,
        score: 55,
      });
    });

    it('returns early without calling upsert when group is not found', async () => {
      mockFindProdeGroupById.mockResolvedValue(undefined);

      await recalculateGroupRankings('nonexistent-group', tournament.id);

      expect(mockUpsertGroupRankingSnapshots).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // recalculateGroupRankingsForUsers
  // ---------------------------------------------------------------------------
  describe('recalculateGroupRankingsForUsers', () => {
    it('does nothing when changedUserIds is empty', async () => {
      await recalculateGroupRankingsForUsers(tournament.id, []);

      expect(mockFindGroupsForUsers).not.toHaveBeenCalled();
    });

    it('does nothing when no groups are found for the changed users', async () => {
      mockFindGroupsForUsers.mockResolvedValue([]);

      await recalculateGroupRankingsForUsers(tournament.id, [user.id]);

      expect(mockFindGroupsForUsers).toHaveBeenCalledWith([user.id]);
      expect(mockFindProdeGroupById).not.toHaveBeenCalled();
    });

    it('calls recalculateGroupRankings once per affected group', async () => {
      mockFindGroupsForUsers.mockResolvedValue([{ id: group.id }, { id: 'group-2' }]);
      mockFindProdeGroupById.mockResolvedValue(group as any);
      mockFindParticipantsInGroup.mockResolvedValue([]);
      mockGetUserScoresForTournament.mockResolvedValue([{ userId: user.id, totalPoints: 30 } as any]);
      mockCalculateRanks.mockReturnValue([{ userId: user.id, totalPoints: 30, currentRank: 1 } as any]);

      await recalculateGroupRankingsForUsers(tournament.id, [user.id]);

      expect(mockFindProdeGroupById).toHaveBeenCalledTimes(2);
    });

    it('does not throw and continues processing other groups when one group fails', async () => {
      mockFindGroupsForUsers.mockResolvedValue([{ id: 'group-fail' }, { id: 'group-ok' }]);
      // First call fails, second succeeds
      mockFindProdeGroupById
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce(group as any);
      mockFindParticipantsInGroup.mockResolvedValue([]);
      mockGetUserScoresForTournament.mockResolvedValue([{ userId: user.id, totalPoints: 30 } as any]);
      mockCalculateRanks.mockReturnValue([{ userId: user.id, totalPoints: 30, currentRank: 1 } as any]);

      // Should not throw
      await expect(
        recalculateGroupRankingsForUsers(tournament.id, [user.id])
      ).resolves.toBeUndefined();

      // Still attempted both groups
      expect(mockFindProdeGroupById).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------------------
  // getGroupRankingForUser
  // ---------------------------------------------------------------------------
  describe('getGroupRankingForUser', () => {
    it('returns null when no snapshots exist', async () => {
      mockGetLatestTwoGroupRankingSnapshots.mockResolvedValue([]);

      const result = await getGroupRankingForUser(user.id, group.id, tournament.id);

      expect(result).toBeNull();
    });

    it('returns MaterializedGroupRanking with rankChange null when only one snapshot exists', async () => {
      const current = testFactories.groupRanking({
        user_id: user.id,
        group_id: group.id,
        tournament_id: tournament.id,
        snapshot_date: TODAY,
        rank: 2,
        score: 45,
      });
      mockGetLatestTwoGroupRankingSnapshots.mockResolvedValue([current]);

      const result = await getGroupRankingForUser(user.id, group.id, tournament.id);

      expect(result).not.toBeNull();
      expect(result!.currentRank).toBe(2);
      expect(result!.currentScore).toBe(45);
      expect(result!.rankChange).toBeNull();
      expect(result!.previousRank).toBeNull();
    });

    it('correctly computes rankChange as previousRank minus currentRank (positive = improved)', async () => {
      const current = testFactories.groupRanking({
        user_id: user.id,
        snapshot_date: 20260602,
        rank: 1,
        score: 55,
      });
      const previous = testFactories.groupRanking({
        id: 'ranking-2',
        user_id: user.id,
        snapshot_date: 20260601,
        rank: 3,
        score: 40,
      });
      mockGetLatestTwoGroupRankingSnapshots.mockResolvedValue([current, previous]);

      const result = await getGroupRankingForUser(user.id, group.id, tournament.id);

      // previous.rank - current.rank = 3 - 1 = +2 (improved)
      expect(result!.rankChange).toBe(2);
      expect(result!.previousRank).toBe(3);
    });

    it('returns full MaterializedGroupRanking shape when two snapshots exist', async () => {
      const current = testFactories.groupRanking({
        user_id: user.id,
        group_id: group.id,
        tournament_id: tournament.id,
        snapshot_date: 20260602,
        rank: 1,
        score: 55,
      });
      const previous = testFactories.groupRanking({
        id: 'ranking-2',
        user_id: user.id,
        group_id: group.id,
        tournament_id: tournament.id,
        snapshot_date: 20260601,
        rank: 2,
        score: 45,
      });
      mockGetLatestTwoGroupRankingSnapshots.mockResolvedValue([current, previous]);

      const result = await getGroupRankingForUser(user.id, group.id, tournament.id);

      expect(result).toMatchObject({
        userId: user.id,
        groupId: group.id,
        tournamentId: tournament.id,
        currentRank: 1,
        currentScore: 55,
        snapshotDate: 20260602,
        rankChange: 1, // 2 - 1 = 1
        previousRank: 2,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getMaterializedLeaderboardRanks
  // ---------------------------------------------------------------------------
  describe('getMaterializedLeaderboardRanks', () => {
    it('returns empty Map when repository returns empty array', async () => {
      mockGetLatestRankingsForGroupWithChange.mockResolvedValue([]);

      const result = await getMaterializedLeaderboardRanks(group.id, tournament.id);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('sets rankChange to 0 for users with no previous snapshot (previousRank: null)', async () => {
      mockGetLatestRankingsForGroupWithChange.mockResolvedValue([
        { userId: user.id, currentRank: 2, previousRank: null, currentScore: 80 },
      ]);

      const result = await getMaterializedLeaderboardRanks(group.id, tournament.id);

      expect(result.get(user.id)).toEqual({ currentRank: 2, rankChange: 0 });
    });

    it('computes rankChange correctly when rank improved (positive)', async () => {
      mockGetLatestRankingsForGroupWithChange.mockResolvedValue([
        { userId: user.id, currentRank: 1, previousRank: 3, currentScore: 100 },
      ]);

      const result = await getMaterializedLeaderboardRanks(group.id, tournament.id);

      // previousRank - currentRank = 3 - 1 = +2 (moved up)
      expect(result.get(user.id)?.rankChange).toBe(2);
    });

    it('computes rankChange correctly when rank dropped (negative)', async () => {
      mockGetLatestRankingsForGroupWithChange.mockResolvedValue([
        { userId: user.id, currentRank: 3, previousRank: 1, currentScore: 70 },
      ]);

      const result = await getMaterializedLeaderboardRanks(group.id, tournament.id);

      // previousRank - currentRank = 1 - 3 = -2 (dropped)
      expect(result.get(user.id)?.rankChange).toBe(-2);
    });

    it('returns empty Map when repository throws (error isolation — leaderboard must not break)', async () => {
      mockGetLatestRankingsForGroupWithChange.mockRejectedValue(new Error('DB failure'));

      const result = await getMaterializedLeaderboardRanks(group.id, tournament.id);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });
  });
});
