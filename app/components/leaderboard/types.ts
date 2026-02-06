// Type definitions for leaderboard components

export interface LeaderboardUser {
  id: string
  name: string
  totalPoints: number

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
}

export interface LeaderboardViewProps {
  readonly scores: unknown[] // Will be typed as UserScore from DB when integrated
  readonly currentUserId: string
  readonly tournament: unknown // Will be typed as Tournament when integrated
}

export interface LeaderboardCardsProps {
  readonly scores: unknown[]
  readonly currentUserId: string
  readonly previousScores?: unknown[]
}

export interface LeaderboardCardProps {
  readonly user: LeaderboardUser
  readonly rank: number
  readonly isCurrentUser: boolean
  readonly isExpanded: boolean
  readonly onToggle: () => void
}

export interface RankChangeIndicatorProps {
  readonly change: number
  readonly size?: 'small' | 'medium'
}
