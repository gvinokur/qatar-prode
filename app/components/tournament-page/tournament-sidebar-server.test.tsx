import { screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import TournamentSidebarServer from './tournament-sidebar-server'

// Mock all data fetching dependencies
vi.mock('../../actions/prode-group-actions', () => ({
  getGroupsForUser: vi.fn(),
}))

vi.mock('../../actions/tournament-actions', () => ({
  getGroupStandingsForTournament: vi.fn(),
}))

vi.mock('../../actions/group-ranking-actions', () => ({
  getGroupRankingForUser: vi.fn(),
}))

vi.mock('../../db/game-guess-repository', () => ({
  getGameGuessStatisticsForUsers: vi.fn(),
}))

vi.mock('../../utils/tournament-utils', () => ({
  extractScoringConfig: vi.fn(),
}))

// Mock TournamentSidebar to capture props
vi.mock('./tournament-sidebar', () => ({
  default: vi.fn(({ user, prodeGroups, userGameStatistics, groupStandings, scoringConfig }) => (
    <div
      data-testid="tournament-sidebar"
      data-has-user={!!user}
      data-has-prode-groups={!!prodeGroups}
      data-has-stats={!!userGameStatistics}
      data-has-standings={!!groupStandings}
      data-has-scoring={!!scoringConfig}
    />
  )),
}))

import { getGroupsForUser } from '../../actions/prode-group-actions'
import { getGroupStandingsForTournament } from '../../actions/tournament-actions'
import { getGroupRankingForUser } from '../../actions/group-ranking-actions'
import { getGameGuessStatisticsForUsers } from '../../db/game-guess-repository'
import { extractScoringConfig } from '../../utils/tournament-utils'

const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' } as any
const mockTournament = { id: 'tournament-1', game_exact_score_points: 3 }

const mockGroupStandings = {
  groups: [{ id: 'g1', letter: 'A', teamStats: [], teamsMap: {} }],
  defaultGroupId: 'g1',
  qualifiedTeams: [],
}

const mockProdeGroups = {
  userGroups: [{ id: 'pg1', name: 'My Group' }],
  participantGroups: [],
  pendingRequests: [],
  favoriteGroupIds: [],
}

const mockGameStats = {
  user_id: 'user-1',
  group_score: 10,
  playoff_score: 5,
  qualified_teams_score: 3,
  honor_roll_score: 2,
}

describe('TournamentSidebarServer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getGroupStandingsForTournament).mockResolvedValue(mockGroupStandings as any)
    vi.mocked(getGroupsForUser).mockResolvedValue(mockProdeGroups as any)
    vi.mocked(getGameGuessStatisticsForUsers).mockResolvedValue([mockGameStats] as any)
    vi.mocked(getGroupRankingForUser).mockResolvedValue({ currentRank: 1 } as any)
    vi.mocked(extractScoringConfig).mockReturnValue({ champion_points: 5 } as any)
  })

  it('renders TournamentSidebar with user data for an authenticated user', async () => {
    const component = await TournamentSidebarServer({
      tournamentId: 'tournament-1',
      user: mockUser,
      tournament: mockTournament,
    })
    renderWithTheme(component)

    const sidebar = screen.getByTestId('tournament-sidebar')
    expect(sidebar).toHaveAttribute('data-has-user', 'true')
    expect(sidebar).toHaveAttribute('data-has-prode-groups', 'true')
    expect(sidebar).toHaveAttribute('data-has-stats', 'true')
    expect(sidebar).toHaveAttribute('data-has-standings', 'true')
  })

  it('renders TournamentSidebar without user-specific data for an unauthenticated visitor', async () => {
    const component = await TournamentSidebarServer({
      tournamentId: 'tournament-1',
      user: undefined,
      tournament: mockTournament,
    })
    renderWithTheme(component)

    const sidebar = screen.getByTestId('tournament-sidebar')
    expect(sidebar).toHaveAttribute('data-has-user', 'false')
    expect(sidebar).toHaveAttribute('data-has-prode-groups', 'false')
    expect(sidebar).toHaveAttribute('data-has-stats', 'false')
    expect(sidebar).toHaveAttribute('data-has-standings', 'true')
  })

  it('skips user-specific fetches entirely when user is undefined', async () => {
    await TournamentSidebarServer({
      tournamentId: 'tournament-1',
      user: undefined,
      tournament: mockTournament,
    })

    expect(getGroupsForUser).not.toHaveBeenCalled()
    expect(getGameGuessStatisticsForUsers).not.toHaveBeenCalled()
    expect(getGroupRankingForUser).not.toHaveBeenCalled()
  })

  it('fetches group ranks in parallel for all groups (userGroups + participantGroups)', async () => {
    const prodeGroupsWithTwo = {
      ...mockProdeGroups,
      userGroups: [{ id: 'pg1', name: 'Group 1' }],
      participantGroups: [{ id: 'pg2', name: 'Group 2' }],
    }
    vi.mocked(getGroupsForUser).mockResolvedValue(prodeGroupsWithTwo as any)

    await TournamentSidebarServer({
      tournamentId: 'tournament-1',
      user: mockUser,
      tournament: mockTournament,
    })

    expect(getGroupRankingForUser).toHaveBeenCalledTimes(2)
    expect(getGroupRankingForUser).toHaveBeenCalledWith('user-1', 'pg1', 'tournament-1')
    expect(getGroupRankingForUser).toHaveBeenCalledWith('user-1', 'pg2', 'tournament-1')
  })

  it('handles getGroupsForUser returning undefined gracefully', async () => {
    vi.mocked(getGroupsForUser).mockResolvedValue(undefined as any)

    const component = await TournamentSidebarServer({
      tournamentId: 'tournament-1',
      user: mockUser,
      tournament: mockTournament,
    })
    renderWithTheme(component)

    const sidebar = screen.getByTestId('tournament-sidebar')
    expect(sidebar).toHaveAttribute('data-has-prode-groups', 'false')
    expect(getGroupRankingForUser).not.toHaveBeenCalled()
  })

  it('renders gracefully if tournament is null (scoringConfig is undefined)', async () => {
    vi.mocked(extractScoringConfig).mockReturnValue(undefined)

    const component = await TournamentSidebarServer({
      tournamentId: 'tournament-1',
      user: undefined,
      tournament: null,
    })
    renderWithTheme(component)

    const sidebar = screen.getByTestId('tournament-sidebar')
    expect(sidebar).toHaveAttribute('data-has-scoring', 'false')
  })

  it('renders gracefully if getGroupStandingsForTournament returns empty groups', async () => {
    vi.mocked(getGroupStandingsForTournament).mockResolvedValue({
      groups: [],
      defaultGroupId: '',
      qualifiedTeams: [],
    } as any)

    const component = await TournamentSidebarServer({
      tournamentId: 'tournament-1',
      user: undefined,
      tournament: mockTournament,
    })
    renderWithTheme(component)

    expect(screen.getByTestId('tournament-sidebar')).toBeInTheDocument()
  })
})
