import { describe, it, expect } from 'vitest'
import { computePriorityAttention } from '../priority-attention'
import type { ActionCenterData } from '../../actions/hub-actions'

const defaultScoringConfig = {
  game_exact_score_points: 3,
  game_correct_goal_difference_points: 2,
  game_correct_outcome_points: 1,
  champion_points: 5,
  runner_up_points: 3,
  third_place_points: 1,
  individual_award_points: 3,
  qualified_team_points: 1,
  exact_position_qualified_points: 2,
  max_silver_games: 0,
  max_golden_games: 0,
}

const makeData = (overrides: Partial<ActionCenterData> = {}): ActionCenterData => ({
  games: [],
  gameGuesses: {},
  teamsMap: {},
  tournamentMaxSilver: 0,
  tournamentMaxGolden: 0,
  mode: 'empty',
  qtAndAwardsOpen: false,
  msUntilPredictionLock: 0,
  tournamentFinished: false,
  firstGameDate: null,
  tournamentHasStarted: true,
  tournamentName: null,
  openerBackfill: false,
  totalGames: 64,
  predictedGames: 0,
  groupStageGamesCompleted: 0,
  groupStageGamesTotal: 48,
  awardsCompleted: 0,
  awardsTotal: 7,
  qualifiersCompleted: 0,
  qualifiersTotal: 32,
  tournamentJustStarted: false,
  silverBoostsUsed: 0,
  goldenBoostsUsed: 0,
  scoringConfig: defaultScoringConfig,
  nowAvailablePlayoffRound: null,
  ...overrides,
})

describe('computePriorityAttention — now-available-playoff tier', () => {
  it('returns now-available-playoff when nowAvailablePlayoffRound is set and mode is not urgent', () => {
    const result = computePriorityAttention(
      makeData({
        nowAvailablePlayoffRound: {
          roundId: 'round-r16',
          roundName: 'Round of 16',
          firstGameId: 'game-r16-001',
        },
      })
    )
    expect(result?.type).toBe('now-available-playoff')
    expect(result?.availableRoundName).toBe('Round of 16')
    expect(result?.availableRoundFirstGameId).toBe('game-r16-001')
  })

  it('does NOT return now-available-playoff when mode is urgent (urgent-games takes priority)', () => {
    const result = computePriorityAttention(
      makeData({
        mode: 'urgent',
        games: [{ id: 'g1', game_date: new Date(Date.now() + 60 * 60 * 1000) } as any],
        nowAvailablePlayoffRound: {
          roundId: 'round-r16',
          roundName: 'Round of 16',
          firstGameId: 'game-r16-001',
        },
      })
    )
    expect(result?.type).toBe('urgent-games')
  })

  it('still returns deadline when nowAvailablePlayoffRound is null and deadline applies', () => {
    const result = computePriorityAttention(
      makeData({
        nowAvailablePlayoffRound: null,
        qtAndAwardsOpen: true,
        msUntilPredictionLock: 10 * 60 * 60 * 1000, // 10h < 48h
        qualifiersCompleted: 5,
        qualifiersTotal: 32,
        awardsCompleted: 7,
        awardsTotal: 7,
      })
    )
    expect(result?.type).toBe('deadline')
  })

  it('returns null when nowAvailablePlayoffRound is set but tournamentFinished=true', () => {
    const result = computePriorityAttention(
      makeData({
        tournamentFinished: true,
        nowAvailablePlayoffRound: {
          roundId: 'round-r16',
          roundName: 'Round of 16',
          firstGameId: 'game-r16-001',
        },
      })
    )
    expect(result).toBeNull()
  })
})
