import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getBoostStatsForUsersInTournament } from '../../app/db/game-guess-repository';
import { db } from '../../app/db/database';
import { createMockSelectQuery } from './mock-helpers';

// Mock the database
vi.mock('../../app/db/database', () => ({
  db: {
    selectFrom: vi.fn(),
    insertInto: vi.fn(),
    updateTable: vi.fn(),
    deleteFrom: vi.fn(),
  },
}));

// Mock base-repository
vi.mock('../../app/db/base-repository', () => ({
  createBaseFunctions: vi.fn(() => ({
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock React cache
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    cache: vi.fn((fn) => fn),
  };
});

describe('getBoostStatsForUsersInTournament', () => {
  const mockDb = vi.mocked(db);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array for empty userIds without querying DB', async () => {
    const result = await getBoostStatsForUsersInTournament([], 'tournament-1');
    expect(result).toEqual([]);
    expect(mockDb.selectFrom).not.toHaveBeenCalled();
  });

  it('returns correct boosts_used and scored_boosts counts', async () => {
    const mockRows = [
      { user_id: 'user-1', boosts_used: 3, scored_boosts: 2 },
      { user_id: 'user-2', boosts_used: 1, scored_boosts: 0 },
    ];
    const mockQuery = createMockSelectQuery(mockRows);
    mockDb.selectFrom.mockReturnValue(mockQuery as any);

    const result = await getBoostStatsForUsersInTournament(['user-1', 'user-2'], 'tournament-1');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ user_id: 'user-1', boosts_used: 3, scored_boosts: 2 });
    expect(result[1]).toEqual({ user_id: 'user-2', boosts_used: 1, scored_boosts: 0 });
  });

  it('returns 0 scored_boosts when all boosted games had score = 0', async () => {
    const mockRows = [
      { user_id: 'user-1', boosts_used: 2, scored_boosts: 0 },
    ];
    const mockQuery = createMockSelectQuery(mockRows);
    mockDb.selectFrom.mockReturnValue(mockQuery as any);

    const result = await getBoostStatsForUsersInTournament(['user-1'], 'tournament-1');

    expect(result[0].scored_boosts).toBe(0);
    expect(result[0].boosts_used).toBe(2);
  });

  it('returns empty array when no boost rows found for users', async () => {
    const mockQuery = createMockSelectQuery([]);
    mockDb.selectFrom.mockReturnValue(mockQuery as any);

    const result = await getBoostStatsForUsersInTournament(['user-1', 'user-2'], 'tournament-1');

    expect(result).toEqual([]);
  });

  it('filters to the specified tournament via innerJoin on games', async () => {
    const mockRows = [{ user_id: 'user-1', boosts_used: 1, scored_boosts: 1 }];
    const mockQuery = createMockSelectQuery(mockRows);
    mockDb.selectFrom.mockReturnValue(mockQuery as any);

    await getBoostStatsForUsersInTournament(['user-1'], 'tournament-42');

    expect(mockDb.selectFrom).toHaveBeenCalledWith('game_guesses as gg');
    expect(mockQuery.innerJoin).toHaveBeenCalledWith('games as g', 'g.id', 'gg.game_id');
    expect(mockQuery.where).toHaveBeenCalledWith('g.tournament_id', '=', 'tournament-42');
  });

  it('filters out non-boosted guesses (boost_type IS NOT NULL filter)', async () => {
    const mockRows = [{ user_id: 'user-1', boosts_used: 1, scored_boosts: 1 }];
    const mockQuery = createMockSelectQuery(mockRows);
    mockDb.selectFrom.mockReturnValue(mockQuery as any);

    await getBoostStatsForUsersInTournament(['user-1'], 'tournament-1');

    expect(mockQuery.where).toHaveBeenCalledWith('gg.boost_type', 'is not', null);
  });

  it('groups results by user_id', async () => {
    const mockRows = [{ user_id: 'user-1', boosts_used: 5, scored_boosts: 3 }];
    const mockQuery = createMockSelectQuery(mockRows);
    mockDb.selectFrom.mockReturnValue(mockQuery as any);

    await getBoostStatsForUsersInTournament(['user-1'], 'tournament-1');

    expect(mockQuery.groupBy).toHaveBeenCalledWith('gg.user_id');
  });
});
