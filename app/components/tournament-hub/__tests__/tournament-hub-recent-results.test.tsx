import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TournamentHubRecentResults } from '../tournament-hub-recent-results'
import * as hubActions from '@/app/actions/hub-actions'
import type { RecentResultsData } from '@/app/actions/hub-actions'

vi.mock('@/app/actions/hub-actions', () => ({
  getRecentResultsData: vi.fn(),
}))

vi.mock('next-intl/server', () => ({
  getTranslations: () => Promise.resolve((key: string) => `hub.recentResults:${key}`),
}))

vi.mock('../dashboard-card', () => ({
  DashboardCard: ({ title, children }: any) => (
    <div data-testid="dashboard-card">
      <span data-testid="dashboard-card-title">{title}</span>
      {children}
    </div>
  ),
}))

vi.mock('../recent-results-widget', () => ({
  RecentResultsWidget: ({ data, statsHref }: any) => (
    <div data-testid="recent-results-widget">
      <span data-testid="game-count">{JSON.stringify(data.recentGames.length)}</span>
      <span data-testid="stats-href">{statsHref}</span>
    </div>
  ),
}))

const emptyData: RecentResultsData = { recentGames: [] }

describe('TournamentHubRecentResults', () => {
  beforeEach(() => { vi.clearAllMocks() })

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
          gameStatus: 'finished',
        },
      ],
    }
    vi.mocked(hubActions.getRecentResultsData).mockResolvedValue(populatedData)

    render(await TournamentHubRecentResults({ tournamentId: 'tournament-1', locale: 'en' }))

    expect(screen.getByTestId('recent-results-widget')).toBeInTheDocument()
    expect(screen.getByTestId('game-count')).toHaveTextContent('1')
  })

  it('renders RecentResultsWidget with empty data when getRecentResultsData returns empty', async () => {
    vi.mocked(hubActions.getRecentResultsData).mockResolvedValue(emptyData)

    render(await TournamentHubRecentResults({ tournamentId: 'tournament-1', locale: 'en' }))

    expect(screen.getByTestId('recent-results-widget')).toBeInTheDocument()
    expect(screen.getByTestId('game-count')).toHaveTextContent('0')
  })

  it('calls getRecentResultsData with correct tournamentId and locale', async () => {
    vi.mocked(hubActions.getRecentResultsData).mockResolvedValue(emptyData)

    await TournamentHubRecentResults({ tournamentId: 'tournament-42', locale: 'es' })

    expect(hubActions.getRecentResultsData).toHaveBeenCalledWith('tournament-42', 'es')
  })

  it('renders DashboardCard with the hub.recentResults.title translation', async () => {
    vi.mocked(hubActions.getRecentResultsData).mockResolvedValue(emptyData)

    render(await TournamentHubRecentResults({ tournamentId: 'tournament-1', locale: 'en' }))

    expect(screen.getByTestId('dashboard-card')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-card-title')).toHaveTextContent('hub.recentResults:title')
  })

  it('passes statsHref derived from locale and tournamentId', async () => {
    vi.mocked(hubActions.getRecentResultsData).mockResolvedValue(emptyData)

    render(await TournamentHubRecentResults({ tournamentId: 'tournament-xyz', locale: 'es' }))

    expect(screen.getByTestId('stats-href')).toHaveTextContent('/es/tournaments/tournament-xyz/stats')
  })

  it('re-throws when getRecentResultsData rejects', async () => {
    const error = new Error('DB failure')
    vi.mocked(hubActions.getRecentResultsData).mockRejectedValue(error)

    await expect(
      TournamentHubRecentResults({ tournamentId: 'tournament-1', locale: 'en' })
    ).rejects.toThrow('DB failure')
  })
})
