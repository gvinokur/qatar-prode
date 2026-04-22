import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardBanner } from '../dashboard-banner'
import type { ActionCenterData } from '@/app/actions/hub-actions'

vi.mock('@/app/actions/hub-actions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/app/actions/hub-actions')>()
  return {
    ...actual,
    computeIsIncompleteUser: vi.fn(),
  }
})

vi.mock('../tournament-start-banner', () => ({
  TournamentStartBanner: () => <div data-testid="tournament-start-banner" />,
}))

vi.mock('../pre-tournament-hero', () => ({
  PreTournamentCountdown: ({ firstGameDate }: { firstGameDate: Date }) => (
    <div data-testid="pre-tournament-countdown" data-date={firstGameDate.toISOString()} />
  ),
}))

vi.mock('../../tournament-page/public-cta-bar', () => ({
  LoggedOffBanner: () => <div data-testid="logged-off-banner" />,
}))

vi.mock('../tutorial-cta-card', () => ({
  TutorialCTACard: ({ fullWidth }: { fullWidth?: boolean }) => (
    <div data-testid="tutorial-cta-card" data-full-width={String(fullWidth ?? false)} />
  ),
}))

import * as hubActions from '@/app/actions/hub-actions'

const defaultScoringConfig = {
  game_exact_score_points: 2,
  game_correct_outcome_points: 1,
  champion_points: 5,
  runner_up_points: 3,
  third_place_points: 1,
  individual_award_points: 3,
  qualified_team_points: 1,
  exact_position_qualified_points: 2,
  max_silver_games: 0,
  max_golden_games: 0,
}

const buildData = (overrides: Partial<ActionCenterData> = {}): ActionCenterData => ({
  games: [],
  gameGuesses: {},
  teamsMap: {},
  tournamentMaxSilver: 0,
  tournamentMaxGolden: 0,
  mode: 'empty',
  qtAndAwardsOpen: true,
  msUntilPredictionLock: 10 * 24 * 60 * 60 * 1000,
  tournamentFinished: false,
  firstGameDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  tournamentHasStarted: false,
  tournamentName: null,
  openerBackfill: false,
  totalGames: 64,
  predictedGames: 0,
  awardsCompleted: 0,
  awardsTotal: 7,
  qualifiersCompleted: 0,
  qualifiersTotal: 32,
  tournamentJustStarted: false,
  scoringConfig: defaultScoringConfig,
  ...overrides,
})

const mockUser = { id: 'user-1', email: 'test@example.com' }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DashboardBanner', () => {
  it('renders only LoggedOffBanner when user is null and data is null', async () => {
    const result = await DashboardBanner({ user: null, data: null })
    render(result as React.ReactElement)

    expect(screen.getByTestId('logged-off-banner')).toBeInTheDocument()
    expect(screen.queryByTestId('pre-tournament-countdown')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tournament-start-banner')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tutorial-cta-card')).not.toBeInTheDocument()
  })

  it('renders PreTournamentCountdown + LoggedOffBanner when tournament has not started and user is null', async () => {
    const data = buildData({ tournamentHasStarted: false, firstGameDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) })
    const result = await DashboardBanner({ user: null, data })
    render(result as React.ReactElement)

    expect(screen.getByTestId('pre-tournament-countdown')).toBeInTheDocument()
    expect(screen.getByTestId('logged-off-banner')).toBeInTheDocument()
    expect(screen.queryByTestId('tournament-start-banner')).not.toBeInTheDocument()
  })

  it('renders PreTournamentCountdown + TutorialCTACard when tournament has not started and user is incomplete', async () => {
    vi.mocked(hubActions.computeIsIncompleteUser).mockResolvedValue(true)
    const data = buildData({ tournamentHasStarted: false })
    const result = await DashboardBanner({ user: mockUser, data })
    render(result as React.ReactElement)

    expect(screen.getByTestId('pre-tournament-countdown')).toBeInTheDocument()
    const card = screen.getByTestId('tutorial-cta-card')
    expect(card).toBeInTheDocument()
    expect(card).toHaveAttribute('data-full-width', 'true')
    expect(screen.queryByTestId('logged-off-banner')).not.toBeInTheDocument()
  })

  it('renders only PreTournamentCountdown when tournament has not started and user is complete', async () => {
    vi.mocked(hubActions.computeIsIncompleteUser).mockResolvedValue(false)
    const data = buildData({ tournamentHasStarted: false })
    const result = await DashboardBanner({ user: mockUser, data })
    render(result as React.ReactElement)

    expect(screen.getByTestId('pre-tournament-countdown')).toBeInTheDocument()
    expect(screen.queryByTestId('logged-off-banner')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tutorial-cta-card')).not.toBeInTheDocument()
  })

  it('renders TournamentStartBanner + LoggedOffBanner when tournament just started and user is null', async () => {
    const data = buildData({ tournamentJustStarted: true, tournamentHasStarted: true })
    const result = await DashboardBanner({ user: null, data })
    render(result as React.ReactElement)

    expect(screen.getByTestId('tournament-start-banner')).toBeInTheDocument()
    expect(screen.getByTestId('logged-off-banner')).toBeInTheDocument()
    expect(screen.queryByTestId('pre-tournament-countdown')).not.toBeInTheDocument()
  })

  it('renders only TournamentStartBanner when tournament just started and user is complete', async () => {
    vi.mocked(hubActions.computeIsIncompleteUser).mockResolvedValue(false)
    const data = buildData({ tournamentJustStarted: true, tournamentHasStarted: true })
    const result = await DashboardBanner({ user: mockUser, data })
    render(result as React.ReactElement)

    expect(screen.getByTestId('tournament-start-banner')).toBeInTheDocument()
    expect(screen.queryByTestId('logged-off-banner')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tutorial-cta-card')).not.toBeInTheDocument()
  })

  it('returns null when tournament is ongoing (past 48h) and user is complete', async () => {
    vi.mocked(hubActions.computeIsIncompleteUser).mockResolvedValue(false)
    const data = buildData({ tournamentHasStarted: true, tournamentJustStarted: false })
    const result = await DashboardBanner({ user: mockUser, data })

    expect(result).toBeNull()
  })

  it('returns null when firstGameDate is null and user is complete', async () => {
    vi.mocked(hubActions.computeIsIncompleteUser).mockResolvedValue(false)
    const data = buildData({ firstGameDate: null, tournamentHasStarted: false })
    const result = await DashboardBanner({ user: mockUser, data })

    expect(result).toBeNull()
  })
})
