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
  scores: unknown[] // Will be typed as UserScore from DB when integrated
  currentUserId: string
  tournament: unknown // Will be typed as Tournament when integrated
}

export interface LeaderboardCardsProps {
  scores: unknown[]
  currentUserId: string
  previousScores?: unknown[]
}

export interface LeaderboardCardProps {
  user: LeaderboardUser
  rank: number
  isCurrentUser: boolean
  isExpanded: boolean
  onToggle: () => void
}

export interface RankChangeIndicatorProps {
  change: number
  size?: 'small' | 'medium'
}
