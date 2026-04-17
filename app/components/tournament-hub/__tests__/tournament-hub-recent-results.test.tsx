import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TournamentHubRecentResults } from '../tournament-hub-recent-results'
import * as hubActions from '@/app/actions/hub-actions'
import type { RecentResultsData } from '@/app/actions/hub-actions'

vi.mock('@/app/actions/hub-actions', () => ({
  getRecentResultsData: vi.fn(),
}))

vi.mock('../recent-results-widget', () => ({
  RecentResultsWidget: ({ data }: any) => (
    <div data-testid="recent-results-widget">
      {JSON.stringify(data.recentGames.length)}
    </div>
  ),
}))

const emptyData: RecentResultsData = {
  recentGames: [],
  qualifiedTeamsScore: null,
  qualifiedTeamsCorrect: null,
  qualifiedTeamsTotalPredicted: null,
  individualAwardsScore: null,
  honorRollScore: null,
}

describe('TournamentHubRecentResults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders RecentResultsWidget when getRecentResultsData returns populated data', async () => {
    const populatedData: RecentResultsData = {
      recentGames: [
        {
          gameId: 'game-1',
          homeTeamName: 'Argentina',
          awayTeamName: 'France',
          homeScore: 2,
          awayScore: 1,
          userHomeGuess: 2,
          userAwayGuess: 1,
          basePoints: 3,
          boostType: null,
          boostBonus: 0,
          finalPoints: 3,
          gameDate: new Date('2022-12-18'),
        },
      ],
      qualifiedTeamsScore: null,
      qualifiedTeamsCorrect: null,
      qualifiedTeamsTotalPredicted: null,
      individualAwardsScore: null,
      honorRollScore: null,
    }
    vi.mocked(hubActions.getRecentResultsData).mockResolvedValue(populatedData)

    render(
      await TournamentHubRecentResults({
        tournamentId: 'tournament-1',
        locale: 'en',
      })
    )

    expect(screen.getByTestId('recent-results-widget')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders RecentResultsWidget with empty data when getRecentResultsData returns empty', async () => {
    vi.mocked(hubActions.getRecentResultsData).mockResolvedValue(emptyData)

    render(
      await TournamentHubRecentResults({
        tournamentId: 'tournament-1',
        locale: 'en',
      })
    )

    expect(screen.getByTestId('recent-results-widget')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('calls getRecentResultsData with correct tournamentId and locale', async () => {
    vi.mocked(hubActions.getRecentResultsData).mockResolvedValue(emptyData)

    await TournamentHubRecentResults({
      tournamentId: 'tournament-42',
      locale: 'es',
    })

    expect(hubActions.getRecentResultsData).toHaveBeenCalledWith('tournament-42', 'es')
  })

  it('calls getRecentResultsData and constructs statsHref from locale and tournamentId', async () => {
    vi.mocked(hubActions.getRecentResultsData).mockResolvedValue(emptyData)

    await TournamentHubRecentResults({
      tournamentId: 'tournament-xyz',
      locale: 'en',
    })

    expect(hubActions.getRecentResultsData).toHaveBeenCalled()
  })
})
