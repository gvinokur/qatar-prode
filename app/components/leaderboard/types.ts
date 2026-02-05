// Type definitions for leaderboard components

export interface LeaderboardUser {
  id: string
  name: string
  totalPoints: number
  groupPoints: number
  knockoutPoints: number
  boostsUsed: number
  totalBoosts: number
  correctPredictions: number
  playedGames: number // Only games already played/decided, NOT future predictions
  accuracy: number // correctPredictions / playedGames (%)
  rankChange: number // positive = up, negative = down, 0 = no change
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
