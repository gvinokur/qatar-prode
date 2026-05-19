import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findTeamById, createTeam } from '../team-repository';
import { db } from '../database';
import {
  createMockSelectQuery,
  createMockInsertQuery,
} from '../../../__tests__/db/mock-helpers';
import { testFactories } from '../../../__tests__/db/test-factories';

vi.mock('../database', () => ({
  db: {
    selectFrom: vi.fn(),
    insertInto: vi.fn(),
    updateTable: vi.fn(),
    deleteFrom: vi.fn(),
  },
}));

// react cache() is a no-op in tests
vi.mock('react', () => ({ cache: (fn: unknown) => fn }));

describe('team rank field', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns rank when set on a team', async () => {
    const mockTeam = testFactories.team({ id: 'team-1', rank: 10 });
    const mockQuery = createMockSelectQuery(mockTeam);
    (db.selectFrom as any).mockReturnValue(mockQuery);

    const result = await findTeamById('team-1');

    expect(result?.rank).toBe(10);
  });

  it('returns null rank for teams without a ranking (Copa América, Euro)', async () => {
    const mockTeam = testFactories.team({ id: 'team-2', rank: null });
    const mockQuery = createMockSelectQuery(mockTeam);
    (db.selectFrom as any).mockReturnValue(mockQuery);

    const result = await findTeamById('team-2');

    expect(result?.rank).toBeNull();
  });

  it('rejects rank = 0 via check constraint (lower bound)', async () => {
    const constraintError = Object.assign(new Error('check constraint violation'), {
      code: '23514',
      constraint: 'teams_rank_check',
    });
    const mockInsertQuery = {
      values: vi.fn().mockReturnThis(),
      returningAll: vi.fn().mockReturnThis(),
      executeTakeFirstOrThrow: vi.fn().mockRejectedValue(constraintError),
    };
    (db.insertInto as any).mockReturnValue(mockInsertQuery);

    await expect(
      createTeam({ name: 'Test', short_name: 'TST', rank: 0 } as any)
    ).rejects.toThrow('check constraint violation');
  });

  it('rejects rank = 1000 via check constraint (upper bound)', async () => {
    const constraintError = Object.assign(new Error('check constraint violation'), {
      code: '23514',
      constraint: 'teams_rank_check',
    });
    const mockInsertQuery = {
      values: vi.fn().mockReturnThis(),
      returningAll: vi.fn().mockReturnThis(),
      executeTakeFirstOrThrow: vi.fn().mockRejectedValue(constraintError),
    };
    (db.insertInto as any).mockReturnValue(mockInsertQuery);

    await expect(
      createTeam({ name: 'Test', short_name: 'TST', rank: 1000 } as any)
    ).rejects.toThrow('check constraint violation');
  });

  it('accepts boundary ranks 1 and 999', async () => {
    const teamRank1 = testFactories.team({ id: 'team-3', rank: 1 });
    const mockInsertQuery = createMockInsertQuery(teamRank1);
    (db.insertInto as any).mockReturnValue(mockInsertQuery);

    const result = await createTeam({ name: 'Best Team', short_name: 'BST', rank: 1 } as any);
    expect(result.rank).toBe(1);

    const teamRank999 = testFactories.team({ id: 'team-4', rank: 999 });
    const mockInsertQuery2 = createMockInsertQuery(teamRank999);
    (db.insertInto as any).mockReturnValue(mockInsertQuery2);

    const result2 = await createTeam({ name: 'Last Team', short_name: 'LST', rank: 999 } as any);
    expect(result2.rank).toBe(999);
  });
});
