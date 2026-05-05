import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTournamentPredictionCompletion } from '../tournament-prediction-completion-repository'
import { db } from '../database'
import { createMockSelectQuery } from '../../../__tests__/db/mock-helpers'
import { testFactories } from '../../../__tests__/db/test-factories'
import * as tournamentGuessRepository from '../tournament-guess-repository'
import * as qualifiedTeamsRepository from '../qualified-teams-repository'
import * as tournamentActions from '../../actions/tournament-actions'
import { PREDICTION_LOCK_OFFSET_MS } from '../../utils/prediction-constants'

vi.mock('../database', () => ({
  db: { selectFrom: vi.fn() },
}))

vi.mock('../tournament-guess-repository', () => ({
  findTournamentGuessByUserIdTournament: vi.fn(),
}))

vi.mock('../qualified-teams-repository', () => ({
  getAllUserGroupPositionsPredictions: vi.fn(),
}))

vi.mock('../../actions/tournament-actions', () => ({
  getTournamentStartDate: vi.fn(),
}))

const TOURNAMENT_ID = 'tournament-1'
const USER_ID = 'user-1'

const makeGameStats = (overrides = {}) => ({
  total_games: 64,
  total_group_games: 48,
  completed_games: 32,
  completed_group_games: 24,
  silver_boosts_used: 2,
  golden_boosts_used: 1,
  ...overrides,
})

const makePlayoffRound = (id: string, overrides = {}) => ({
  id,
  round_name: 'Round of 16',
  round_order: 1,
  is_final: false,
  is_third_place: false,
  is_first_stage: true,
  total_games: 8,
  completed_games: 4,
  ...overrides,
})

function mockParallelQueries(
  gameStats: ReturnType<typeof makeGameStats> | undefined,
  playoffRounds: ReturnType<typeof makePlayoffRound>[]
) {
  // fetchGameAndBoostStats uses executeTakeFirst → selectFrom called first
  const gameStatsQuery = createMockSelectQuery(gameStats ?? null)
  // fetchPlayoffRoundsWithCompletion uses execute → selectFrom called second
  const playoffQuery = createMockSelectQuery(playoffRounds)

  vi.mocked(db.selectFrom)
    .mockReturnValueOnce(gameStatsQuery as any)
    .mockReturnValueOnce(playoffQuery as any)
}

