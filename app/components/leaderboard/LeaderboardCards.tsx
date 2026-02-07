'use client'

import { Box, Typography } from '@mui/material'
import { useState, useMemo, useEffect } from 'react'
import { LayoutGroup } from 'framer-motion'
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
  const [sortBy, setSortBy] = useState<'yesterday' | 'today'>('yesterday')

  // Check if we have yesterday data to enable animation
  const hasYesterdayData = scores.some((s: any) => s.yesterdayTotalPoints !== undefined && s.yesterdayTotalPoints !== null)

  // After initial render, animate to today's scores
  useEffect(() => {
    if (hasYesterdayData) {
      const timer = setTimeout(() => setSortBy('today'), 800)
      return () => clearTimeout(timer)
    } else {
      // If no yesterday data, immediately show today's scores
      setSortBy('today')
    }
  }, [hasYesterdayData])

  // Transform, sort, and calculate ranks with changes
  const leaderboardUsers = useMemo(() => {
    const transformed = scores.map(score => transformToLeaderboardUser(score))
    console.warn('🔍 Transformed users:', transformed.map(u => ({ id: u.id, name: u.name, totalPoints: u.totalPoints, yesterdayTotalPoints: u.yesterdayTotalPoints, sortBy })))

    // Sort based on current sortBy state
    const scoreField = sortBy === 'yesterday' ? 'yesterdayTotalPoints' : 'totalPoints'
    const sorted = transformed.sort((a, b) => {
      const scoreA = a[scoreField] ?? 0
      const scoreB = b[scoreField] ?? 0

      if (scoreB !== scoreA) {
        return scoreB - scoreA
      }
      // Tie-breaking: sort by user ID alphabetically (deterministic)
      return a.id.localeCompare(b.id)
    })
    console.warn('🔍 Sorted users:', sorted.map(u => ({ id: u.id, name: u.name, score: u[scoreField], sortBy })))

    // Calculate ranks based on current sort field
    const usersWithCurrentRank = calculateRanks(sorted, scoreField)
    console.warn('🔍 Users with current rank:', usersWithCurrentRank.map(u => ({ id: u.id, name: u.name, currentRank: (u as any).currentRank, sortBy })))

    // Calculate rank changes only when showing today's scores
    if (sortBy === 'today' && hasYesterdayData) {
      const withChanges = calculateRanksWithChange(usersWithCurrentRank, 'yesterdayTotalPoints')
      console.warn('🔍 Users with rank changes:', withChanges.map(u => ({ id: u.id, name: u.name, totalPoints: u.totalPoints, yesterdayTotalPoints: u.yesterdayTotalPoints, currentRank: (u as any).currentRank, rankChange: (u as any).rankChange })))
      return withChanges
    }

    // When showing yesterday's scores or no yesterday data, no rank change indicators
    return usersWithCurrentRank.map(u => ({ ...u, rankChange: 0 }))
  }, [scores, sortBy, hasYesterdayData])

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
    <LayoutGroup>
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
    </LayoutGroup>
  )
}
