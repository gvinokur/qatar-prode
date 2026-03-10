import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getScoreHistoryForGroup } from '../../app/actions/score-history-actions';
import { testFactories } from '../db/test-factories';

// Mock all repository dependencies
vi.mock('../../app/db/prode-group-repository', () => ({
  findParticipantsInGroup: vi.fn(),
}));
vi.mock('../../app/db/users-repository', () => ({
  findUsersByIds: vi.fn(),
}));
vi.mock('../../app/db/score-history-repository', () => ({
  getScoreHistoryForUsers: vi.fn(),
}));
vi.mock('../../app/db/game-repository', () => ({
  findFirstGameInTournament: vi.fn(),
  findLastGameInTournament: vi.fn(),
}));

// Import mocked modules so we can configure return values per test
import { findParticipantsInGroup } from '../../app/db/prode-group-repository';
import { findUsersByIds } from '../../app/db/users-repository';
import { getScoreHistoryForUsers } from '../../app/db/score-history-repository';
import { findFirstGameInTournament, findLastGameInTournament } from '../../app/db/game-repository';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const makeParticipant = (userId: string) => ({ user_id: userId, is_admin: false });

const makeHistoryRow = (
  userId: string,
  date: number,
  gameScore: number,
  totalPoints: number
) => ({
  id: 'hist-' + userId + date,
  user_id: userId,
  tournament_id: 'tourn-1',
  snapshot_date: date,
  total_game_score: gameScore,
  total_boost_bonus: 0,
  honor_roll_score: 0,
  individual_awards_score: 0,
  qualified_teams_score: 0,
  group_position_score: 0,
  total_points: totalPoints,
  created_at: new Date(),
});

const GROUP_ID = 'group-1';
const TOURNAMENT_ID = 'tourn-1';

// ──────────────────────────────────────────────────────────────────────────────
// Test suite
// ──────────────────────────────────────────────────────────────────────────────

