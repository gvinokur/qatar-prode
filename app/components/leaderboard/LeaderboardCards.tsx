'use client'

import { Box, Typography } from '@mui/material'
import { useState, useMemo } from 'react'
import type { LeaderboardCardsProps, LeaderboardUser } from './types'
import LeaderboardCard from './LeaderboardCard'

// Helper function to transform UserScore to LeaderboardUser
function transformToLeaderboardUser(score: any): LeaderboardUser {
  return {
    id: score.userId,
    name: score.userName || 'Unknown User',
    totalPoints: score.totalPoints || 0,
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

  // Transform and sort scores
  const leaderboardUsers = useMemo(() => {
    return scores
      .map(score => transformToLeaderboardUser(score))
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints
        }
        // Tie-breaking: sort by user ID alphabetically (deterministic)
        return a.id.localeCompare(b.id)
      })
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
