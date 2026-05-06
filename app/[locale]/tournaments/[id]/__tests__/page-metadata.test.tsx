import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
import { render } from '@testing-library/react'
import TournamentHubPage from '../page'

const mockGetLoggedInUser = vi.fn()
const mockGetActionCenterGames = vi.fn()
const mockGetTournamentHubPageData = vi.fn()

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}))

// Mock locale-utils
vi.mock('@/app/utils/locale-utils', () => ({
  toLocale: vi.fn((v: string) => v),
}))

// Mock scoring-rules-utils
vi.mock('@/app/utils/scoring-rules-utils', () => ({
  getRulesBySection: vi.fn(() => ({
    matches: ['rule-1'],
    qualifiedTeams: ['rule-2'],
    awards: ['rule-3'],
  })),
}))

// Mock user-actions
vi.mock('@/app/actions/user-actions', () => ({
  getLoggedInUser: () => mockGetLoggedInUser(),
}))

// Mock hub-actions
vi.mock('@/app/actions/hub-actions', () => ({
  getTournamentHubPageData: () => mockGetTournamentHubPageData(),
  getActionCenterGames: () => mockGetActionCenterGames(),
}))

// Mock prediction-constants
vi.mock('@/app/utils/prediction-constants', () => ({
  PREDICTION_LOCK_OFFSET_MS: 2 * 24 * 60 * 60 * 1000,
}))

// Mock DashboardBanner so it doesn't need real data
vi.mock('@/app/components/tournament-hub/dashboard-banner', () => ({
  DashboardBanner: () => <div data-testid="dashboard-banner" />,
}))

// Mock GamesPredictionWidget so we don't need to render the full widget tree
vi.mock('@/app/components/tournament-hub/games-prediction-widget', () => ({
  GamesPredictionWidget: () => <div data-testid="games-prediction-widget" />,
}))

// Mock MUI icons used in page.tsx
vi.mock('@mui/icons-material/SportsSoccer', () => ({ default: () => <span data-testid="icon-soccer" /> }))
vi.mock('@mui/icons-material/EmojiEvents', () => ({ default: () => <span data-testid="icon-events" /> }))
vi.mock('@mui/icons-material/Groups', () => ({ default: () => <span data-testid="icon-groups" /> }))
vi.mock('@mui/icons-material/History', () => ({ default: () => <span data-testid="icon-history" /> }))

// Mock new status widgets
vi.mock('@/app/components/tournament-hub/qualified-teams-widget', () => ({
  QualifiedTeamsWidget: () => <div data-testid="qualified-teams-widget" />,
}))
vi.mock('@/app/components/tournament-hub/awards-widget', () => ({
  AwardsWidget: () => <div data-testid="awards-widget" />,
}))

// Mock TournamentHubRecentResults (async server component)
vi.mock('@/app/components/tournament-hub/tournament-hub-recent-results', () => ({
  TournamentHubRecentResults: () => <div data-testid="recent-results-widget" />,
}))

const DEFAULT_HUB_DATA = {
  scoringConfig: {
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
  },
  totalGames: 64,
  isStarted: false,
  isNearStart: false,
  isFinished: false,
  qualifiersTotal: 32,
  awardsTotal: 7,
  firstGameDate: null,
  tournamentHasStarted: false,
  tournamentJustStarted: false,
  tournamentName: null,
}

const makeParams = (id: string) => ({
  params: Promise.resolve({ id }),
})

