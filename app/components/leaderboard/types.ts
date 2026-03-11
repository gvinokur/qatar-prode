// Type definitions for leaderboard components
export type { Badge, TournamentBadgeConfig } from '../../utils/badge-calculator'
import type { Badge, TournamentBadgeConfig } from '../../utils/badge-calculator'

export interface LeaderboardUser {
  id: string
  name: string
  totalPoints: number
  yesterdayTotalPoints?: number    // Previous day's total points (for rank change tracking)

  // Group Stage breakdown
  groupPoints: number              // Total group stage points (for sorting/display)
  groupStageScore: number          // Points from group stage games only
  groupStageQualifiersScore: number // Points from qualified teams
  groupPositionScore?: number      // Points from exact group positions (optional)
  groupBoostBonus: number          // Bonus from boosted group games

  // Knockout breakdown
  knockoutPoints: number           // Total knockout points (for sorting/display)
  playoffScore: number             // Points from playoff games
  playoffBoostBonus: number        // Bonus from boosted playoff games

  // Tournament awards
  honorRollScore: number           // Honor roll points
  individualAwardsScore: number    // Individual awards points

  // Badge data (computed by LeaderboardCards)
  badges?: Badge[]
}

export interface LeaderboardShareHandle {
  openLeaderboardShare: () => void
}

export interface LeaderboardViewProps {
  readonly scores: unknown[] // Will be typed as UserScore from DB when integrated
  readonly currentUserId: string
  readonly tournament: unknown // Will be typed as Tournament when integrated
  readonly tournamentId?: string
  readonly groupName?: string
  readonly joinUrl?: string
  readonly themeColor?: string
  readonly shareRef?: React.RefObject<LeaderboardShareHandle | null>
  readonly tournamentBadgeConfig?: TournamentBadgeConfig
}

export interface LeaderboardCardsProps {
  readonly scores: unknown[]
  readonly currentUserId: string
  readonly previousScores?: unknown[]
  readonly tournamentId?: string
  readonly groupName?: string
  readonly joinUrl?: string
  readonly themeColor?: string
  readonly shareRef?: React.RefObject<LeaderboardShareHandle | null>
  readonly tournamentBadgeConfig?: TournamentBadgeConfig
}

export interface LeaderboardCardProps {
  readonly user: LeaderboardUser
  readonly rank: number
  readonly rankChange?: number     // Positive = moved up, negative = moved down, 0 = no change
  readonly isCurrentUser: boolean
  readonly isExpanded: boolean
  readonly onToggle: () => void
  readonly onCompare?: () => void  // Opens H2H dialog (non-self cards only)
  readonly onShareHighlight?: () => void  // Share rank improvement (current user with positive rankChange)
  readonly badges?: Badge[]
}

export interface RankChangeIndicatorProps {
  readonly change: number
  readonly size?: 'small' | 'medium'
}
