'use client'

import { Box, Typography } from '@mui/material'
import { useState, useMemo } from 'react'
import type { LeaderboardCardsProps, LeaderboardUser } from './types'
import LeaderboardCard from './LeaderboardCard'
import { calculateRanks, calculateRanksWithChange } from '../../utils/rank-calculator'

// Helper function to transform UserScore to LeaderboardUser
function transformToLeaderboardUser(score: any): LeaderboardUser {
  return {
    id: score.userId,
    name: score.userName || 'Unknown User',
    totalPoints: score.totalPoints || 0,
    yesterdayTotalPoints: score.yesterdayTotalPoints,
    groupPoints: score.groupStagePoints ?? 0,
    knockoutPoints: score.knockoutPoints ?? 0,
    groupStageScore: score.groupStageScore || 0,
    groupStageQualifiersScore: score.groupStageQualifiersScore || 0,
    groupPositionScore: score.groupPositionScore,
    playoffScore: score.playoffScore || 0,
    groupBoostBonus: score.groupBoostBonus || 0,
    playoffBoostBonus: score.playoffBoostBonus || 0,
    honorRollScore: score.honorRollScore || 0,
    individualAwardsScore: score.individualAwardsScore || 0
  }
}

export default function LeaderboardCards({
  scores,
  currentUserId,
  previousScores
}: LeaderboardCardsProps) {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)

  // Transform, sort, and calculate ranks with changes
  const leaderboardUsers = useMemo(() => {
    const transformed = scores.map(score => transformToLeaderboardUser(score))
    console.warn('🔍 Transformed users:', transformed.map(u => ({ id: u.id, name: u.name, totalPoints: u.totalPoints, type: typeof u.totalPoints })))

    // Sort by total points
    const sorted = transformed.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints
      }
      // Tie-breaking: sort by user ID alphabetically (deterministic)
      return a.id.localeCompare(b.id)
    })
    console.warn('🔍 Sorted users:', sorted.map(u => ({ id: u.id, name: u.name, totalPoints: u.totalPoints })))

    // Calculate current ranks using competition ranking (1-2-2-4)
    const usersWithCurrentRank = calculateRanks(sorted, 'totalPoints')
    console.warn('🔍 Users with current rank:', usersWithCurrentRank.map(u => ({ id: u.id, name: u.name, totalPoints: u.totalPoints, currentRank: (u as any).currentRank })))

    // Calculate rank changes if yesterday data is available
    const hasYesterdayData = sorted.some(u => u.yesterdayTotalPoints !== undefined)
    if (hasYesterdayData) {
      const withChanges = calculateRanksWithChange(usersWithCurrentRank, 'yesterdayTotalPoints')
      console.warn('🔍 Users with rank changes:', withChanges.map(u => ({ id: u.id, name: u.name, totalPoints: u.totalPoints, yesterdayTotalPoints: u.yesterdayTotalPoints, currentRank: (u as any).currentRank, rankChange: (u as any).rankChange })))
      return withChanges
    }

    // No yesterday data, return with rankChange: 0
    return usersWithCurrentRank.map(u => ({ ...u, rankChange: 0 }))
  }, [scores])

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
        maxWidth: '1000px',
        mx: { md: 'auto' },
        px: { xs: 2, sm: 3, md: 4 }
      }}
    >
      {leaderboardUsers.map((user) => {
        const isCurrentUser = user.id === currentUserId
        const isExpanded = expandedCardId === user.id

        return (
          <LeaderboardCard
            key={user.id}
            user={user}
            rank={(user as any).currentRank}
            rankChange={(user as any).rankChange}
            isCurrentUser={isCurrentUser}
            isExpanded={isExpanded}
            onToggle={() => handleCardToggle(user.id)}
          />
        )
      })}
    </Box>
  )
}
