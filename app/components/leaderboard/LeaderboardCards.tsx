'use client'

import { Box, Typography } from '@mui/material'
import { useState, useMemo } from 'react'
import type { LeaderboardCardsProps, LeaderboardUser } from './types'
import LeaderboardCard from './LeaderboardCard'

// Helper function to calculate rank changes
function calculateRankChanges(
  currentScores: any[],
  previousScores?: any[]
): Map<string, number> {
  const rankChanges = new Map<string, number>()

  // Sort current scores by total points (descending) with tie-breaking
  const currentRanked = [...currentScores].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints
    }
    // Tie-breaking: sort by user ID alphabetically (deterministic)
    return a.userId.localeCompare(b.userId)
  })

  // If no previous data, all rank changes are 0
  if (!previousScores || previousScores.length === 0) {
    currentRanked.forEach(user => rankChanges.set(user.userId, 0))
    return rankChanges
  }

  // Sort previous scores by total points (descending) with tie-breaking
  const previousRanked = [...previousScores].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints
    }
    return a.userId.localeCompare(b.userId)
  })

  // Build previous rank map
  const previousRankMap = new Map<string, number>()
  previousRanked.forEach((user, index) => {
    previousRankMap.set(user.userId, index + 1)
  })

  // Calculate rank change for each user
  currentRanked.forEach((user, currentIndex) => {
    const currentRank = currentIndex + 1
    const previousRank = previousRankMap.get(user.userId)

    if (previousRank === undefined) {
      // New user - no rank change
      rankChanges.set(user.userId, 0)
    } else {
      // Rank change = previous - current (positive = improved)
      rankChanges.set(user.userId, previousRank - currentRank)
    }
  })

  return rankChanges
}

// Helper function to transform UserScore to LeaderboardUser
function transformToLeaderboardUser(
  score: any,
  rankChange: number
): LeaderboardUser {
  return {
    id: score.userId,
    name: score.userName || 'Unknown User',
    totalPoints: score.totalPoints || 0,
    groupPoints: score.groupStagePoints ?? 0,
    knockoutPoints: score.knockoutPoints ?? 0,
    boostsUsed: score.boostsUsed || 0,
    totalBoosts: 5, // Tournament default
    correctPredictions: score.correctPredictions || 0,
    playedGames: score.playedGames || 0,
    accuracy:
      score.playedGames > 0
        ? Math.round((score.correctPredictions / score.playedGames) * 100)
        : 0,
    rankChange
  }
}

export default function LeaderboardCards({
  scores,
  currentUserId,
  previousScores
}: LeaderboardCardsProps) {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)

  // Calculate rank changes
  const rankChangesMap = useMemo(
    () => calculateRankChanges(scores, previousScores),
    [scores, previousScores]
  )

  // Transform and sort scores
  const leaderboardUsers = useMemo(() => {
    return scores
      .map(score =>
        transformToLeaderboardUser(score, rankChangesMap.get((score as any).userId) || 0)
      )
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints
        }
        // Tie-breaking: sort by user ID alphabetically (deterministic)
        return a.id.localeCompare(b.id)
      })
  }, [scores, rankChangesMap])

  // Handle card toggle (mutual exclusion - only one card expanded at a time)
  const handleCardToggle = (userId: string) => {
    setExpandedCardId(prev => (prev === userId ? null : userId))
  }

  // Empty state
  if (leaderboardUsers.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
          px: 2
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No leaderboard data
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Check back after predictions close
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      role="list"
      aria-label="Leaderboard"
      sx={{
        maxWidth: '868px',
        mx: { md: 'auto' },
        px: { xs: 2, sm: 3 }
      }}
    >
      {leaderboardUsers.map((user, index) => {
        const rank = index + 1
        const isCurrentUser = user.id === currentUserId
        const isExpanded = expandedCardId === user.id

        return (
          <LeaderboardCard
            key={user.id}
            user={user}
            rank={rank}
            isCurrentUser={isCurrentUser}
            isExpanded={isExpanded}
            onToggle={() => handleCardToggle(user.id)}
          />
        )
      })}
    </Box>
  )
}
