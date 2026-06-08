import { describe, it, expect, vi, beforeEach } from 'vitest'

// sql<T>.execute(db) calls db.getExecutor().executeQuery internally.
// We mock getExecutor to return a controllable executeQuery spy.
vi.mock('../database', () => ({
  db: {
    getExecutor: vi.fn(),
  },
}))

import { getUserTournamentCompletionsPaginated } from '../user-tournament-completion-repository'
import { db } from '../database'

const TOURNAMENT_ID = 'tournament-1'

function makeRawRow(overrides: Partial<{
  user_id: string
  nickname: string
  is_email_verified: boolean
  games_predicted: string
  total_games: string
  qualifiers_filled: string
  qualifiers_total: string
  awards_filled: string
  group_count: string
  group_names: string[] | null
}> = {}) {
  return {
    user_id: 'user-1',
    nickname: 'Alice',
    is_email_verified: true,
    games_predicted: '0',
    total_games: '48',
    qualifiers_filled: '0',
    qualifiers_total: '20',
    awards_filled: '0',
    group_count: '0',
    group_names: null,
    ...overrides,
  }
}

function mockDb(mainRows: object[], countValue = '0') {
  const executeQuery = vi.fn()
    .mockResolvedValueOnce({ rows: mainRows })
    .mockResolvedValueOnce({ rows: [{ count: countValue }] })
  const executor = {
    transformQuery: vi.fn((node: unknown) => node),
    compileQuery: vi.fn(() => ({ sql: '', parameters: [], queryId: {} })),
    executeQuery,
  }
  vi.mocked(db.getExecutor as ReturnType<typeof vi.fn>).mockReturnValue(executor)
  return executeQuery
}

describe('getUserTournamentCompletionsPaginated', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty rows and total 0 when no users exist', async () => {
    mockDb([], '0')

    const result = await getUserTournamentCompletionsPaginated(TOURNAMENT_ID, 0, 25)

    expect(result.rows).toEqual([])
    expect(result.total).toBe(0)
  })

  it('maps raw DB row to UserTournamentCompletionRow correctly', async () => {
    const rawRow = makeRawRow({
      user_id: 'u1',
      nickname: 'Bob',
      is_email_verified: false,
      games_predicted: '10',
      total_games: '48',
      qualifiers_filled: '4',
      qualifiers_total: '20',
      awards_filled: '3',
      group_count: '2',
      group_names: ['Alpha', 'Beta'],
    })
    mockDb([rawRow], '1')

    const result = await getUserTournamentCompletionsPaginated(TOURNAMENT_ID, 0, 25)

    expect(result.rows[0]).toMatchObject({
      userId: 'u1',
      nickname: 'Bob',
      isEmailVerified: false,
      gamesPredicted: 10,
      totalGames: 48,
      qualifiersFilled: 4,
      qualifiersTotal: 20,
      awardsFilled: 3,
      awardsTotal: 7,
      groupCount: 2,
      groupNames: ['Alpha', 'Beta'],
    })
  })

  it('coerces COUNT bigint strings to numbers', async () => {
    mockDb([makeRawRow({ games_predicted: '35', qualifiers_filled: '16', awards_filled: '6' })], '100')

    const result = await getUserTournamentCompletionsPaginated(TOURNAMENT_ID, 0, 25)

    expect(result.rows[0].gamesPredicted).toBe(35)
    expect(result.rows[0].qualifiersFilled).toBe(16)
    expect(result.rows[0].awardsFilled).toBe(6)
    expect(result.total).toBe(100)
  })

  it('computes overallPct as 0 when no predictions made', async () => {
    mockDb([makeRawRow({ games_predicted: '0', qualifiers_filled: '0', awards_filled: '0' })], '1')

    const result = await getUserTournamentCompletionsPaginated(TOURNAMENT_ID, 0, 25)

    expect(result.rows[0].overallPct).toBe(0)
  })

  it('computes overallPct as 100 when all predictions filled', async () => {
    const rawRow = makeRawRow({
      games_predicted: '48',
      total_games: '48',
      qualifiers_filled: '20',
      qualifiers_total: '20',
      awards_filled: '7',
    })
    mockDb([rawRow], '1')

    const result = await getUserTournamentCompletionsPaginated(TOURNAMENT_ID, 0, 25)

    expect(result.rows[0].overallPct).toBe(100)
  })

  it('returns overallPct 0 when denominator is 0 (no games and no groups)', async () => {
    mockDb([makeRawRow({ total_games: '0', qualifiers_total: '0', awards_filled: '0' })], '1')

    const result = await getUserTournamentCompletionsPaginated(TOURNAMENT_ID, 0, 25)

    expect(result.rows[0].overallPct).toBe(0)
  })

  it('always sets awardsTotal to 7', async () => {
    mockDb([makeRawRow()], '1')

    const result = await getUserTournamentCompletionsPaginated(TOURNAMENT_ID, 0, 25)

    expect(result.rows[0].awardsTotal).toBe(7)
  })

  it('treats null group_names as empty array', async () => {
    mockDb([makeRawRow({ group_count: '0', group_names: null })], '1')

    const result = await getUserTournamentCompletionsPaginated(TOURNAMENT_ID, 0, 25)

    expect(result.rows[0].groupNames).toEqual([])
    expect(result.rows[0].groupCount).toBe(0)
  })

  it('executes two parallel DB queries (main + count)', async () => {
    const executeQuery = mockDb([], '0')

    await getUserTournamentCompletionsPaginated(TOURNAMENT_ID, 0, 25)

    expect(executeQuery).toHaveBeenCalledTimes(2)
  })

  it('returns total 0 when count query returns empty rows array', async () => {
    const executor = {
      transformQuery: vi.fn((node: unknown) => node),
      compileQuery: vi.fn(() => ({ sql: '', parameters: [], queryId: {} })),
      executeQuery: vi.fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }),
    }
    vi.mocked(db.getExecutor as ReturnType<typeof vi.fn>).mockReturnValue(executor)

    const result = await getUserTournamentCompletionsPaginated(TOURNAMENT_ID, 0, 25)

    expect(result.total).toBe(0)
  })
})
