import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  findFirstGameInTournament,
  findLastGameInTournament,
  findGamesInNext24Hours,
  findGamesForDashboard,
  getAllTournamentGames,
  findRecentGamesForDashboard,
  findRecentGamesWithUserGuesses,
} from '../game-repository'
import { db } from '../database'
import { createMockSelectQuery } from '../../../__tests__/db/mock-helpers'

vi.mock('../database', () => ({
  db: { selectFrom: vi.fn() },
}))

const TOURNAMENT_ID = 'tournament-1'
const USER_ID = 'user-1'

beforeEach(() => { vi.clearAllMocks() })

describe('findFirstGameInTournament', () => {
  it('orders by game_date asc then game_number asc for stable ordering', async () => {
    const mockQuery = createMockSelectQuery(undefined)
    vi.mocked(db.selectFrom).mockReturnValue(mockQuery as any)

    await findFirstGameInTournament(TOURNAMENT_ID)

    expect(mockQuery.orderBy).toHaveBeenCalledWith('game_date asc')
    expect(mockQuery.orderBy).toHaveBeenCalledWith('game_number asc')
  })
})

describe('findLastGameInTournament', () => {
  it('orders by game_date desc then game_number desc for stable ordering', async () => {
    const mockQuery = createMockSelectQuery(undefined)
    vi.mocked(db.selectFrom).mockReturnValue(mockQuery as any)

    await findLastGameInTournament(TOURNAMENT_ID)

    expect(mockQuery.orderBy).toHaveBeenCalledWith('game_date', 'desc')
    expect(mockQuery.orderBy).toHaveBeenCalledWith('game_number', 'desc')
  })
})

describe('findGamesInNext24Hours', () => {
  it('orders by game_date asc then game_number asc for stable ordering', async () => {
    const mockQuery = createMockSelectQuery([])
    vi.mocked(db.selectFrom).mockReturnValue(mockQuery as any)

    await findGamesInNext24Hours(TOURNAMENT_ID)

    expect(mockQuery.orderBy).toHaveBeenCalledWith('game_date', 'asc')
    expect(mockQuery.orderBy).toHaveBeenCalledWith('game_number', 'asc')
  })
})

describe('findGamesForDashboard', () => {
  it('orders by game_date asc then game_number asc for stable ordering', async () => {
    const mockQuery = createMockSelectQuery([])
    vi.mocked(db.selectFrom).mockReturnValue(mockQuery as any)

    await findGamesForDashboard(TOURNAMENT_ID)

    expect(mockQuery.orderBy).toHaveBeenCalledWith('game_date', 'asc')
    expect(mockQuery.orderBy).toHaveBeenCalledWith('game_number', 'asc')
  })
})

describe('getAllTournamentGames', () => {
  it('orders by game_number asc as tertiary stable sort', async () => {
    const mockQuery = createMockSelectQuery([])
    vi.mocked(db.selectFrom).mockReturnValue(mockQuery as any)

    await getAllTournamentGames(TOURNAMENT_ID)

    expect(mockQuery.orderBy).toHaveBeenCalledWith('game_number', 'asc')
  })
})

describe('findRecentGamesForDashboard — game_number ordering', () => {
  it('orders by game_number desc as stable tiebreaker after game_date desc', async () => {
    const mockQuery = createMockSelectQuery([])
    vi.mocked(db.selectFrom).mockReturnValue(mockQuery as any)

    await findRecentGamesForDashboard(USER_ID, TOURNAMENT_ID, 10)

    expect(mockQuery.orderBy).toHaveBeenCalledWith('games.game_date', 'desc')
    expect(mockQuery.orderBy).toHaveBeenCalledWith('games.game_number', 'desc')
  })
})

describe('findRecentGamesWithUserGuesses', () => {
  it('returns empty array when limit is 0', async () => {
    const result = await findRecentGamesWithUserGuesses(USER_ID, TOURNAMENT_ID, 0)
    expect(result).toEqual([])
    expect(db.selectFrom).not.toHaveBeenCalled()
  })

  it('orders by game_date desc then game_number desc for stable ordering', async () => {
    const mockQuery = createMockSelectQuery([])
    vi.mocked(db.selectFrom).mockReturnValue(mockQuery as any)

    await findRecentGamesWithUserGuesses(USER_ID, TOURNAMENT_ID, 5)

    expect(mockQuery.orderBy).toHaveBeenCalledWith('games.game_date', 'desc')
    expect(mockQuery.orderBy).toHaveBeenCalledWith('games.game_number', 'desc')
  })

  it('maps returned rows to RecentGameWithGuess shape correctly', async () => {
    const row = {
      gameId: 'game-x',
      homeTeamId: 'home',
      awayTeamId: 'away',
      homeScore: 2,
      awayScore: 0,
      userHomeGuess: 1,
      userAwayGuess: 0,
      guessScore: 1,
      boostType: null,
      boostMultiplier: null,
      finalScore: null,
      gameDate: new Date('2024-01-01'),
    }
    const mockQuery = createMockSelectQuery([row])
    vi.mocked(db.selectFrom).mockReturnValue(mockQuery as any)

    const result = await findRecentGamesWithUserGuesses(USER_ID, TOURNAMENT_ID, 5)

    expect(result[0]).toEqual({
      gameId: 'game-x',
      homeTeamId: 'home',
      awayTeamId: 'away',
      homeScore: 2,
      awayScore: 0,
      userHomeGuess: 1,
      userAwayGuess: 0,
      guessScore: 1,
      boostType: null,
      boostMultiplier: null,
      finalScore: null,
      gameDate: new Date('2024-01-01'),
    })
  })
})
