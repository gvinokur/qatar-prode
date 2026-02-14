import { screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { usePathname } from 'next/navigation'
import TournamentSidebar from './tournament-sidebar'
import { renderWithTheme } from '@/__tests__/utils/test-utils'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn()
}))

// Mock child components
vi.mock('./rules', () => ({
  default: vi.fn(({ isActive, tournamentId }) => (
    <div data-testid="rules-card" data-active={isActive} data-tournament-id={tournamentId}>
      Rules Card
    </div>
  ))
}))

vi.mock('./user-tournament-statistics', () => ({
  UserTournamentStatistics: vi.fn(({ isActive, tournamentId }) => (
    <div data-testid="stats-card" data-active={isActive} data-tournament-id={tournamentId}>
      Stats Card
    </div>
  ))
}))

vi.mock('./group-standings-sidebar', () => ({
  default: vi.fn(({ isActive, tournamentId }) => (
    <div data-testid="standings-card" data-active={isActive} data-tournament-id={tournamentId}>
      Standings Card
    </div>
  ))
}))

vi.mock('./friend-groups-list', () => ({
  default: vi.fn(({ isActive, tournamentId }) => (
    <div data-testid="groups-card" data-active={isActive} data-tournament-id={tournamentId}>
      Groups Card
    </div>
  ))
}))

describe('TournamentSidebar', () => {
  const mockProps = {
    tournamentId: 'test-tournament-id',
    scoringConfig: {
      game_exact_score_points: 2,
      game_correct_outcome_points: 1,
      champion_points: 5,
      runner_up_points: 3,
      third_place_points: 1,
      individual_award_points: 3,
      qualified_team_points: 1,
      exact_position_qualified_points: 2,
      max_silver_games: 5,
      max_golden_games: 3,
    },
    userGameStatistics: {
      user_id: 'user-1',
      tournament_id: 'test-tournament-id',
      group_score: 10,
      playoff_score: 5,
      total_correct_guesses: 8,
      total_exact_guesses: 3,
    },
    tournamentGuess: {
      id: 'guess-1',
      user_id: 'user-1',
      tournament_id: 'test-tournament-id',
      qualified_teams_score: 5,
      honor_roll_score: 3,
    },
    groupStandings: {
      groups: [
        {
          id: 'group-a',
          letter: 'A',
          teamStats: [],
          teamsMap: {},
        },
      ],
      defaultGroupId: 'group-a',
      qualifiedTeams: [],
    },
    prodeGroups: {
      userGroups: [{ id: 'group-1', name: 'My Group' }],
      participantGroups: [],
    },
    user: {
      id: 'user-1',
      email: 'test@example.com',
      full_name: 'Test User',
    },
  }

  it('renders all sidebar cards when user is logged in', () => {
    vi.mocked(usePathname).mockReturnValue('/tournaments/test-tournament-id')

    renderWithTheme(<TournamentSidebar {...mockProps} />)

    expect(screen.getByTestId('rules-card')).toBeInTheDocument()
    expect(screen.getByTestId('stats-card')).toBeInTheDocument()
    expect(screen.getByTestId('standings-card')).toBeInTheDocument()
    expect(screen.getByTestId('groups-card')).toBeInTheDocument()
  })

  it('does not render UserTournamentStatistics when user is not provided', () => {
    vi.mocked(usePathname).mockReturnValue('/tournaments/test-tournament-id')

    const propsWithoutUser = { ...mockProps, user: undefined }
    renderWithTheme(<TournamentSidebar {...propsWithoutUser} />)

    expect(screen.getByTestId('rules-card')).toBeInTheDocument()
    expect(screen.queryByTestId('stats-card')).not.toBeInTheDocument()
  })

  it('does not render GroupStandingsSidebar when groups are empty', () => {
    vi.mocked(usePathname).mockReturnValue('/tournaments/test-tournament-id')

    const propsWithoutGroups = {
      ...mockProps,
      groupStandings: {
        groups: [],
        defaultGroupId: '',
        qualifiedTeams: [],
      },
    }
    renderWithTheme(<TournamentSidebar {...propsWithoutGroups} />)

    expect(screen.getByTestId('rules-card')).toBeInTheDocument()
    expect(screen.queryByTestId('standings-card')).not.toBeInTheDocument()
  })

  it('passes isActive=true to Rules card when on /rules route', () => {
    vi.mocked(usePathname).mockReturnValue('/tournaments/test-tournament-id/rules')

    renderWithTheme(<TournamentSidebar {...mockProps} />)

    const rulesCard = screen.getByTestId('rules-card')
    expect(rulesCard).toHaveAttribute('data-active', 'true')
  })

  it('passes isActive=true to Stats card when on /stats route', () => {
    vi.mocked(usePathname).mockReturnValue('/tournaments/test-tournament-id/stats')

    renderWithTheme(<TournamentSidebar {...mockProps} />)

    const statsCard = screen.getByTestId('stats-card')
    expect(statsCard).toHaveAttribute('data-active', 'true')
  })

  it('passes isActive=true to Standings card when on /results route', () => {
    vi.mocked(usePathname).mockReturnValue('/tournaments/test-tournament-id/results')

    renderWithTheme(<TournamentSidebar {...mockProps} />)

    const standingsCard = screen.getByTestId('standings-card')
    expect(standingsCard).toHaveAttribute('data-active', 'true')
  })

  it('passes isActive=true to Groups card when on /friend-groups route', () => {
    vi.mocked(usePathname).mockReturnValue('/tournaments/test-tournament-id/friend-groups')

    renderWithTheme(<TournamentSidebar {...mockProps} />)

    const groupsCard = screen.getByTestId('groups-card')
    expect(groupsCard).toHaveAttribute('data-active', 'true')
  })

  it('passes isActive=false to all cards when on home route', () => {
    vi.mocked(usePathname).mockReturnValue('/tournaments/test-tournament-id')

    renderWithTheme(<TournamentSidebar {...mockProps} />)

    expect(screen.getByTestId('rules-card')).toHaveAttribute('data-active', 'false')
    expect(screen.getByTestId('stats-card')).toHaveAttribute('data-active', 'false')
    expect(screen.getByTestId('standings-card')).toHaveAttribute('data-active', 'false')
    expect(screen.getByTestId('groups-card')).toHaveAttribute('data-active', 'false')
  })

  it('passes isActive=true to Groups card when on individual friend group route', () => {
    vi.mocked(usePathname).mockReturnValue('/tournaments/test-tournament-id/friend-groups/group-123')

    renderWithTheme(<TournamentSidebar {...mockProps} />)

    const groupsCard = screen.getByTestId('groups-card')
    expect(groupsCard).toHaveAttribute('data-active', 'true')
  })

  it('passes tournamentId to all child cards', () => {
    vi.mocked(usePathname).mockReturnValue('/tournaments/test-tournament-id')

    renderWithTheme(<TournamentSidebar {...mockProps} />)

    expect(screen.getByTestId('rules-card')).toHaveAttribute('data-tournament-id', 'test-tournament-id')
    expect(screen.getByTestId('stats-card')).toHaveAttribute('data-tournament-id', 'test-tournament-id')
    expect(screen.getByTestId('standings-card')).toHaveAttribute('data-tournament-id', 'test-tournament-id')
    expect(screen.getByTestId('groups-card')).toHaveAttribute('data-tournament-id', 'test-tournament-id')
  })
})