describe('getScoreHistoryForGroup', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default: no games (no tournament date bounds)
    (findFirstGameInTournament as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (findLastGameInTournament as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 1. Empty participants → isEmpty: true
  // ────────────────────────────────────────────────────────────────────────────
  it('returns isEmpty: true when no participants exist in the group', async () => {
    (findParticipantsInGroup as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await getScoreHistoryForGroup(GROUP_ID, TOURNAMENT_ID);

    expect(result).toEqual({
      isEmpty: true,
      userHistories: [],
      tournamentStartDate: null,
      tournamentEndDate: null,
    });
    // No further repository calls should have been made
    expect(findUsersByIds).not.toHaveBeenCalled();
    expect(getScoreHistoryForUsers).not.toHaveBeenCalled();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 2. Participants exist but no history snapshots → isEmpty: true
  // ────────────────────────────────────────────────────────────────────────────
  it('returns isEmpty: true when participants exist but there are no history snapshots', async () => {
    const userA = testFactories.user({ id: 'user-A', nickname: 'Alice' });
    (findParticipantsInGroup as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeParticipant(userA.id),
    ]);
    (findUsersByIds as ReturnType<typeof vi.fn>).mockResolvedValue([userA]);
    (getScoreHistoryForUsers as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await getScoreHistoryForGroup(GROUP_ID, TOURNAMENT_ID);

    expect(result.isEmpty).toBe(true);
    expect(result.userHistories).toHaveLength(0);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 3. Correct ranks assigned on same date
  // ────────────────────────────────────────────────────────────────────────────
  it('assigns rank 1 to the higher-scoring user and rank 2 to the lower-scoring user on the same date', async () => {
    const userA = testFactories.user({ id: 'user-A', nickname: 'Alice' });
    const userB = testFactories.user({ id: 'user-B', nickname: 'Bob' });

    (findParticipantsInGroup as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeParticipant(userA.id),
      makeParticipant(userB.id),
    ]);
    (findUsersByIds as ReturnType<typeof vi.fn>).mockResolvedValue([userA, userB]);
    (getScoreHistoryForUsers as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeHistoryRow(userA.id, 20260610, 50, 100),
      makeHistoryRow(userB.id, 20260610, 25, 50),
    ]);

    const result = await getScoreHistoryForGroup(GROUP_ID, TOURNAMENT_ID);

    expect(result.isEmpty).toBe(false);

    const histA = result.userHistories.find((h) => h.userId === userA.id)!;
    const histB = result.userHistories.find((h) => h.userId === userB.id)!;

    expect(histA.data[0].rank).toBe(1);
    expect(histB.data[0].rank).toBe(2);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 4. Ties use competition ranking (1224 style)
  // ────────────────────────────────────────────────────────────────────────────
  it('gives tied users the same rank and skips the next rank (1224 competition ranking)', async () => {
    const userA = testFactories.user({ id: 'user-A', nickname: 'Alice' });
    const userB = testFactories.user({ id: 'user-B', nickname: 'Bob' });
    const userC = testFactories.user({ id: 'user-C', nickname: 'Carol' });

    (findParticipantsInGroup as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeParticipant(userA.id),
      makeParticipant(userB.id),
      makeParticipant(userC.id),
    ]);
    (findUsersByIds as ReturnType<typeof vi.fn>).mockResolvedValue([userA, userB, userC]);
    (getScoreHistoryForUsers as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeHistoryRow(userA.id, 20260610, 50, 100),
      makeHistoryRow(userB.id, 20260610, 50, 100), // tied with A
      makeHistoryRow(userC.id, 20260610, 25, 50),
    ]);

    const result = await getScoreHistoryForGroup(GROUP_ID, TOURNAMENT_ID);

    const histA = result.userHistories.find((h) => h.userId === userA.id)!;
    const histB = result.userHistories.find((h) => h.userId === userB.id)!;
    const histC = result.userHistories.find((h) => h.userId === userC.id)!;

    // A and B are tied → both rank 1
    expect(histA.data[0].rank).toBe(1);
    expect(histB.data[0].rank).toBe(1);
    // C is behind two users → rank 3 (skips rank 2)
    expect(histC.data[0].rank).toBe(3);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 5. User with no snapshot on a date is excluded from that date's rank
  // ────────────────────────────────────────────────────────────────────────────
  it('excludes users who have no snapshot on a given date from that date rank calculation', async () => {
    const userA = testFactories.user({ id: 'user-A', nickname: 'Alice' });
    const userB = testFactories.user({ id: 'user-B', nickname: 'Bob' });

    (findParticipantsInGroup as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeParticipant(userA.id),
      makeParticipant(userB.id),
    ]);
    (findUsersByIds as ReturnType<typeof vi.fn>).mockResolvedValue([userA, userB]);
    // user-A has snapshots on both day1 and day2; user-B only on day2
    (getScoreHistoryForUsers as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeHistoryRow(userA.id, 20260601, 30, 60), // day1: only A
      makeHistoryRow(userA.id, 20260602, 50, 100), // day2: A
      makeHistoryRow(userB.id, 20260602, 25, 50),  // day2: B
    ]);

    const result = await getScoreHistoryForGroup(GROUP_ID, TOURNAMENT_ID);

    const histA = result.userHistories.find((h) => h.userId === userA.id)!;
    const histB = result.userHistories.find((h) => h.userId === userB.id)!;

    // day1: only user-A participated → rank 1
    const day1Point = histA.data.find((d) => d.date === 20260601)!;
    expect(day1Point.rank).toBe(1);

    // day2: both users → A has more points → rank 1; B → rank 2
    const day2PointA = histA.data.find((d) => d.date === 20260602)!;
    const day2PointB = histB.data.find((d) => d.date === 20260602)!;
    expect(day2PointA.rank).toBe(1);
    expect(day2PointB.rank).toBe(2);

    // user-B has no data for day1
    expect(histB.data.find((d) => d.date === 20260601)).toBeUndefined();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 6. tournamentStartDate populated from findFirstGameInTournament
  // ────────────────────────────────────────────────────────────────────────────
  it('populates tournamentStartDate from the first game date returned by the repository', async () => {
    const userA = testFactories.user({ id: 'user-A', nickname: 'Alice' });

    (findParticipantsInGroup as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeParticipant(userA.id),
    ]);
    (findUsersByIds as ReturnType<typeof vi.fn>).mockResolvedValue([userA]);
    (getScoreHistoryForUsers as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeHistoryRow(userA.id, 20260610, 50, 100),
    ]);

    const firstGame = testFactories.game({
      tournament_id: TOURNAMENT_ID,
      game_date: new Date(2026, 5, 10), // June 10 2026 (local time, month is 0-indexed)
    });
    (findFirstGameInTournament as ReturnType<typeof vi.fn>).mockResolvedValue(firstGame);
    (findLastGameInTournament as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await getScoreHistoryForGroup(GROUP_ID, TOURNAMENT_ID);

    expect(result.tournamentStartDate).toBe(20260610);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 7. isEmpty: false when at least one snapshot exists
  // ────────────────────────────────────────────────────────────────────────────
  it('sets isEmpty to false when at least one snapshot exists for any participant', async () => {
    const userA = testFactories.user({ id: 'user-A', nickname: 'Alice' });

    (findParticipantsInGroup as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeParticipant(userA.id),
    ]);
    (findUsersByIds as ReturnType<typeof vi.fn>).mockResolvedValue([userA]);
    (getScoreHistoryForUsers as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeHistoryRow(userA.id, 20260610, 50, 100),
    ]);

    const result = await getScoreHistoryForGroup(GROUP_ID, TOURNAMENT_ID);

    expect(result.isEmpty).toBe(false);
    expect(result.userHistories).toHaveLength(1);
    expect(result.userHistories[0].userId).toBe(userA.id);
    expect(result.userHistories[0].displayName).toBe('Alice');
  });
});
