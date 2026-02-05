'use client'

import { useMediaQuery, useTheme } from '@mui/material'
import type { LeaderboardViewProps, LeaderboardUser } from './types'
import LeaderboardCards from './LeaderboardCards'
import LeaderboardTable from './LeaderboardTable'
import { useMemo } from 'react'

// Helper function to transform scores to LeaderboardUser format
function transformScores(scores: any[], rankChangesMap: Map<string, number>): LeaderboardUser[] {
  return scores.map(score => ({
    id: score.userId,
    name: score.userName || 'Unknown User',
    totalPoints: score.totalPoints || 0,
    groupPoints: score.groupStagePoints ?? 0,
    knockoutPoints: score.knockoutPoints ?? 0,
    boostsUsed: score.boostsUsed || 0,
    totalBoosts: 5,
    correctPredictions: score.correctPredictions || 0,
    playedGames: score.playedGames || 0,
    accuracy:
      score.playedGames > 0
        ? Math.round((score.correctPredictions / score.playedGames) * 100)
        : 0,
    rankChange: rankChangesMap.get(score.userId) || 0
  }))
}

// Helper function to calculate rank changes
function calculateRankChanges(
  currentScores: any[],
  previousScores?: any[]
): Map<string, number> {
  const rankChanges = new Map<string, number>()

  const currentRanked = [...currentScores].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints
    }
    return a.userId.localeCompare(b.userId)
  })

  if (!previousScores || previousScores.length === 0) {
    currentRanked.forEach(user => rankChanges.set(user.userId, 0))
    return rankChanges
  }

  const previousRanked = [...previousScores].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints
    }
    return a.userId.localeCompare(b.userId)
  })

  const previousRankMap = new Map<string, number>()
  previousRanked.forEach((user, index) => {
    previousRankMap.set(user.userId, index + 1)
  })

  currentRanked.forEach((user, currentIndex) => {
    const currentRank = currentIndex + 1
    const previousRank = previousRankMap.get(user.userId)

    if (previousRank === undefined) {
      rankChanges.set(user.userId, 0)
    } else {
      rankChanges.set(user.userId, previousRank - currentRank)
    }
  })

  return rankChanges
}

export default function LeaderboardView({
  scores,
  currentUserId,
  tournament
}: LeaderboardViewProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // For now, we don't have previous scores, so rank changes will be 0
  // In the future, this could be passed as a prop
  const previousScores = undefined

  // Calculate rank changes
  const rankChangesMap = useMemo(
    () => calculateRankChanges(scores, previousScores),
    [scores, previousScores]
  )

  // Transform scores for table view
  const transformedScores = useMemo(
    () => transformScores(scores, rankChangesMap),
    [scores, rankChangesMap]
  )

  if (isMobile) {
    // Mobile: Show cards
    return (
      <LeaderboardCards
        scores={scores}
        currentUserId={currentUserId}
        previousScores={previousScores}
      />
    )
  }

  // Desktop: Show table
  return (
    <LeaderboardTable
      scores={transformedScores}
      currentUserId={currentUserId}
    />
  )
}
