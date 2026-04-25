import { describe, it, expect, vi, beforeEach } from 'vitest'
import { findRecentGamesForDashboard } from '../game-repository'
import { db } from '../database'
import { createMockSelectQuery } from '../../../__tests__/db/mock-helpers'

vi.mock('../database', () => ({
  db: { selectFrom: vi.fn() },
}))

const USER_ID = 'user-1'
const TOURNAMENT_ID = 'tournament-1'

const makeRawRow = (overrides?: Partial<any>) => ({
  gameId: 'game-1',
  homeTeamId: 'team-home',
  awayTeamId: 'team-away',
  homeScore: 2,
  awayScore: 1,
  userHomeGuess: 2,
  userAwayGuess: 1,
  guessScore: 3,
  boostType: null,
  boostMultiplier: null,
  finalScore: null,
  gameDate: new Date('2022-12-18'),
  ...overrides,
})

describe('findRecentGamesForDashboard', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns empty array when limit is 0', async () => {
    const result = await findRecentGamesForDashboard(USER_ID, TOURNAMENT_ID, 0)

    expect(result).toEqual([])
    expect(db.selectFrom).not.toHaveBeenCalled()
  })

  it('returns empty array when no games fall in the window', async () => {
    const mockQuery = createMockSelectQuery([])
    vi.mocked(db.selectFrom).mockReturnValue(mockQuery as any)

    const result = await findRecentGamesForDashboard(USER_ID, TOURNAMENT_ID, 10)

    expect(result).toEqual([])
    expect(mockQuery.execute).toHaveBeenCalled()
  })

  it('returns games with null scores when result not yet published (pending)', async () => {
    const row = makeRawRow({ homeScore: null, awayScore: null })
    const mockQuery = createMockSelectQuery([row])
    vi.mocked(db.selectFrom).mockReturnValue(mockQuery as any)

    const result = await findRecentGamesForDashboard(USER_ID, TOURNAMENT_ID, 10)

    expect(result[0].homeScore).toBeNull()
    expect(result[0].awayScore).toBeNull()
  })

  it('returns games with null guesses when user has no prediction', async () => {
    const row = makeRawRow({ userHomeGuess: null, userAwayGuess: null, guessScore: null })
    const mockQuery = createMockSelectQuery([row])
    vi.mocked(db.selectFrom).mockReturnValue(mockQuery as any)

    const result = await findRecentGamesForDashboard(USER_ID, TOURNAMENT_ID, 10)

    expect(result[0].userHomeGuess).toBeNull()
    expect(result[0].userAwayGuess).toBeNull()
    expect(result[0].guessScore).toBeNull()
  })

  it('limits results to the provided limit parameter', async () => {
    const mockQuery = createMockSelectQuery([])
    vi.mocked(db.selectFrom).mockReturnValue(mockQuery as any)

    await findRecentGamesForDashboard(USER_ID, TOURNAMENT_ID, 5)

    expect(mockQuery.limit).toHaveBeenCalledWith(5)
  })

  it('orders results by game_date descending', async () => {
    const mockQuery = createMockSelectQuery([])
    vi.mocked(db.selectFrom).mockReturnValue(mockQuery as any)

    await findRecentGamesForDashboard(USER_ID, TOURNAMENT_ID, 10)

    expect(mockQuery.orderBy).toHaveBeenCalledWith('games.game_date', 'desc')
  })

  it('maps returned rows to RecentGameForDashboard shape correctly', async () => {
    const row = makeRawRow({
      gameId: 'game-abc',
      homeTeamId: 'home-team',
      awayTeamId: 'away-team',
      homeScore: 3,
      awayScore: 1,
      userHomeGuess: 2,
      userAwayGuess: 0,
      guessScore: 2,
      boostType: 'silver',
      boostMultiplier: 2,
      finalScore: 4,
      gameDate: new Date('2022-12-18'),
    })
    const mockQuery = createMockSelectQuery([row])
    vi.mocked(db.selectFrom).mockReturnValue(mockQuery as any)

    const result = await findRecentGamesForDashboard(USER_ID, TOURNAMENT_ID, 10)

    expect(result[0]).toEqual({
      gameId: 'game-abc',
      homeTeamId: 'home-team',
      awayTeamId: 'away-team',
      homeScore: 3,
      awayScore: 1,
      homePenaltyScore: null,
      awayPenaltyScore: null,
      userHomeGuess: 2,
      userAwayGuess: 0,
      userHomePenaltyWinner: null,
      userAwayPenaltyWinner: null,
      guessScore: 2,
      boostType: 'silver',
      boostMultiplier: 2,
      finalScore: 4,
      gameDate: new Date('2022-12-18'),
    })
  })
})
