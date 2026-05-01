import { describe, it, expect } from 'vitest'
import { getRulesBySection } from '../scoring-rules-utils'
import type { ScoringConfig } from '../scoring-config'

/** A mock translator that returns the key with stringified params appended */
const mockTranslator = (key: string, params?: Record<string, unknown>): string => {
  if (params && Object.keys(params).length > 0) {
    return `${key}(${JSON.stringify(params)})`
  }
  return key
}

const baseConfig: ScoringConfig = {
  game_exact_score_points: 2,
  game_correct_outcome_points: 1,
  game_correct_goal_difference_points: 2,
  champion_points: 5,
  runner_up_points: 3,
  third_place_points: 1,
  individual_award_points: 3,
  qualified_team_points: 1,
  exact_position_qualified_points: 2,
  max_silver_games: 0,
  max_golden_games: 0,
}

describe('getRulesBySection', () => {
  describe('matches section', () => {
    it('contains winnerDraw rule with correct points', () => {
      const result = getRulesBySection(baseConfig, mockTranslator)
      expect(result.matches[0]).toContain('winnerDraw')
      expect(result.matches[0]).toContain('"points":1')
    })

    it('contains goalDifference rule with bonus and total', () => {
      const result = getRulesBySection(baseConfig, mockTranslator)
      expect(result.matches[1]).toContain('goalDifference')
      expect(result.matches[1]).toContain('"bonus":1')
      expect(result.matches[1]).toContain('"total":2')
    })

    it('contains exactScore rule with bonus and total', () => {
      const result = getRulesBySection(baseConfig, mockTranslator)
      expect(result.matches[2]).toContain('exactScore')
      expect(result.matches[2]).toContain('"bonus":1')
      expect(result.matches[2]).toContain('"total":2')
    })

    it('excludes goalDifference when game_correct_goal_difference_points is 0', () => {
      const config = { ...baseConfig, game_correct_goal_difference_points: 0 }
      const result = getRulesBySection(config, mockTranslator)
      expect(result.matches.some((r) => r.includes('goalDifference'))).toBe(false)
    })

    it('excludes boost rules when max_silver_games and max_golden_games are 0', () => {
      const result = getRulesBySection(baseConfig, mockTranslator)
      expect(result.matches).toHaveLength(3)
      expect(result.matches.some((r) => r.includes('silverBoost'))).toBe(false)
      expect(result.matches.some((r) => r.includes('goldenBoost'))).toBe(false)
      expect(result.matches.some((r) => r.includes('boostTiming'))).toBe(false)
    })

    it('includes silverBoost rule when max_silver_games > 0', () => {
      const config = { ...baseConfig, max_silver_games: 3 }
      const result = getRulesBySection(config, mockTranslator)
      expect(result.matches.some((r) => r.includes('silverBoost'))).toBe(true)
    })

    it('includes goldenBoost rule when max_golden_games > 0', () => {
      const config = { ...baseConfig, max_golden_games: 2 }
      const result = getRulesBySection(config, mockTranslator)
      expect(result.matches.some((r) => r.includes('goldenBoost'))).toBe(true)
    })

    it('does NOT include boostTiming in matches array when boosts enabled', () => {
      const config = { ...baseConfig, max_silver_games: 1 }
      const result = getRulesBySection(config, mockTranslator)
      expect(result.matches.some((r) => r.includes('boostTiming'))).toBe(false)
    })

    it('sets matchesBoostDeadline when either boost is enabled', () => {
      const config = { ...baseConfig, max_silver_games: 1 }
      const result = getRulesBySection(config, mockTranslator)
      expect(result.matchesBoostDeadline).toBe('boostTiming')
    })

    it('matchesBoostDeadline is undefined when boosts are disabled', () => {
      const result = getRulesBySection(baseConfig, mockTranslator)
      expect(result.matchesBoostDeadline).toBeUndefined()
    })

    it('uses plural form when points count > 1', () => {
      const config = { ...baseConfig, game_correct_outcome_points: 2 }
      const result = getRulesBySection(config, mockTranslator)
      expect(result.matches[0]).toContain('winnerDraw.plural')
    })

    it('uses singular form when points count === 1', () => {
      const result = getRulesBySection(baseConfig, mockTranslator)
      expect(result.matches[0]).toContain('winnerDraw.singular')
    })
  })

  describe('qualifiedTeams section', () => {
    it('contains qualifiedTeam rule with correct points', () => {
      const result = getRulesBySection(baseConfig, mockTranslator)
      expect(result.qualifiedTeams[0]).toContain('qualifiedTeam')
      expect(result.qualifiedTeams[0]).toContain('"points":1')
    })

    it('contains exactPosition rule with correct points and total', () => {
      const result = getRulesBySection(baseConfig, mockTranslator)
      expect(result.qualifiedTeams[1]).toContain('exactPosition')
      expect(result.qualifiedTeams[1]).toContain('"points":2')
      expect(result.qualifiedTeams[1]).toContain('"total":3')
    })

    it('always has exactly 2 items', () => {
      const result = getRulesBySection(baseConfig, mockTranslator)
      expect(result.qualifiedTeams).toHaveLength(2)
    })
  })

  describe('awards section', () => {
    it('contains champion, runnerUp, thirdPlace, and individualAwards rules', () => {
      const result = getRulesBySection(baseConfig, mockTranslator)
      expect(result.awards[0]).toContain('champion')
      expect(result.awards[1]).toContain('runnerUp')
      expect(result.awards[2]).toContain('thirdPlace')
      expect(result.awards[3]).toContain('individualAwards')
    })

    it('always has exactly 4 items', () => {
      const result = getRulesBySection(baseConfig, mockTranslator)
      expect(result.awards).toHaveLength(4)
    })

    it('passes correct points from config to each award rule', () => {
      const config = { ...baseConfig, champion_points: 10, runner_up_points: 6 }
      const result = getRulesBySection(config, mockTranslator)
      expect(result.awards[0]).toContain('"points":10')
      expect(result.awards[1]).toContain('"points":6')
    })
  })
})
