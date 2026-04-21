import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PreTournamentNewUserActionCenter } from '../pre-tournament-new-user-action-center'
import type { ActionCenterData } from '@/app/actions/hub-actions'

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async (ns: string) => {
    return (key: string, params?: Record<string, unknown>) => {
      const fullKey = `${ns}.${key}`
      if (params && Object.keys(params).length > 0) {
        return `${fullKey}(${JSON.stringify(params)})`
      }
      return fullKey
    }
  }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('../pre-tournament-hero', () => ({
  PreTournamentCountdown: ({ firstGameDate }: { firstGameDate: Date }) => (
    <div data-testid="pre-tournament-countdown" data-date={firstGameDate.toISOString()} />
  ),
}))

vi.mock('../tutorial-cta-card', () => ({
  TutorialCTACard: () => <div data-testid="tutorial-cta-card" />,
}))

vi.mock('@/app/utils/scoring-rules-utils', () => ({
  getRulesBySection: vi.fn(() => ({
    matches: ['matches-rule-1', 'matches-rule-2'],
    qualifiedTeams: ['qt-rule-1', 'qt-rule-2'],
    awards: ['awards-rule-1', 'awards-rule-2'],
  })),
  getConstraintsBySection: vi.fn(() => ({
    matches: 'matches-deadline',
    qualifiedTeams: 'qt-deadline',
    awards: 'awards-deadline',
  })),
}))

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

describe('PreTournamentNewUserActionCenter', () => {
  it('renders the countdown when firstGameDate is set', async () => {
    render(await PreTournamentNewUserActionCenter({ data: buildData(), tournamentId: 't-1', locale: 'en' }))
    expect(screen.getByTestId('pre-tournament-countdown')).toBeInTheDocument()
  })

  it('does not render the countdown when firstGameDate is null', async () => {
    render(await PreTournamentNewUserActionCenter({
      data: buildData({ firstGameDate: null }),
      tournamentId: 't-1',
      locale: 'en',
    }))
    expect(screen.queryByTestId('pre-tournament-countdown')).not.toBeInTheDocument()
  })

  it('renders the tutorial card', async () => {
    render(await PreTournamentNewUserActionCenter({ data: buildData(), tournamentId: 't-1', locale: 'en' }))
    expect(screen.getByTestId('tutorial-cta-card')).toBeInTheDocument()
  })

  it('renders 3 prediction track CTAs (Matches, QT, Awards)', async () => {
    render(await PreTournamentNewUserActionCenter({ data: buildData(), tournamentId: 't-1', locale: 'en' }))
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs).toContain('/en/tournaments/t-1/games')
    expect(hrefs).toContain('/en/tournaments/t-1/qualified-teams')
    expect(hrefs).toContain('/en/tournaments/t-1/awards')
  })

  it('shows correct matches progress count', async () => {
    render(await PreTournamentNewUserActionCenter({
      data: buildData({ predictedGames: 12, totalGames: 104 }),
      tournamentId: 't-1',
      locale: 'en',
    }))
    expect(screen.getByText('12/104')).toBeInTheDocument()
  })

  it('shows correct awards progress count', async () => {
    render(await PreTournamentNewUserActionCenter({
      data: buildData({ awardsCompleted: 3, awardsTotal: 7 }),
      tournamentId: 't-1',
      locale: 'en',
    }))
    expect(screen.getByText('3/7')).toBeInTheDocument()
  })

  it('shows correct QT progress count', async () => {
    render(await PreTournamentNewUserActionCenter({
      data: buildData({ qualifiersCompleted: 16, qualifiersTotal: 32 }),
      tournamentId: 't-1',
      locale: 'en',
    }))
    expect(screen.getByText('16/32')).toBeInTheDocument()
  })

  it('shows primary CTA (not review) when matches track is incomplete', async () => {
    render(await PreTournamentNewUserActionCenter({
      data: buildData({ predictedGames: 0, totalGames: 64 }),
      tournamentId: 't-1',
      locale: 'en',
    }))
    // CTA key is returned as hub.newUser.tracks.matches.cta by mock translator
    expect(screen.getByText('hub.newUser.tracks.matches.cta')).toBeInTheDocument()
  })

  it('shows review CTA when matches track is complete', async () => {
    render(await PreTournamentNewUserActionCenter({
      data: buildData({ predictedGames: 64, totalGames: 64 }),
      tournamentId: 't-1',
      locale: 'en',
    }))
    expect(screen.getByText('hub.newUser.tracks.matches.ctaReview')).toBeInTheDocument()
  })

  it('renders scoring rules from getRulesBySection for each track', async () => {
    render(await PreTournamentNewUserActionCenter({ data: buildData(), tournamentId: 't-1', locale: 'en' }))
    expect(screen.getByText(/matches-rule-1/)).toBeInTheDocument()
    expect(screen.getByText(/qt-rule-1/)).toBeInTheDocument()
    expect(screen.getByText(/awards-rule-1/)).toBeInTheDocument()
  })
})
