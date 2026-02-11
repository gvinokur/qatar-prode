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
  readonly teamStats: TeamStats[]
  readonly teamsMap: { [key: string]: Team }
  readonly qualifiedTeams: ReadonlyArray<{ readonly id: string }>  // Array with at least id property
  // Future rank change support
  readonly previousTeamStats?: TeamStats[]
  // Compact mode for sidebar display (smaller fonts, less detail)
  readonly compact?: boolean
}

/**
 * Props for individual TeamStandingCard component
 */
export interface TeamStandingCardProps {
  readonly standing: TeamStanding
  readonly isExpanded: boolean
  readonly onToggleExpand: () => void
  readonly rankChange?: number     // Positive = improved, negative = declined, 0 = no change
  readonly showRankChange: boolean // True only if previousTeamStats was provided
  readonly compact?: boolean       // Compact mode for sidebar display
}
