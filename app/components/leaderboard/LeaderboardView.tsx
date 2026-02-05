'use client'

import type { LeaderboardViewProps } from './types'
import LeaderboardCards from './LeaderboardCards'

export default function LeaderboardView({
  scores,
  currentUserId,
  tournament
}: LeaderboardViewProps) {
  // For now, we don't have previous scores, so rank changes will be 0
  // In the future, this could be passed as a prop
  const previousScores = undefined

  // Always render cards for all screen sizes
  return (
    <LeaderboardCards
      scores={scores}
      currentUserId={currentUserId}
      previousScores={previousScores}
    />
  )
}
