'use client'

import { useState, useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { LayoutGroup } from 'framer-motion'
import { calculateRanks } from '@/app/utils/rank-calculator'
import TeamStandingCard from './team-standing-card'
import type { TeamStandingsCardsProps, TeamStanding } from './types'

export default function TeamStandingsCards({
  teamStats,
  teamsMap,
  qualifiedTeams,
  previousTeamStats
}: TeamStandingsCardsProps) {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)

  // Transform team stats to standings with ranks
  const standings = useMemo(() => {
    if (teamStats.length === 0) return []

    // Pre-sort by points DESC, then goal_difference DESC (for tiebreaking)
    const sorted = [...teamStats].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      return b.goal_difference - a.goal_difference
    })

    // Add ranks using competition ranking (handles ties: 1-2-2-4)
    const ranked = calculateRanks(sorted, 'points')

    // Calculate previous ranks if previous stats provided
    let previousRanks: Map<string, number> | null = null
    if (previousTeamStats && previousTeamStats.length > 0) {
      const prevSorted = [...previousTeamStats].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        return b.goal_difference - a.goal_difference
      })
      const prevRanked = calculateRanks(prevSorted, 'points')
      previousRanks = new Map(
        prevRanked.map(stats => [stats.team_id, stats.currentRank])
      )
    }

    // Transform to TeamStanding format
    const teamStandings: TeamStanding[] = ranked.map(stats => {
      const team = teamsMap[stats.team_id]
      const isQualified = qualifiedTeams.some(t => t.id === stats.team_id)
      const previousPosition = previousRanks?.get(stats.team_id)

      return {
        id: stats.team_id,
        position: stats.currentRank,
        team,
        points: stats.points,
        goalDifference: stats.goal_difference,
        isQualified,
        gamesPlayed: stats.games_played,
        wins: stats.win,
        draws: stats.draw,
        losses: stats.loss,
        goalsFor: stats.goals_for,
        goalsAgainst: stats.goals_against,
        previousPosition
      }
    })

    return teamStandings
  }, [teamStats, teamsMap, qualifiedTeams, previousTeamStats])

  // Handle empty state
  if (standings.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No team standings available yet.
        </Typography>
      </Box>
    )
  }

  // Calculate rank changes if previous stats provided
  const showRankChange = Boolean(previousTeamStats && previousTeamStats.length > 0)

  return (
    <LayoutGroup>
      <Box
        sx={{
          width: '100%',
          maxWidth: '1000px',
          mx: 'auto'
        }}
      >
        {standings.map((standing) => {
          const isExpanded = expandedCardId === standing.id

          // Calculate rank change
          const rankChange = standing.previousPosition !== undefined
            ? standing.previousPosition - standing.position
            : 0

          return (
            <TeamStandingCard
              key={standing.id}
              standing={standing}
              isExpanded={isExpanded}
              onToggleExpand={() => {
                // Mutual exclusion: only one card expanded at a time
                setExpandedCardId(isExpanded ? null : standing.id)
              }}
              rankChange={rankChange}
              showRankChange={showRankChange}
            />
          )
        })}
      </Box>
    </LayoutGroup>
  )
}
