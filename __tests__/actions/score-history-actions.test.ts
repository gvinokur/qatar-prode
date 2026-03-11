import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getScoreHistoryForGroup } from '../../app/actions/score-history-actions';
import { computeSnapshotScores } from '../../app/utils/score-history-utils';
import type { UserScoreHistory } from '../../app/actions/score-history-actions';
import { testFactories } from '../db/test-factories';

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

import { findUsersByIds } from '../../app/db/users-repository';
import { getScoreHistoryForUsers } from '../../app/db/score-history-repository';
import { findFirstGameInTournament, findLastGameInTournament } from '../../app/db/game-repository';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

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

const TOURNAMENT_ID = 'tourn-1';

// ──────────────────────────────────────────────────────────────────────────────
// Test suite
// ──────────────────────────────────────────────────────────────────────────────

describe('getScoreHistoryForGroup', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (findFirstGameInTournament as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (findLastGameInTournament as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 1. Empty userIds → isEmpty: true (early return, no DB calls)
  // ────────────────────────────────────────────────────────────────────────────
  it('returns isEmpty: true when userIds is empty', async () => {
    const result = await getScoreHistoryForGroup([], TOURNAMENT_ID);

    expect(result).toEqual({
      isEmpty: true,
      userHistories: [],
      tournamentStartDate: null,
      tournamentEndDate: null,
    });
    expect(findUsersByIds).not.toHaveBeenCalled();
    expect(getScoreHistoryForUsers).not.toHaveBeenCalled();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 2. Users exist but no history snapshots → isEmpty: true
  // ────────────────────────────────────────────────────────────────────────────
  it('returns isEmpty: true when there are no history snapshots', async () => {
    const userA = testFactories.user({ id: 'user-A', nickname: 'Alice' });
    (findUsersByIds as ReturnType<typeof vi.fn>).mockResolvedValue([userA]);
    (getScoreHistoryForUsers as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await getScoreHistoryForGroup([userA.id], TOURNAMENT_ID);

    expect(result.isEmpty).toBe(true);
    expect(result.userHistories).toHaveLength(0);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 3. Correct ranks assigned on same date
  // ────────────────────────────────────────────────────────────────────────────
  it('assigns rank 1 to the higher-scoring user and rank 2 to the lower-scoring user on the same date', async () => {
    const userA = testFactories.user({ id: 'user-A', nickname: 'Alice' });
    const userB = testFactories.user({ id: 'user-B', nickname: 'Bob' });

    (findUsersByIds as ReturnType<typeof vi.fn>).mockResolvedValue([userA, userB]);
    (getScoreHistoryForUsers as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeHistoryRow(userA.id, 20260610, 50, 100),
      makeHistoryRow(userB.id, 20260610, 25, 50),
    ]);

    const result = await getScoreHistoryForGroup([userA.id, userB.id], TOURNAMENT_ID);

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

    (findUsersByIds as ReturnType<typeof vi.fn>).mockResolvedValue([userA, userB, userC]);
    (getScoreHistoryForUsers as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeHistoryRow(userA.id, 20260610, 50, 100),
      makeHistoryRow(userB.id, 20260610, 50, 100), // tied with A
      makeHistoryRow(userC.id, 20260610, 25, 50),
    ]);

    const result = await getScoreHistoryForGroup([userA.id, userB.id, userC.id], TOURNAMENT_ID);

    const histA = result.userHistories.find((h) => h.userId === userA.id)!;
    const histB = result.userHistories.find((h) => h.userId === userB.id)!;
    const histC = result.userHistories.find((h) => h.userId === userC.id)!;

    expect(histA.data[0].rank).toBe(1);
    expect(histB.data[0].rank).toBe(1);
    expect(histC.data[0].rank).toBe(3); // skips rank 2
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 5. LOCF with score=0: user with no prior snapshot gets score=0 (ranked last)
  //    User-B's first snapshot is day2; on day1 they get score=0 via LOCF fix
  // ────────────────────────────────────────────────────────────────────────────
  it('gives score=0 to users with no prior data at a date (LOCF fix — ranked last)', async () => {
    const userA = testFactories.user({ id: 'user-A', nickname: 'Alice' });
    const userB = testFactories.user({ id: 'user-B', nickname: 'Bob' });

    (findUsersByIds as ReturnType<typeof vi.fn>).mockResolvedValue([userA, userB]);
    // user-A has snapshots on day1 and day2; user-B only on day2
    (getScoreHistoryForUsers as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeHistoryRow(userA.id, 20260601, 30, 60),  // day1: only A
      makeHistoryRow(userA.id, 20260602, 50, 100), // day2: A updated
      makeHistoryRow(userB.id, 20260602, 25, 50),  // day2: B first snapshot
    ]);

    const result = await getScoreHistoryForGroup([userA.id, userB.id], TOURNAMENT_ID);

    const histA = result.userHistories.find((h) => h.userId === userA.id)!;
    const histB = result.userHistories.find((h) => h.userId === userB.id)!;

    // day1: A (60pts) rank 1, B (0pts via LOCF fix) rank 2
    const day1PointA = histA.data.find((d) => d.date === 20260601)!;
    const day1PointB = histB.data.find((d) => d.date === 20260601)!;
    expect(day1PointA.rank).toBe(1);
    expect(day1PointA.totalPoints).toBe(60);
    // user-B gets score=0 (not excluded) and is ranked last
    expect(day1PointB).toBeDefined();
    expect(day1PointB.totalPoints).toBe(0);
    expect(day1PointB.rank).toBe(2);

    // day2: both users have actual snapshots → A (100pts) rank 1, B (50pts) rank 2
    const day2PointA = histA.data.find((d) => d.date === 20260602)!;
    const day2PointB = histB.data.find((d) => d.date === 20260602)!;
    expect(day2PointA.rank).toBe(1);
    expect(day2PointB.rank).toBe(2);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 6. tournamentStartDate populated from findFirstGameInTournament
  // ────────────────────────────────────────────────────────────────────────────
  it('populates tournamentStartDate from the first game date returned by the repository', async () => {
    const userA = testFactories.user({ id: 'user-A', nickname: 'Alice' });

    (findUsersByIds as ReturnType<typeof vi.fn>).mockResolvedValue([userA]);
    (getScoreHistoryForUsers as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeHistoryRow(userA.id, 20260610, 50, 100),
    ]);

    const firstGame = testFactories.game({
      tournament_id: TOURNAMENT_ID,
      game_date: new Date(2026, 5, 10), // June 10 2026 (local time, month is 0-indexed)
    });
    (findFirstGameInTournament as ReturnType<typeof vi.fn>).mockResolvedValue(firstGame);

    const result = await getScoreHistoryForGroup([userA.id], TOURNAMENT_ID);

    expect(result.tournamentStartDate).toBe(20260610);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 5b. LOCF carry-forward: user-A has snapshot on day1 but not day2 — score
  //     is carried forward to day2
  // ────────────────────────────────────────────────────────────────────────────
  it('carries forward last known score when user has no snapshot on a later date', async () => {
    const userA = testFactories.user({ id: 'user-A', nickname: 'Alice' });
    const userB = testFactories.user({ id: 'user-B', nickname: 'Bob' });

    (findUsersByIds as ReturnType<typeof vi.fn>).mockResolvedValue([userA, userB]);
    // user-A only has day1; user-B only has day2; day1 score should be carried to day2 for A
    (getScoreHistoryForUsers as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeHistoryRow(userA.id, 20260601, 30, 60),  // A: day1 snapshot
      makeHistoryRow(userB.id, 20260602, 25, 50),  // B: day2 snapshot
    ]);

    const result = await getScoreHistoryForGroup([userA.id, userB.id], TOURNAMENT_ID);

    const histA = result.userHistories.find((h) => h.userId === userA.id)!;
    const day2PointA = histA.data.find((d) => d.date === 20260602)!;

    // A's day1 score (60) carried forward to day2
    expect(day2PointA).toBeDefined();
    expect(day2PointA.totalPoints).toBe(60);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 7. isEmpty: false when at least one snapshot exists; displayName resolved
  // ────────────────────────────────────────────────────────────────────────────
  it('sets isEmpty to false when at least one snapshot exists and resolves displayName', async () => {
    const userA = testFactories.user({ id: 'user-A', nickname: 'Alice' });

    (findUsersByIds as ReturnType<typeof vi.fn>).mockResolvedValue([userA]);
    (getScoreHistoryForUsers as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeHistoryRow(userA.id, 20260610, 50, 100),
    ]);

    const result = await getScoreHistoryForGroup([userA.id], TOURNAMENT_ID);

    expect(result.isEmpty).toBe(false);
    expect(result.userHistories).toHaveLength(1);
    expect(result.userHistories[0].userId).toBe(userA.id);
    expect(result.userHistories[0].displayName).toBe('Alice');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// computeSnapshotScores
// ──────────────────────────────────────────────────────────────────────────────

const makeHistory = (userId: string, points: [number, number][]): UserScoreHistory => ({
  userId,
  displayName: userId,
  data: points.map(([date, totalPoints]) => ({ date, totalPoints, rank: 1 })),
});

describe('computeSnapshotScores', () => {
  it('returns empty Map when userHistories is empty', () => {
    const result = computeSnapshotScores([]);
    expect(result.size).toBe(0);
  });

  it('returns penultimate as undefined when only 1 distinct date exists', () => {
    const histories = [
      makeHistory('user-A', [[20260610, 100]]),
      makeHistory('user-B', [[20260610, 50]]),
    ];
    const result = computeSnapshotScores(histories);
    expect(result.get('user-A')?.penultimate).toBeUndefined();
    expect(result.get('user-A')?.latest).toBe(100);
    expect(result.get('user-B')?.latest).toBe(50);
  });

  it('returns correct latest and penultimate when ≥2 distinct dates exist', () => {
    const histories = [
      makeHistory('user-A', [[20260601, 60], [20260602, 100]]),
      makeHistory('user-B', [[20260601, 30], [20260602, 50]]),
    ];
    const result = computeSnapshotScores(histories);
    expect(result.get('user-A')).toEqual({ latest: 100, penultimate: 60 });
    expect(result.get('user-B')).toEqual({ latest: 50, penultimate: 30 });
  });

  it('uses LOCF-carried value for penultimate when user has no explicit snapshot on that date', () => {
    // user-A has snapshots on day1 and day3; no day2 snapshot but LOCF gives 60 at day2
    // After LOCF: user-A day1=60, day2=60 (carried), day3=100
    // Penultimate date = day2 → penultimate score = 60 (LOCF carry)
    const histories = [
      makeHistory('user-A', [[20260601, 60], [20260602, 60], [20260603, 100]]),
    ];
    const result = computeSnapshotScores(histories);
    expect(result.get('user-A')).toEqual({ latest: 100, penultimate: 60 });
  });

  it('returns penultimate score of 0 for user with no snapshot before penultimate date (LOCF gives 0)', () => {
    // user-B first snapshot is on the latest date; LOCF gives 0 at penultimate
    const histories = [
      makeHistory('user-A', [[20260601, 60], [20260602, 100]]),
      makeHistory('user-B', [[20260601, 0], [20260602, 50]]), // LOCF: 0 at day1
    ];
    const result = computeSnapshotScores(histories);
    expect(result.get('user-B')?.penultimate).toBe(0);
    expect(result.get('user-B')?.latest).toBe(50);
  });

  it('includes all users in result with no sparse exclusion', () => {
    const histories = [
      makeHistory('user-A', [[20260601, 60], [20260602, 100]]),
      makeHistory('user-B', [[20260601, 0], [20260602, 50]]),
      makeHistory('user-C', [[20260601, 0], [20260602, 75]]),
    ];
    const result = computeSnapshotScores(histories);
    expect(result.has('user-A')).toBe(true);
    expect(result.has('user-B')).toBe(true);
    expect(result.has('user-C')).toBe(true);
    expect(result.size).toBe(3);
  });
});
