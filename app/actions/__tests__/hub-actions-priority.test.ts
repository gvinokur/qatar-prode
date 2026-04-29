import { describe, it, expect } from 'vitest'
import { computePriorityAttention } from '../../utils/priority-attention'
import type { ActionCenterData } from '../hub-actions'

const HOURS_48_MS = 48 * 60 * 60 * 1000

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
  qtAndAwardsOpen: true,
  msUntilPredictionLock: 5 * 24 * 60 * 60 * 1000,
  tournamentFinished: false,
  firstGameDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  tournamentHasStarted: false,
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
  ...overrides,
})

describe('computePriorityAttention', () => {
  describe('returns null', () => {
    it('returns null when tournamentFinished', () => {
      expect(computePriorityAttention(makeData({ tournamentFinished: true }))).toBeNull()
    })

    it('returns null when all predictions complete and tournament not started', () => {
      const data = makeData({
        groupStageGamesCompleted: 48,
        groupStageGamesTotal: 48,
        predictedGames: 64,
        totalGames: 64,
        qualifiersCompleted: 32,
        qualifiersTotal: 32,
        awardsCompleted: 7,
        awardsTotal: 7,
        mode: 'empty',
      })
      expect(computePriorityAttention(data)).toBeNull()
    })

    it('returns null when all predictions complete and tournament active', () => {
      const data = makeData({
        tournamentHasStarted: true,
        mode: 'empty',
        predictedGames: 64,
        totalGames: 64,
        qtAndAwardsOpen: false,
        qualifiersCompleted: 32,
        qualifiersTotal: 32,
        awardsCompleted: 7,
        awardsTotal: 7,
      })
      expect(computePriorityAttention(data)).toBeNull()
    })

    it('returns null gracefully when ActionCenterData fields are at zero/default (empty tournament)', () => {
      const data = makeData({
        totalGames: 0,
        predictedGames: 0,
        groupStageGamesTotal: 0,
        groupStageGamesCompleted: 0,
        qualifiersTotal: 0,
        qualifiersCompleted: 0,
        awardsTotal: 0,
        awardsCompleted: 0,
        mode: 'empty',
        qtAndAwardsOpen: false,
      })
      expect(computePriorityAttention(data)).toBeNull()
    })
  })

  describe('Tier 1 — urgent-games', () => {
    const gameWithin24h = (id: string) =>
      ({ id, game_date: new Date(Date.now() + 2 * 60 * 60 * 1000) }) as ActionCenterData['games'][0]
    const gameOutside24h = (id: string) =>
      ({ id, game_date: new Date(Date.now() + 30 * 60 * 60 * 1000) }) as ActionCenterData['games'][0]

    it('returns urgent-games when mode is urgent and a game is within 24h', () => {
      const data = makeData({
        mode: 'urgent',
        games: [gameWithin24h('game-1')],
        tournamentHasStarted: true,
        predictedGames: 10,
        totalGames: 64,
      })
      const result = computePriorityAttention(data)
      expect(result?.type).toBe('urgent-games')
    })

    it('includes urgentCount = within-24h game count', () => {
      const data = makeData({
        mode: 'urgent',
        games: [gameWithin24h('g1'), gameWithin24h('g2'), gameWithin24h('g3')],
        tournamentHasStarted: true,
      })
      expect(computePriorityAttention(data)?.urgentCount).toBe(3)
    })

    it('includes firstUrgentGameId = id of first within-24h game', () => {
      const data = makeData({
        mode: 'urgent',
        games: [gameWithin24h('first-urgent'), gameWithin24h('second-urgent')],
        tournamentHasStarted: true,
      })
      expect(computePriorityAttention(data)?.firstUrgentGameId).toBe('first-urgent')
    })

    it('does NOT return urgent-games when mode is urgent but all games are outside 24h', () => {
      const data = makeData({
        mode: 'urgent',
        games: [gameOutside24h('far-game')],
        tournamentHasStarted: true,
      })
      expect(computePriorityAttention(data)?.type).not.toBe('urgent-games')
    })

    it('urgentCount reflects only within-24h games, not all games in data.games', () => {
      const data = makeData({
        mode: 'urgent',
        games: [gameWithin24h('near'), gameOutside24h('far-1'), gameOutside24h('far-2')],
        tournamentHasStarted: true,
      })
      expect(computePriorityAttention(data)?.urgentCount).toBe(1)
    })

    it('falls through to deadline state when mode is urgent but no games within 24h', () => {
      const data = makeData({
        mode: 'urgent',
        games: [gameOutside24h('far-game')],
        tournamentHasStarted: true,
        qtAndAwardsOpen: true,
        msUntilPredictionLock: HOURS_48_MS - 1,
        qualifiersCompleted: 10,
        qualifiersTotal: 32,
        awardsCompleted: 3,
        awardsTotal: 7,
      })
      expect(computePriorityAttention(data)?.type).toBe('deadline')
    })

    it('returns null when mode is urgent, no games within 24h, and no other condition matches', () => {
      const data = makeData({
        mode: 'urgent',
        games: [gameOutside24h('far-game')],
        tournamentHasStarted: true,
        qtAndAwardsOpen: false,
      })
      expect(computePriorityAttention(data)).toBeNull()
    })
  })

  describe('Tier 1 — deadline', () => {
    it('returns deadline when both QT and awards incomplete and msUntilPredictionLock < 48h', () => {
      const data = makeData({
        tournamentHasStarted: true,
        qtAndAwardsOpen: true,
        msUntilPredictionLock: HOURS_48_MS - 1,
        qualifiersCompleted: 10,
        qualifiersTotal: 32,
        awardsCompleted: 3,
        awardsTotal: 7,
      })
      expect(computePriorityAttention(data)?.type).toBe('deadline')
    })

    it('sets qtIncomplete=true and awardsIncomplete=true when both are pending', () => {
      const data = makeData({
        tournamentHasStarted: true,
        qtAndAwardsOpen: true,
        msUntilPredictionLock: HOURS_48_MS - 1,
        qualifiersCompleted: 10,
        qualifiersTotal: 32,
        awardsCompleted: 3,
        awardsTotal: 7,
      })
      const result = computePriorityAttention(data)
      expect(result?.qtIncomplete).toBe(true)
      expect(result?.awardsIncomplete).toBe(true)
    })

    it('returns deadline with qtIncomplete=false when only awards incomplete', () => {
      const data = makeData({
        tournamentHasStarted: true,
        qtAndAwardsOpen: true,
        msUntilPredictionLock: HOURS_48_MS - 1,
        qualifiersCompleted: 32,
        qualifiersTotal: 32,
        awardsCompleted: 3,
        awardsTotal: 7,
      })
      const result = computePriorityAttention(data)
      expect(result?.type).toBe('deadline')
      expect(result?.qtIncomplete).toBe(false)
      expect(result?.awardsIncomplete).toBe(true)
    })

    it('does NOT return deadline when msUntilPredictionLock >= 48h', () => {
      const data = makeData({
        tournamentHasStarted: true,
        qtAndAwardsOpen: true,
        msUntilPredictionLock: HOURS_48_MS + 1000,
        qualifiersCompleted: 0,
        qualifiersTotal: 32,
      })
      expect(computePriorityAttention(data)?.type).not.toBe('deadline')
    })

    it('does NOT return deadline when tournamentHasStarted is false', () => {
      const data = makeData({
        tournamentHasStarted: false,
        qtAndAwardsOpen: true,
        msUntilPredictionLock: HOURS_48_MS - 1,
        qualifiersCompleted: 0,
        qualifiersTotal: 32,
      })
      expect(computePriorityAttention(data)?.type).not.toBe('deadline')
    })

    it('does NOT return deadline when both QT and awards are complete', () => {
      const data = makeData({
        tournamentHasStarted: true,
        qtAndAwardsOpen: true,
        msUntilPredictionLock: HOURS_48_MS - 1,
        qualifiersCompleted: 32,
        qualifiersTotal: 32,
        awardsCompleted: 7,
        awardsTotal: 7,
      })
      expect(computePriorityAttention(data)?.type).not.toBe('deadline')
    })

    it('deadline returns correct qtCompleted/qtTotal/awardsCompleted/awardsTotal', () => {
      const data = makeData({
        tournamentHasStarted: true,
        qtAndAwardsOpen: true,
        msUntilPredictionLock: HOURS_48_MS - 1,
        qualifiersCompleted: 16,
        qualifiersTotal: 32,
        awardsCompleted: 2,
        awardsTotal: 7,
      })
      const result = computePriorityAttention(data)
      expect(result?.qtCompleted).toBe(16)
      expect(result?.qtTotal).toBe(32)
      expect(result?.awardsCompleted).toBe(2)
      expect(result?.awardsTotal).toBe(7)
    })
  })

  describe('Tier 2 — new-actions-qt', () => {
    it('returns new-actions-qt when group stage complete and qualifiers not started (pre-tournament)', () => {
      const data = makeData({
        tournamentHasStarted: false,
        groupStageGamesCompleted: 48,
        groupStageGamesTotal: 48,
        qualifiersCompleted: 0,
        qualifiersTotal: 32,
        mode: 'fallback',
      })
      expect(computePriorityAttention(data)?.type).toBe('new-actions-qt')
    })

    it('does NOT return new-actions-qt when tournamentHasStarted is true', () => {
      const data = makeData({
        tournamentHasStarted: true,
        groupStageGamesCompleted: 48,
        groupStageGamesTotal: 48,
        qualifiersCompleted: 0,
        qualifiersTotal: 32,
      })
      expect(computePriorityAttention(data)?.type).not.toBe('new-actions-qt')
    })

    it('does NOT return new-actions-qt when groupStageGamesTotal is 0', () => {
      const data = makeData({
        tournamentHasStarted: false,
        groupStageGamesCompleted: 0,
        groupStageGamesTotal: 0,
        qualifiersCompleted: 0,
        qualifiersTotal: 32,
      })
      expect(computePriorityAttention(data)?.type).not.toBe('new-actions-qt')
    })

    it('does NOT return new-actions-qt when group stage is not fully predicted', () => {
      const data = makeData({
        tournamentHasStarted: false,
        groupStageGamesCompleted: 40,
        groupStageGamesTotal: 48,
        qualifiersCompleted: 0,
        qualifiersTotal: 32,
      })
      expect(computePriorityAttention(data)?.type).not.toBe('new-actions-qt')
    })

    it('does NOT return new-actions-qt when qualifiersTotal is 0', () => {
      const data = makeData({
        tournamentHasStarted: false,
        groupStageGamesCompleted: 48,
        groupStageGamesTotal: 48,
        qualifiersCompleted: 0,
        qualifiersTotal: 0,
      })
      expect(computePriorityAttention(data)?.type).not.toBe('new-actions-qt')
    })
  })

  describe('Tier 2 — new-actions-awards', () => {
    it('returns new-actions-awards when qualifiers complete and awards not started (pre-tournament)', () => {
      const data = makeData({
        tournamentHasStarted: false,
        qualifiersCompleted: 32,
        qualifiersTotal: 32,
        awardsCompleted: 0,
        awardsTotal: 7,
      })
      expect(computePriorityAttention(data)?.type).toBe('new-actions-awards')
    })

    it('does NOT return new-actions-awards when tournamentHasStarted is true', () => {
      const data = makeData({
        tournamentHasStarted: true,
        qualifiersCompleted: 32,
        qualifiersTotal: 32,
        awardsCompleted: 0,
        awardsTotal: 7,
      })
      expect(computePriorityAttention(data)?.type).not.toBe('new-actions-awards')
    })

    it('does NOT return new-actions-awards when qualifiersTotal is 0', () => {
      const data = makeData({
        tournamentHasStarted: false,
        qualifiersCompleted: 0,
        qualifiersTotal: 0,
        awardsCompleted: 0,
        awardsTotal: 7,
      })
      expect(computePriorityAttention(data)?.type).not.toBe('new-actions-awards')
    })
  })
})
