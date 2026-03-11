/**
 * Badge calculation engine for the leaderboard badge system.
 * Pure TypeScript — no framework dependencies.
 *
 * Badges are computed group-wide (all users together) so relative badges
 * (Rocket, FreeFall, Sharp, BrokenSight, WoodenSpoon) can compare across users.
 *
 * CONTRACT: calculateBadges() always returns positive badges first, negative last
 * per user. BadgeRow relies on this order for maxDisplay truncation.
 */

export type BadgeId =
  | 'crack'
  | 'rocket'
  | 'sharp'
  | 'crystal-ball'
  | 'oracle'
  | 'award-scout'
  | 'golden-ticket'
  | 'boost-king'
  | 'free-fall'
  | 'dead-last'
  | 'broken-sight'
  | 'wooden-spoon'

export interface Badge {
  id: BadgeId
  emoji: string
  type: 'positive' | 'negative'
}

/**
 * Badge configuration derived from tournament settings.
 * Pass this from the server (page) down to LeaderboardCards.
 *
 * Default points (5, 3, 1) match updateTournamentHonorRoll in backoffice-actions.ts.
 */
export interface TournamentBadgeConfig {
  /** false = skip all badges (tournament hasn't started yet) */
  tournamentStarted: boolean
  /** 0 = no Crystal Ball / Oracle badges */
  championPoints: number
  runnerUpPoints: number
  /** 0 = Oracle requires only champion + runner-up score */
  thirdPlacePoints: number
  /** 0 = no Award Scout badge */
  individualAwardPoints: number
  /** 0 = no Golden Ticket / Wooden Spoon badges */
  totalQualifyingSlots: number
}

export interface UserBadgeInput {
  userId: string
  rank: number
  /** Positive = moved up, negative = moved down, 0 = no change */
  rankChange: number
  totalExactGuesses: number
  totalCorrectGuesses: number
  qualifiedTeamsCorrect: number
  honorRollScore: number
  individualAwardsScore: number
  boostsUsed: number
  scoredBoosts: number
}

type BadgeApplyFn = (users: UserBadgeInput[], config: TournamentBadgeConfig) => string[]

interface BadgeDefinition {
  emoji: string
  type: 'positive' | 'negative'
  apply: BadgeApplyFn
}

/** exactRate = exact guesses / max(correct guesses, 1) */
function exactRate(user: UserBadgeInput): number {
  return user.totalExactGuesses / Math.max(user.totalCorrectGuesses, 1)
}

/**
 * Tie-break for Rocket / FreeFall: first alphabetically by userId.
 * Deterministic and documented here so tests can rely on it.
 */
function firstAlpha(userIds: string[]): string {
  return [...userIds].sort((a, b) => a.localeCompare(b))[0]
}

