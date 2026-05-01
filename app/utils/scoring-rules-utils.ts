import type { ScoringConfig } from './scoring-config'

export interface ScoringRulesBySection {
  matches: string[]
  qualifiedTeams: string[]
  awards: string[]
  matchesBoostDeadline?: string
}

export interface ConstraintsBySection {
  matches: string
  qualifiedTeams: string
  awards: string
}

/**
 * Organises scoring rule labels into the three prediction tracks (Matches, Qualified Teams, Awards).
 * Uses the same i18n keys and pluralisation logic as rules.tsx's getRules().
 *
 * @param config  Tournament scoring configuration
 * @param tRules  Translator bound to the `rules.rules` namespace
 */
export function getRulesBySection(
  config: ScoringConfig,
  tRules: (_key: string, _params?: Record<string, unknown>) => string
): ScoringRulesBySection {
  const pluralKey = (count: number) => (count === 1 ? 'singular' : 'plural')
  const exactScoreBonus = config.game_exact_score_points - config.game_correct_outcome_points
  const goalDiffBonus = config.game_correct_goal_difference_points - config.game_correct_outcome_points

  // --- matches ---
  const matches: string[] = [
    tRules(`winnerDraw.${pluralKey(config.game_correct_outcome_points)}`, {
      points: config.game_correct_outcome_points,
    }),
    ...(config.game_correct_goal_difference_points > 0
      ? [tRules(`goalDifference.${pluralKey(goalDiffBonus)}`, {
          bonus: goalDiffBonus,
          total: config.game_correct_goal_difference_points,
        })]
      : []),
    tRules(`exactScore.${pluralKey(exactScoreBonus)}`, {
      bonus: exactScoreBonus,
      total: config.game_exact_score_points,
    }),
  ]

  let matchesBoostDeadline: string | undefined
  if (config.max_silver_games > 0 || config.max_golden_games > 0) {
    if (config.max_silver_games > 0) {
      matches.push(
        tRules(`silverBoost.${pluralKey(config.max_silver_games)}`, {
          count: config.max_silver_games,
        })
      )
    }
    if (config.max_golden_games > 0) {
      matches.push(
        tRules(`goldenBoost.${pluralKey(config.max_golden_games)}`, {
          count: config.max_golden_games,
        })
      )
    }
    matchesBoostDeadline = tRules('boostTiming')
  }

  // --- qualifiedTeams ---
  const qualifiedTeams: string[] = [
    tRules(`qualifiedTeam.${pluralKey(config.qualified_team_points)}`, {
      points: config.qualified_team_points,
    }),
    tRules(`exactPosition.${pluralKey(config.exact_position_qualified_points)}`, {
      points: config.exact_position_qualified_points,
      total: config.qualified_team_points + config.exact_position_qualified_points,
    }),
  ]

  // --- awards ---
  const awards: string[] = [
    tRules(`champion.${pluralKey(config.champion_points)}`, {
      points: config.champion_points,
    }),
    tRules(`runnerUp.${pluralKey(config.runner_up_points)}`, {
      points: config.runner_up_points,
    }),
    tRules(`thirdPlace.${pluralKey(config.third_place_points)}`, {
      points: config.third_place_points,
    }),
    tRules(`individualAwards.${pluralKey(config.individual_award_points)}`, {
      points: config.individual_award_points,
    }),
  ]

  return { matches, qualifiedTeams, awards, matchesBoostDeadline }
}

/**
 * Returns per-section prediction deadline constraint strings sourced from the
 * `rules.constraints` namespace. When `lockDate` is provided (a pre-formatted
 * date string) it is interpolated into the QT/Awards constraint text; otherwise
 * the fallback phrase "5 days after the tournament starts" is used.
 *
 * @param tConstraints  Translator bound to the `rules.constraints` namespace
 * @param lockDate      Pre-formatted close date for QT/Awards (e.g. "June 16, 2026"), or null
 */
export function getConstraintsBySection(
  tConstraints: (_key: string, _params?: Record<string, unknown>) => string,
  lockDate: string | null
): ConstraintsBySection {
  const date = lockDate ?? tConstraints('lockDateFallback')
  return {
    matches: tConstraints('matchPredictionTime'),
    qualifiedTeams: tConstraints('qualifiedTeamsPredictionTime', { date }),
    awards: tConstraints('podiumPredictionTime', { date }),
  }
}
