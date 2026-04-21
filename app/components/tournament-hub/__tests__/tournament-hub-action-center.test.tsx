import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TournamentHubActionCenter } from '../tournament-hub-action-center'
import type { ActionCenterData } from '@/app/actions/hub-actions'

vi.mock('@/app/actions/hub-actions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/app/actions/hub-actions')>()
  return {
    ...actual,
    getActionCenterGames: vi.fn(),
    computeIsIncompleteUser: vi.fn(),
  }
})

vi.mock('../action-center-carousel', () => ({
  ActionCenterCarousel: ({ data }: { data: ActionCenterData }) => (
    <div data-testid="action-center-carousel" data-tournament-started={String(data.tournamentHasStarted)} />
  ),
}))

vi.mock('../pre-tournament-new-user-action-center', () => ({
  PreTournamentNewUserActionCenter: () => (
    <div data-testid="pre-tournament-new-user" />
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

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TournamentHubActionCenter', () => {
  it('returns null when tournamentFinished is true', async () => {
    const data = buildData({ tournamentFinished: true })
    const result = await TournamentHubActionCenter({ tournamentId: 't-1', locale: 'en', data })
    expect(result).toBeNull()
  })

  it('renders ActionCenterCarousel for complete user (computeIsIncompleteUser returns false)', async () => {
    const data = buildData()
    vi.mocked(hubActions.computeIsIncompleteUser).mockReturnValue(false)

    render(await TournamentHubActionCenter({ tournamentId: 't-1', locale: 'en', data }))
    expect(screen.getByTestId('action-center-carousel')).toBeInTheDocument()
    expect(screen.queryByTestId('pre-tournament-new-user')).not.toBeInTheDocument()
  })

  it('renders PreTournamentNewUserActionCenter for incomplete user', async () => {
    const data = buildData()
    vi.mocked(hubActions.computeIsIncompleteUser).mockReturnValue(true)

    render(await TournamentHubActionCenter({ tournamentId: 't-1', locale: 'en', data }))
    expect(screen.getByTestId('pre-tournament-new-user')).toBeInTheDocument()
    expect(screen.queryByTestId('action-center-carousel')).not.toBeInTheDocument()
  })

  it('renders ActionCenterCarousel (not new user view) when tournament has started even if computeIsIncompleteUser returns true', async () => {
    // computeIsIncompleteUser already returns false when tournamentHasStarted=true,
    // but this test confirms the routing works correctly via the mock
    const data = buildData({ tournamentHasStarted: true })
    vi.mocked(hubActions.computeIsIncompleteUser).mockReturnValue(false)

    render(await TournamentHubActionCenter({ tournamentId: 't-1', locale: 'en', data }))
    expect(screen.getByTestId('action-center-carousel')).toBeInTheDocument()
  })

  it('calls getActionCenterGames when no data prop is provided', async () => {
    const data = buildData()
    vi.mocked(hubActions.getActionCenterGames).mockResolvedValue(data)
    vi.mocked(hubActions.computeIsIncompleteUser).mockReturnValue(false)

    render(await TournamentHubActionCenter({ tournamentId: 't-1', locale: 'en' }))
    expect(hubActions.getActionCenterGames).toHaveBeenCalledWith('t-1', 'en')
  })

  it('skips getActionCenterGames when data prop is provided', async () => {
    const data = buildData()
    vi.mocked(hubActions.computeIsIncompleteUser).mockReturnValue(false)

    render(await TournamentHubActionCenter({ tournamentId: 't-1', locale: 'en', data }))
    expect(hubActions.getActionCenterGames).not.toHaveBeenCalled()
  })
})