const BADGE_DEFINITIONS: Record<BadgeId, BadgeDefinition> = {
  crack: {
    emoji: '🥇',
    type: 'positive',
    apply: (users) => users.filter((u) => u.rank === 1).map((u) => u.userId),
  },

  rocket: {
    emoji: '📈',
    type: 'positive',
    apply: (users) => {
      const max = Math.max(...users.map((u) => u.rankChange))
      if (max <= 0) return []
      const candidates = users.filter((u) => u.rankChange === max).map((u) => u.userId)
      return [firstAlpha(candidates)]
    },
  },

  sharp: {
    emoji: '🎯',
    type: 'positive',
    apply: (users) => {
      if (users.length < 3) return []
      // Skip if all users have the same exactRate (no meaningful differentiation)
      const rates = users.map(exactRate)
      if (new Set(rates).size === 1) return []
      const threshold = Math.max(1, Math.floor(users.length * 0.1))
      const sorted = [...users].sort((a, b) => exactRate(b) - exactRate(a))
      return sorted.slice(0, threshold).map((u) => u.userId)
    },
  },

  'crystal-ball': {
    emoji: '👑',
    type: 'positive',
    apply: (users, config) => {
      if (config.championPoints <= 0) return []
      return users
        .filter((u) => u.honorRollScore >= config.championPoints)
        .map((u) => u.userId)
    },
  },

  oracle: {
    emoji: '🔮',
    type: 'positive',
    apply: (users, config) => {
      if (config.championPoints <= 0) return []
      const threshold =
        config.championPoints + config.runnerUpPoints + config.thirdPlacePoints
      return users.filter((u) => u.honorRollScore >= threshold).map((u) => u.userId)
    },
  },

  'award-scout': {
    emoji: '🔍',
    type: 'positive',
    apply: (users, config) => {
      if (config.individualAwardPoints <= 0) return []
      const threshold = config.individualAwardPoints * 3
      return users
        .filter((u) => u.individualAwardsScore >= threshold)
        .map((u) => u.userId)
    },
  },

  'golden-ticket': {
    emoji: '🎫',
    type: 'positive',
    apply: (users, config) => {
      if (config.totalQualifyingSlots <= 0) return []
      return users
        .filter((u) => u.qualifiedTeamsCorrect / config.totalQualifyingSlots > 0.7)
        .map((u) => u.userId)
    },
  },

  'boost-king': {
    emoji: '🏆',
    type: 'positive',
    apply: (users) => {
      const eligible = users.filter((u) => u.boostsUsed > 0)
      if (eligible.length === 0) return []
      const ratios = eligible.map((u) => u.scoredBoosts / u.boostsUsed)
      const max = Math.max(...ratios)
      const winners = eligible.filter((u) => u.scoredBoosts / u.boostsUsed === max)
      // No award when tied
      if (winners.length !== 1) return []
      return [winners[0].userId]
    },
  },

  'free-fall': {
    emoji: '📉',
    type: 'negative',
    apply: (users) => {
      const min = Math.min(...users.map((u) => u.rankChange))
      if (min >= 0) return []
      const candidates = users.filter((u) => u.rankChange === min).map((u) => u.userId)
      return [firstAlpha(candidates)]
    },
  },

  'dead-last': {
    emoji: '💩',
    type: 'negative',
    apply: (users) => {
      const max = Math.max(...users.map((u) => u.rank))
      return users.filter((u) => u.rank === max).map((u) => u.userId)
    },
  },

  'broken-sight': {
    emoji: '🙈',
    type: 'negative',
    apply: (users) => {
      if (users.length < 3) return []
      // Skip if all users have the same exactRate (no meaningful differentiation)
      const rates = users.map(exactRate)
      if (new Set(rates).size === 1) return []
      const threshold = Math.max(1, Math.floor(users.length * 0.1))
      const sorted = [...users].sort((a, b) => exactRate(a) - exactRate(b))
      return sorted.slice(0, threshold).map((u) => u.userId)
    },
  },

  'wooden-spoon': {
    emoji: '🥄',
    type: 'negative',
    apply: (users, config) => {
      if (config.totalQualifyingSlots <= 0) return []
      // Only award when at least one user has actually scored qualified teams correctly
      // (prevents awarding when qualified teams haven't been scored yet — all users at 0)
      const maxCorrect = Math.max(...users.map((u) => u.qualifiedTeamsCorrect))
      if (maxCorrect <= 0) return []
      const min = Math.min(...users.map((u) => u.qualifiedTeamsCorrect))
      return users.filter((u) => u.qualifiedTeamsCorrect === min).map((u) => u.userId)
    },
  },
}

/** Static badge lookup (emoji + type) — used for display without re-running apply(). */
export const BADGES: Record<BadgeId, Badge> = Object.fromEntries(
  (Object.entries(BADGE_DEFINITIONS) as [BadgeId, BadgeDefinition][]).map(
    ([id, def]) => [id, { id, emoji: def.emoji, type: def.type }]
  )
) as Record<BadgeId, Badge>

const POSITIVE_BADGE_IDS = (Object.keys(BADGE_DEFINITIONS) as BadgeId[]).filter(
  (id) => BADGE_DEFINITIONS[id].type === 'positive'
)
const NEGATIVE_BADGE_IDS = (Object.keys(BADGE_DEFINITIONS) as BadgeId[]).filter(
  (id) => BADGE_DEFINITIONS[id].type === 'negative'
)
const ORDERED_BADGE_IDS = [...POSITIVE_BADGE_IDS, ...NEGATIVE_BADGE_IDS]

/**
 * Compute badges for all users in a group.
 *
 * @returns Map<userId, Badge[]> — positive badges first, negative last (guaranteed).
 */
export function calculateBadges(
  users: UserBadgeInput[],
  config: TournamentBadgeConfig
): Map<string, Badge[]> {
  const badgesByUser = new Map<string, Badge[]>()
  users.forEach((u) => badgesByUser.set(u.userId, []))

  if (config.tournamentStarted) {
    for (const id of ORDERED_BADGE_IDS) {
      const def = BADGE_DEFINITIONS[id]
      const badge: Badge = { id, emoji: def.emoji, type: def.type }
      const earners = def.apply(users, config)
      for (const userId of earners) {
        badgesByUser.get(userId)?.push(badge)
      }
    }
  }

  return badgesByUser
}