describe('TournamentHubPage (root landing page)', () => {
  const mockUser = { id: 'user-1', email: 'test@example.com' }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetLoggedInUser.mockResolvedValue(mockUser)
    mockGetActionCenterGames.mockResolvedValue(null)
    mockGetTournamentHubPageData.mockResolvedValue(DEFAULT_HUB_DATA)
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the hub page without errors when logged in', async () => {
    const result = await TournamentHubPage(makeParams('t-1'))
    expect(result).toBeTruthy()
  })

  it('renders DashboardBanner component', async () => {
    const page = await TournamentHubPage(makeParams('t-1'))
    render(page as Parameters<typeof render>[0])
    expect(screen.getByTestId('dashboard-banner')).toBeInTheDocument()
  })

  it('renders GamesPredictionWidget', async () => {
    const page = await TournamentHubPage(makeParams('t-1'))
    render(page as Parameters<typeof render>[0])
    expect(screen.getByTestId('games-prediction-widget')).toBeInTheDocument()
  })

  it('renders QualifiedTeamsWidget and AwardsWidget when prediction lock has not passed', async () => {
    const page = await TournamentHubPage(makeParams('t-1'))
    render(page as Parameters<typeof render>[0])
    expect(screen.getByTestId('qualified-teams-widget')).toBeInTheDocument()
    expect(screen.getByTestId('awards-widget')).toBeInTheDocument()
  })

  it('renders QualifiedTeamsWidget and AwardsWidget when tournament started but lock has not passed', async () => {
    // firstGameDate 1 day ago → msUntilPredictionLock > 0 (still 1 day remaining)
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    mockGetTournamentHubPageData.mockResolvedValue({ ...DEFAULT_HUB_DATA, tournamentHasStarted: true, firstGameDate: oneDayAgo })
    const page = await TournamentHubPage(makeParams('t-1'))
    render(page as Parameters<typeof render>[0])
    expect(screen.getByTestId('qualified-teams-widget')).toBeInTheDocument()
    expect(screen.getByTestId('awards-widget')).toBeInTheDocument()
  })

  it('does not render QualifiedTeamsWidget or AwardsWidget when prediction lock has passed', async () => {
    // firstGameDate 3 days ago → msUntilPredictionLock < 0 (lock was 1 day ago)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    mockGetTournamentHubPageData.mockResolvedValue({ ...DEFAULT_HUB_DATA, tournamentHasStarted: true, firstGameDate: threeDaysAgo })
    const page = await TournamentHubPage(makeParams('t-1'))
    render(page as Parameters<typeof render>[0])
    expect(screen.queryByTestId('qualified-teams-widget')).not.toBeInTheDocument()
    expect(screen.queryByTestId('awards-widget')).not.toBeInTheDocument()
  })

  it('renders the Results widget when hubData.tournamentHasStarted is true', async () => {
    mockGetTournamentHubPageData.mockResolvedValue({ ...DEFAULT_HUB_DATA, tournamentHasStarted: true })
    const page = await TournamentHubPage(makeParams('t-1'))
    render(page as Parameters<typeof render>[0])
    expect(screen.getByTestId('recent-results-widget')).toBeInTheDocument()
  })

  it('does not render the Results widget when tournamentHasStarted is false', async () => {
    const page = await TournamentHubPage(makeParams('t-1'))
    render(page as Parameters<typeof render>[0])
    expect(screen.queryByTestId('recent-results-widget')).not.toBeInTheDocument()
  })

  it('renders DashboardBanner even when user is not logged in', async () => {
    mockGetLoggedInUser.mockResolvedValue(null)
    const page = await TournamentHubPage(makeParams('t-1'))
    render(page as Parameters<typeof render>[0])
    expect(screen.getByTestId('dashboard-banner')).toBeInTheDocument()
  })

  it('does not call getActionCenterGames when user is not logged in', async () => {
    mockGetLoggedInUser.mockResolvedValue(null)
    await TournamentHubPage(makeParams('t-1'))
    expect(mockGetActionCenterGames).not.toHaveBeenCalled()
  })

  it('calls getActionCenterGames when user is logged in and tournament is not finished', async () => {
    await TournamentHubPage(makeParams('t-1'))
    expect(mockGetActionCenterGames).toHaveBeenCalled()
  })

  it('does not call getActionCenterGames when tournament is finished', async () => {
    mockGetTournamentHubPageData.mockResolvedValue({ ...DEFAULT_HUB_DATA, isFinished: true })
    await TournamentHubPage(makeParams('t-1'))
    expect(mockGetActionCenterGames).not.toHaveBeenCalled()
  })
})