describe('getTournamentPredictionCompletion', () => {
  const tournament = testFactories.tournament({ max_silver_games: 5, max_golden_games: 3 })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(tournamentGuessRepository.findTournamentGuessByUserIdTournament).mockResolvedValue(null)
    vi.mocked(qualifiedTeamsRepository.getAllUserGroupPositionsPredictions).mockResolvedValue([])
    vi.mocked(tournamentActions.getTournamentStartDate).mockResolvedValue(new Date('2026-06-01'))
  })

  it('returns correct TournamentPredictionCompletion shape with accurate counts', async () => {
    const guess = testFactories.tournamentGuess({
      champion_team_id: 'team-1',
      runner_up_team_id: 'team-2',
      third_place_team_id: null,
      best_player_id: 'player-1',
      top_goalscorer_player_id: 'player-2',
      best_goalkeeper_player_id: null,
      best_young_player_id: null,
    })
    vi.mocked(tournamentGuessRepository.findTournamentGuessByUserIdTournament).mockResolvedValue(guess)
    mockParallelQueries(makeGameStats({ total_games: 64, completed_games: 10 }), [])

    const result = await getTournamentPredictionCompletion(USER_ID, TOURNAMENT_ID, tournament)

    expect(result.totalGames).toBe(64)
    expect(result.completedGames).toBe(10)
    expect(result.finalStandings.completed).toBe(2) // champion + runner_up
    expect(result.finalStandings.total).toBe(3)
    expect(result.awards.completed).toBe(2) // bestPlayer + topGoalscorer
    expect(result.awards.total).toBe(4)
    expect(result.silverBoostsMax).toBe(5)
    expect(result.goldenBoostsMax).toBe(3)
  })

  it('isPredictionLocked is true when firstGameDate + offset is in the past', async () => {
    mockParallelQueries(makeGameStats(), [])
    const pastDate = new Date(Date.now() - PREDICTION_LOCK_OFFSET_MS - 1000)

    const result = await getTournamentPredictionCompletion(
      USER_ID, TOURNAMENT_ID, tournament, pastDate
    )

    expect(result.isPredictionLocked).toBe(true)
    expect(tournamentActions.getTournamentStartDate).not.toHaveBeenCalled()
  })

  it('isPredictionLocked is false when firstGameDate + offset is still in the future', async () => {
    mockParallelQueries(makeGameStats(), [])
    const futureDate = new Date(Date.now() + PREDICTION_LOCK_OFFSET_MS + 1000)

    const result = await getTournamentPredictionCompletion(
      USER_ID, TOURNAMENT_ID, tournament, futureDate
    )

    expect(result.isPredictionLocked).toBe(false)
    expect(tournamentActions.getTournamentStartDate).not.toHaveBeenCalled()
  })

  it('getTournamentStartDate is NOT called when firstGameDate param is provided', async () => {
    mockParallelQueries(makeGameStats(), [])

    await getTournamentPredictionCompletion(USER_ID, TOURNAMENT_ID, tournament, new Date())

    expect(tournamentActions.getTournamentStartDate).not.toHaveBeenCalled()
  })

  it('getTournamentStartDate IS called when firstGameDate param is not provided', async () => {
    mockParallelQueries(makeGameStats(), [])

    await getTournamentPredictionCompletion(USER_ID, TOURNAMENT_ID, tournament)

    expect(tournamentActions.getTournamentStartDate).toHaveBeenCalledWith(TOURNAMENT_ID)
  })

  it('qualifier total equals 2x the number of games across first-stage rounds', async () => {
    mockParallelQueries(makeGameStats(), [
      makePlayoffRound('r1', { is_first_stage: true, total_games: 8 }),
      makePlayoffRound('r2', { is_first_stage: false, total_games: 4 }),
    ])

    const result = await getTournamentPredictionCompletion(USER_ID, TOURNAMENT_ID, tournament)

    // Only r1 is first stage (8 games) → 16 qualifier slots
    expect(result.qualifiers.total).toBe(16)
  })

  it('completed_games counts only games with both scores set, excluding partial scores', async () => {
    // The fetchGameAndBoostStats query uses COUNT(*) FILTER on home_score IS NOT NULL
    // AND away_score IS NOT NULL — verify the result flows through correctly
    mockParallelQueries(makeGameStats({ completed_games: 5, total_games: 10 }), [])

    const result = await getTournamentPredictionCompletion(USER_ID, TOURNAMENT_ID, tournament)

    expect(result.completedGames).toBe(5)
    expect(result.totalGames).toBe(10)
  })

  it('returns all zeros when user has made no guesses', async () => {
    mockParallelQueries(
      makeGameStats({
        total_games: 64,
        total_group_games: 48,
        completed_games: 0,
        completed_group_games: 0,
        silver_boosts_used: 0,
        golden_boosts_used: 0,
      }),
      []
    )

    const result = await getTournamentPredictionCompletion(USER_ID, TOURNAMENT_ID, tournament)

    expect(result.completedGames).toBe(0)
    expect(result.completedGroupGames).toBe(0)
    expect(result.silverBoostsUsed).toBe(0)
    expect(result.goldenBoostsUsed).toBe(0)
    expect(result.finalStandings.completed).toBe(0)
    expect(result.awards.completed).toBe(0)
    expect(result.qualifiersCompleted ?? result.qualifiers.completed).toBe(0)
  })

  it('playoffRoundsCompletion has 0 completed for a round with no user guesses', async () => {
    mockParallelQueries(makeGameStats(), [
      makePlayoffRound('r1', { total_games: 8, completed_games: 0 }),
    ])

    const result = await getTournamentPredictionCompletion(USER_ID, TOURNAMENT_ID, tournament)

    expect(result.playoffRoundsCompletion['r1'].total).toBe(8)
    expect(result.playoffRoundsCompletion['r1'].completed).toBe(0)
  })

  it('silver and golden boost counts flow through correctly', async () => {
    mockParallelQueries(makeGameStats({ silver_boosts_used: 3, golden_boosts_used: 2 }), [])

    const result = await getTournamentPredictionCompletion(USER_ID, TOURNAMENT_ID, tournament)

    expect(result.silverBoostsUsed).toBe(3)
    expect(result.goldenBoostsUsed).toBe(2)
  })

  it('handles no playoff rounds gracefully (no tournament_playoff_round_games rows)', async () => {
    mockParallelQueries(makeGameStats({ total_games: 48, total_group_games: 48 }), [])

    const result = await getTournamentPredictionCompletion(USER_ID, TOURNAMENT_ID, tournament)

    expect(result.playoffRoundsCompletion).toEqual({})
    expect(result.qualifiers.total).toBe(0)
  })
})
