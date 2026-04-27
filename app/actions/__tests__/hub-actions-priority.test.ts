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
    it('returns urgent-games when mode is urgent', () => {
      const urgentGame = { id: 'game-1' } as ActionCenterData['games'][0]
      const data = makeData({
        mode: 'urgent',
        games: [urgentGame],
        tournamentHasStarted: true,
        predictedGames: 10,
        totalGames: 64,
      })
      const result = computePriorityAttention(data)
      expect(result?.type).toBe('urgent-games')
    })

    it('includes urgentCount = games.length when mode is urgent', () => {
      const data = makeData({
        mode: 'urgent',
        games: [{ id: 'g1' }, { id: 'g2' }, { id: 'g3' }] as ActionCenterData['games'],
        tournamentHasStarted: true,
      })
      expect(computePriorityAttention(data)?.urgentCount).toBe(3)
    })

    it('includes firstUrgentGameId = games[0].id when mode is urgent', () => {
      const data = makeData({
        mode: 'urgent',
        games: [{ id: 'first-urgent' }, { id: 'second-urgent' }] as ActionCenterData['games'],
        tournamentHasStarted: true,
      })
      expect(computePriorityAttention(data)?.firstUrgentGameId).toBe('first-urgent')
    })
  })

  describe('Tier 1 — deadlines', () => {
    it('returns qt-deadline before awards-deadline when both incomplete and msUntilPredictionLock < 48h', () => {
      const data = makeData({
        tournamentHasStarted: true,
        qtAndAwardsOpen: true,
        msUntilPredictionLock: HOURS_48_MS - 1,
        qualifiersCompleted: 10,
        qualifiersTotal: 32,
        awardsCompleted: 3,
        awardsTotal: 7,
      })
      expect(computePriorityAttention(data)?.type).toBe('qt-deadline')
    })

    it('returns awards-deadline when QT complete but awards incomplete and deadline < 48h', () => {
      const data = makeData({
        tournamentHasStarted: true,
        qtAndAwardsOpen: true,
        msUntilPredictionLock: HOURS_48_MS - 1,
        qualifiersCompleted: 32,
        qualifiersTotal: 32,
        awardsCompleted: 3,
        awardsTotal: 7,
      })
      expect(computePriorityAttention(data)?.type).toBe('awards-deadline')
    })

    it('does NOT return qt-deadline when msUntilPredictionLock >= 48h', () => {
      const data = makeData({
        tournamentHasStarted: true,
        qtAndAwardsOpen: true,
        msUntilPredictionLock: HOURS_48_MS + 1000,
        qualifiersCompleted: 0,
        qualifiersTotal: 32,
      })
      expect(computePriorityAttention(data)?.type).not.toBe('qt-deadline')
    })

    it('does NOT return deadline types when tournamentHasStarted is false', () => {
      const data = makeData({
        tournamentHasStarted: false,
        qtAndAwardsOpen: true,
        msUntilPredictionLock: HOURS_48_MS - 1,
        qualifiersCompleted: 0,
        qualifiersTotal: 32,
      })
      const result = computePriorityAttention(data)
      expect(result?.type).not.toBe('qt-deadline')
      expect(result?.type).not.toBe('awards-deadline')
    })
  })

  describe('Tier 2 — stage transitions', () => {
    it('returns transition-to-qt when predictedGames === totalGames and qualifiersCompleted === 0', () => {
      const data = makeData({
        predictedGames: 64,
        totalGames: 64,
        qualifiersCompleted: 0,
        qualifiersTotal: 32,
        mode: 'fallback',
      })
      expect(computePriorityAttention(data)?.type).toBe('transition-to-qt')
    })

    it('does NOT return transition-to-qt when qualifiersTotal is 0', () => {
      const data = makeData({
        predictedGames: 64,
        totalGames: 64,
        qualifiersCompleted: 0,
        qualifiersTotal: 0,
      })
      expect(computePriorityAttention(data)?.type).not.toBe('transition-to-qt')
    })

    it('returns transition-to-awards when qualifiersCompleted === qualifiersTotal and awardsCompleted === 0', () => {
      const data = makeData({
        qualifiersCompleted: 32,
        qualifiersTotal: 32,
        awardsCompleted: 0,
        awardsTotal: 7,
      })
      expect(computePriorityAttention(data)?.type).toBe('transition-to-awards')
    })

    it('does NOT return transition-to-awards when qualifiersTotal is 0', () => {
      const data = makeData({
        qualifiersCompleted: 0,
        qualifiersTotal: 0,
        awardsCompleted: 0,
        awardsTotal: 7,
      })
      expect(computePriorityAttention(data)?.type).not.toBe('transition-to-awards')
    })

    it('returns fallback-games when pre-tournament (mode=empty, !started) and predictedGames < totalGames', () => {
      const data = makeData({
        mode: 'empty',
        tournamentHasStarted: false,
        predictedGames: 10,
        totalGames: 64,
      })
      expect(computePriorityAttention(data)?.type).toBe('fallback-games')
    })

    it('does NOT return fallback-games when pre-tournament mode=empty and all games predicted', () => {
      const data = makeData({
        mode: 'empty',
        tournamentHasStarted: false,
        predictedGames: 64,
        totalGames: 64,
      })
      expect(computePriorityAttention(data)?.type).not.toBe('fallback-games')
    })

    it('returns fallback-games when mode is fallback and predictedGames < totalGames', () => {
      const data = makeData({
        mode: 'fallback',
        predictedGames: 30,
        totalGames: 64,
        qualifiersCompleted: 5,
        qualifiersTotal: 32,
        qtAndAwardsOpen: false,
      })
      expect(computePriorityAttention(data)?.type).toBe('fallback-games')
    })

    it('does NOT return fallback-games when all games are predicted', () => {
      const data = makeData({
        mode: 'fallback',
        predictedGames: 64,
        totalGames: 64,
        qualifiersCompleted: 0,
        qualifiersTotal: 0,
        qtAndAwardsOpen: false,
        awardsCompleted: 7,
        awardsTotal: 7,
      })
      expect(computePriorityAttention(data)?.type).not.toBe('fallback-games')
    })
  })

  describe('Tier 2 — nudges', () => {
    it('returns qt-nudge when QT incomplete and qtAndAwardsOpen and no deadline urgency', () => {
      const data = makeData({
        qtAndAwardsOpen: true,
        msUntilPredictionLock: HOURS_48_MS + 1000,
        qualifiersCompleted: 10,
        qualifiersTotal: 32,
        mode: 'empty',
        predictedGames: 64,
        totalGames: 64,
      })
      expect(computePriorityAttention(data)?.type).toBe('qt-nudge')
    })

    it('returns awards-nudge when QT complete, awards incomplete, qtAndAwardsOpen, no deadline urgency', () => {
      const data = makeData({
        qtAndAwardsOpen: true,
        msUntilPredictionLock: HOURS_48_MS + 1000,
        qualifiersCompleted: 32,
        qualifiersTotal: 32,
        awardsCompleted: 3,
        awardsTotal: 7,
        mode: 'empty',
        predictedGames: 64,
        totalGames: 64,
      })
      expect(computePriorityAttention(data)?.type).toBe('awards-nudge')
    })
  })

  describe('completedCount and totalCount', () => {
    it('qt-deadline returns correct completedCount/totalCount', () => {
      const data = makeData({
        tournamentHasStarted: true,
        qtAndAwardsOpen: true,
        msUntilPredictionLock: HOURS_48_MS - 1,
        qualifiersCompleted: 16,
        qualifiersTotal: 32,
      })
      const result = computePriorityAttention(data)
      expect(result?.completedCount).toBe(16)
      expect(result?.totalCount).toBe(32)
    })

    it('fallback-games returns games completedCount/totalCount', () => {
      const data = makeData({
        mode: 'fallback',
        predictedGames: 20,
        totalGames: 64,
        qualifiersTotal: 0,
        qtAndAwardsOpen: false,
      })
      const result = computePriorityAttention(data)
      expect(result?.type).toBe('fallback-games')
      expect(result?.completedCount).toBe(20)
      expect(result?.totalCount).toBe(64)
    })
  })
})
