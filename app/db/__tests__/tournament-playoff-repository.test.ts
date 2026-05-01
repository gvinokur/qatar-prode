import { describe, it, expect, vi, beforeEach } from 'vitest'
import { findPlayoffRoundsWithAvailabilityInfo } from '../tournament-playoff-repository'
import { db } from '../database'
import { createMockSelectQuery } from '../../../__tests__/db/mock-helpers'

vi.mock('../database', () => ({
  db: { selectFrom: vi.fn() },
}))

const TOURNAMENT_ID = 'tournament-1'
const USER_ID = 'user-1'

const makeRound = (id: string, roundOrder: number) => ({ id, round_order: roundOrder })

const makeGame = (roundId: string, gameId: string, opts: { homeTeam?: string | null; awayTeam?: string | null; gameDate?: Date } = {}) => ({
  round_id: roundId,
  game_id: gameId,
  game_date: opts.gameDate ?? new Date('2026-06-20T15:00:00Z'),
  home_team: opts.homeTeam ?? null,
  away_team: opts.awayTeam ?? null,
})

// Helper to set up db mock for 4 sequential queries:
// 1. rounds  2. games  3. completedGameIds  4. lastGroupGame
function mockQueries(
  rounds: ReturnType<typeof makeRound>[],
  games: ReturnType<typeof makeGame>[],
  completedGameIds: { game_id: string }[],
  lastGroupGameDate: Date | null
) {
  const roundsQuery = createMockSelectQuery(rounds)
  const gamesQuery = createMockSelectQuery(games)
  const completedQuery = createMockSelectQuery(completedGameIds)
  const lastGroupQuery = createMockSelectQuery(lastGroupGameDate ? { max_date: lastGroupGameDate } : null)

  vi.mocked(db.selectFrom)
    .mockReturnValueOnce(roundsQuery as any)
    .mockReturnValueOnce(gamesQuery as any)
    .mockReturnValueOnce(completedQuery as any)
    .mockReturnValueOnce(lastGroupQuery as any)
}

describe('findPlayoffRoundsWithAvailabilityInfo', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns empty array when tournament has no playoff rounds', async () => {
    const roundsQuery = createMockSelectQuery([])
    vi.mocked(db.selectFrom).mockReturnValueOnce(roundsQuery as any)

    const result = await findPlayoffRoundsWithAvailabilityInfo(TOURNAMENT_ID, USER_ID)
    expect(result).toEqual([])
  })

  it('hasTeamsDefined=true when any game in round has both teams set', async () => {
    const round = makeRound('r1', 1)
    const game = makeGame('r1', 'g1', { homeTeam: 'Brazil', awayTeam: 'Argentina' })
    mockQueries([round], [game], [], null)

    const result = await findPlayoffRoundsWithAvailabilityInfo(TOURNAMENT_ID, USER_ID)
    expect(result[0].hasTeamsDefined).toBe(true)
  })

  it('hasTeamsDefined=false when all games have null team slots', async () => {
    const round = makeRound('r1', 1)
    const game = makeGame('r1', 'g1', { homeTeam: null, awayTeam: null })
    mockQueries([round], [game], [], null)

    const result = await findPlayoffRoundsWithAvailabilityInfo(TOURNAMENT_ID, USER_ID)
    expect(result[0].hasTeamsDefined).toBe(false)
  })

  it('previousStageLastGameDate is null for the first round when no group games exist', async () => {
    const round = makeRound('r1', 1)
    const game = makeGame('r1', 'g1')
    mockQueries([round], [game], [], null)

    const result = await findPlayoffRoundsWithAvailabilityInfo(TOURNAMENT_ID, USER_ID)
    expect(result[0].previousStageLastGameDate).toBeNull()
  })

  it('previousStageLastGameDate equals last group game date for the first playoff round', async () => {
    const lastGroupDate = new Date('2026-06-15T20:00:00Z')
    const round = makeRound('r1', 1)
    const game = makeGame('r1', 'g1')
    mockQueries([round], [game], [], lastGroupDate)

    const result = await findPlayoffRoundsWithAvailabilityInfo(TOURNAMENT_ID, USER_ID)
    expect(result[0].previousStageLastGameDate).toEqual(lastGroupDate)
  })

  it('previousStageLastGameDate equals last game of previous round for subsequent rounds', async () => {
    const round1 = makeRound('r1', 1)
    const round2 = makeRound('r2', 2)
    const r1GameDate = new Date('2026-06-20T18:00:00Z')
    const game1 = makeGame('r1', 'g1', { gameDate: r1GameDate })
    const game2 = makeGame('r2', 'g2', { gameDate: new Date('2026-06-25T20:00:00Z') })
    mockQueries([round1, round2], [game1, game2], [], null)

    const result = await findPlayoffRoundsWithAvailabilityInfo(TOURNAMENT_ID, USER_ID)
    expect(result[1].previousStageLastGameDate).toEqual(r1GameDate)
  })

  it('hasUnpredictedGames=false when user has completed all games in the round', async () => {
    const round = makeRound('r1', 1)
    const game = makeGame('r1', 'g1')
    mockQueries([round], [game], [{ game_id: 'g1' }], null)

    const result = await findPlayoffRoundsWithAvailabilityInfo(TOURNAMENT_ID, USER_ID)
    expect(result[0].hasUnpredictedGames).toBe(false)
  })

  it('hasUnpredictedGames=true when user has not completed any game in the round', async () => {
    const round = makeRound('r1', 1)
    const game = makeGame('r1', 'g1')
    mockQueries([round], [game], [], null)

    const result = await findPlayoffRoundsWithAvailabilityInfo(TOURNAMENT_ID, USER_ID)
    expect(result[0].hasUnpredictedGames).toBe(true)
  })
})
