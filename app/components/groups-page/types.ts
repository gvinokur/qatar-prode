// Type definitions for team standings components

import { Team, TeamStats } from '@/app/db/tables-definition'

/**
 * Team standing with position, stats, and qualification status
 */
export interface TeamStanding {
  id: string              // team_id
  position: number        // calculated rank (1-based)
  team: Team              // Team object from teamsMap
  points: number
  goalDifference: number  // goal_difference
  isQualified: boolean    // from qualifiedTeams array

  // Detail stats (for expanded view)
  gamesPlayed: number     // games_played
  wins: number            // win
  draws: number           // draw
  losses: number          // loss
  goalsFor: number        // goals_for
  goalsAgainst: number    // goals_against
  conductScore: number    // conduct_score

  // Future rank change support
  previousPosition?: number
}

/**
 * Props for TeamStandingsCards container component
 */
export interface TeamStandingsCardsProps {
  teamStats: TeamStats[]
  teamsMap: { [key: string]: Team }
  qualifiedTeams: Team[]  // Array of qualified Team objects
  // Future rank change support
  previousTeamStats?: TeamStats[]
}

/**
 * Props for individual TeamStandingCard component
 */
export interface TeamStandingCardProps {
  standing: TeamStanding
  isExpanded: boolean
  onToggleExpand: () => void
  rankChange?: number     // Positive = improved, negative = declined, 0 = no change
  showRankChange: boolean // True only if previousTeamStats was provided
}
