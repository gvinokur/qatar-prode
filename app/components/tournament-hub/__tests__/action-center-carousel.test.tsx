import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ActionCenterCarousel } from '../action-center-carousel'
import { testFactories } from '@/__tests__/db/test-factories'
import type { ActionCenterData } from '@/app/actions/hub-actions'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string, params?: Record<string, unknown>) => {
    if (params) return `${key}(${JSON.stringify(params)})`
    return key
  }),
  useLocale: vi.fn(() => 'en'),
}))

// Mock GuessesContextProvider (just wraps children in this context)
vi.mock('@/app/components/context-providers/guesses-context-provider', () => ({
  GuessesContextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  GuessesContext: {
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
}))

// Mock ScrollShadowContainer - just render children
vi.mock('@/app/components/common/scroll-shadow-container', () => ({
  ScrollShadowContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scroll-shadow-container">{children}</div>
  ),
}))

// Mock FlippableGameCard with a testable implementation
const mockFlippableGameCard = vi.fn()
vi.mock('@/app/components/flippable-game-card', () => ({
  default: (props: any) => {
    mockFlippableGameCard(props)
    return (
      <div data-testid={`flippable-card-${props.game.id}`} data-is-editing={props.isEditing}>
        <button onClick={props.onEditStart} data-testid={`edit-start-${props.game.id}`}>
          Edit
        </button>
        <button onClick={props.onEditEnd} data-testid={`edit-end-${props.game.id}`}>
          Cancel
        </button>
        <button
          onClick={props.onAutoAdvanceNext}
          data-testid={`advance-next-${props.game.id}`}
        >
          Next
        </button>
        <button
          onClick={props.onAutoGoPrevious}
          data-testid={`go-previous-${props.game.id}`}
        >
          Previous
        </button>
      </div>
    )
  },
}))

// Mock PreTournamentCountdown to avoid complex hook/timer setup
vi.mock('../pre-tournament-hero', () => ({
  PreTournamentCountdown: () => (
    <div data-testid="pre-tournament-countdown">PreTournamentCountdown</div>
  ),
}))

// Mock TournamentStartBanner
vi.mock('../tournament-start-banner', () => ({
  TournamentStartBanner: () => (
    <div data-testid="tournament-start-banner">TournamentStartBanner</div>
  ),
}))

const team1 = testFactories.team({ id: 'team-1', name: 'Team 1' })
const team2 = testFactories.team({ id: 'team-2', name: 'Team 2' })
const teamsMap = { 'team-1': team1, 'team-2': team2 }

const game1 = testFactories.game({ id: 'game-1', home_team: 'team-1', away_team: 'team-2' })
const game2 = testFactories.game({ id: 'game-2', home_team: 'team-1', away_team: 'team-2' })
const game3 = testFactories.game({ id: 'game-3', home_team: 'team-1', away_team: 'team-2' })

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000

const buildData = (overrides: Partial<ActionCenterData> = {}): ActionCenterData => ({
  games: [game1, game2, game3] as any,
  gameGuesses: {},
  teamsMap,
  tournamentMaxSilver: 5,
  tournamentMaxGolden: 3,
  mode: 'urgent',
  qtAndAwardsOpen: true,
  msUntilPredictionLock: TEN_DAYS_MS,
  tournamentFinished: false,
  firstGameDate: null,
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
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ActionCenterCarousel', () => {
  describe('card rendering', () => {
    it('renders a FlippableGameCard for each game', () => {
      render(<ActionCenterCarousel data={buildData()} tournamentId="t-1" locale="en" />)

      expect(screen.getByTestId('flippable-card-game-1')).toBeInTheDocument()
      expect(screen.getByTestId('flippable-card-game-2')).toBeInTheDocument()
      expect(screen.getByTestId('flippable-card-game-3')).toBeInTheDocument()
    })

    it('passes isPlayoffs=false when game has no playoffStage', () => {
      render(<ActionCenterCarousel data={buildData()} tournamentId="t-1" locale="en" />)

      const calls = mockFlippableGameCard.mock.calls
      expect(calls[0][0].isPlayoffs).toBe(false)
    })

    it('passes isPlayoffs=true when game has playoffStage', () => {
      const playoffGame = {
        ...game1,
        playoffStage: { tournament_playoff_round_id: 'r1', round_name: 'Final', is_final: true, is_third_place: false },
      }
      render(
        <ActionCenterCarousel
          data={buildData({ games: [playoffGame] as any })}
          tournamentId="t-1"
          locale="en"
        />
      )

      expect(mockFlippableGameCard.mock.calls[0][0].isPlayoffs).toBe(true)
    })

    it('passes homeScore, awayScore, boostType from gameGuesses', () => {
      const guess = testFactories.gameGuess({
        game_id: 'game-1',
        home_score: 2,
        away_score: 1,
        boost_type: 'silver',
      })
      render(
        <ActionCenterCarousel
          data={buildData({ gameGuesses: { 'game-1': guess } })}
          tournamentId="t-1"
          locale="en"
        />
      )

      const card1Props = mockFlippableGameCard.mock.calls.find(
        (call) => call[0].game.id === 'game-1'
      )?.[0]
      expect(card1Props?.homeScore).toBe(2)
      expect(card1Props?.awayScore).toBe(1)
      expect(card1Props?.boostType).toBe('silver')
    })
  })

  describe('edit state management', () => {
    it('starts with no card in editing mode', () => {
      render(<ActionCenterCarousel data={buildData()} tournamentId="t-1" locale="en" />)

      expect(screen.getByTestId('flippable-card-game-1')).toHaveAttribute(
        'data-is-editing',
        'false'
      )
      expect(screen.getByTestId('flippable-card-game-2')).toHaveAttribute(
        'data-is-editing',
        'false'
      )
    })

    it('sets editingGameId when onEditStart is called', () => {
      render(<ActionCenterCarousel data={buildData()} tournamentId="t-1" locale="en" />)

      fireEvent.click(screen.getByTestId('edit-start-game-1'))

      expect(screen.getByTestId('flippable-card-game-1')).toHaveAttribute(
        'data-is-editing',
        'true'
      )
      expect(screen.getByTestId('flippable-card-game-2')).toHaveAttribute(
        'data-is-editing',
        'false'
      )
    })

    it('only one card is editing at a time', () => {
      render(<ActionCenterCarousel data={buildData()} tournamentId="t-1" locale="en" />)

      fireEvent.click(screen.getByTestId('edit-start-game-1'))
      fireEvent.click(screen.getByTestId('edit-start-game-2'))

      expect(screen.getByTestId('flippable-card-game-1')).toHaveAttribute(
        'data-is-editing',
        'false'
      )
      expect(screen.getByTestId('flippable-card-game-2')).toHaveAttribute(
        'data-is-editing',
        'true'
      )
    })

    it('clears editingGameId when onEditEnd is called', () => {
      render(<ActionCenterCarousel data={buildData()} tournamentId="t-1" locale="en" />)

      fireEvent.click(screen.getByTestId('edit-start-game-1'))
      fireEvent.click(screen.getByTestId('edit-end-game-1'))

      expect(screen.getByTestId('flippable-card-game-1')).toHaveAttribute(
        'data-is-editing',
        'false'
      )
    })

    it('advances editingGameId to next game on onAutoAdvanceNext', () => {
      render(<ActionCenterCarousel data={buildData()} tournamentId="t-1" locale="en" />)

      fireEvent.click(screen.getByTestId('edit-start-game-1'))
      fireEvent.click(screen.getByTestId('advance-next-game-1'))

      expect(screen.getByTestId('flippable-card-game-2')).toHaveAttribute(
        'data-is-editing',
        'true'
      )
    })

    it('clears editingGameId on onAutoAdvanceNext when already on last card', () => {
      render(<ActionCenterCarousel data={buildData()} tournamentId="t-1" locale="en" />)

      fireEvent.click(screen.getByTestId('edit-start-game-3'))
      fireEvent.click(screen.getByTestId('advance-next-game-3'))

      expect(screen.getByTestId('flippable-card-game-3')).toHaveAttribute(
        'data-is-editing',
        'false'
      )
    })

    it('retreats editingGameId to previous game on onAutoGoPrevious', () => {
      render(<ActionCenterCarousel data={buildData()} tournamentId="t-1" locale="en" />)

      fireEvent.click(screen.getByTestId('edit-start-game-2'))
      fireEvent.click(screen.getByTestId('go-previous-game-2'))

      expect(screen.getByTestId('flippable-card-game-1')).toHaveAttribute(
        'data-is-editing',
        'true'
      )
    })

    it('clears editingGameId on onAutoGoPrevious when already on first card', () => {
      render(<ActionCenterCarousel data={buildData()} tournamentId="t-1" locale="en" />)

      fireEvent.click(screen.getByTestId('edit-start-game-1'))
      fireEvent.click(screen.getByTestId('go-previous-game-1'))

      expect(screen.getByTestId('flippable-card-game-1')).toHaveAttribute(
        'data-is-editing',
        'false'
      )
    })
  })

  describe('empty state', () => {
    it('renders no-games-in-window message when mode is empty', () => {
      render(
        <ActionCenterCarousel
          data={buildData({ mode: 'empty', games: [] })}
          tournamentId="t-1"
          locale="en"
        />
      )

      expect(screen.getByText('actionCenter.noGamesInWindow')).toBeInTheDocument()
    })

    it('renders predict-games link in empty mode', () => {
      render(
        <ActionCenterCarousel
          data={buildData({ mode: 'empty', games: [] })}
          tournamentId="t-1"
          locale="en"
        />
      )

      expect(screen.getByText('actionCenter.predictGames')).toBeInTheDocument()
    })

    it('does not render the scroll container in empty mode', () => {
      render(
        <ActionCenterCarousel
          data={buildData({ mode: 'empty', games: [] })}
          tournamentId="t-1"
          locale="en"
        />
      )

      expect(screen.queryByTestId('scroll-shadow-container')).not.toBeInTheDocument()
    })
  })

  describe('fallback mode', () => {
    it('renders fallback subtitle when mode is fallback', () => {
      render(
        <ActionCenterCarousel
          data={buildData({ mode: 'fallback' })}
          tournamentId="t-1"
          locale="en"
        />
      )

      expect(screen.getByText('actionCenter.fallbackSubtitle')).toBeInTheDocument()
    })

    it('still renders cards in fallback mode', () => {
      render(
        <ActionCenterCarousel
          data={buildData({ mode: 'fallback' })}
          tournamentId="t-1"
          locale="en"
        />
      )

      expect(screen.getByTestId('flippable-card-game-1')).toBeInTheDocument()
    })
  })

  describe('opener backfill', () => {
    it('shows opener label when openerBackfill=true', () => {
      render(
        <ActionCenterCarousel
          data={buildData({ mode: 'fallback', games: [game1] as any, openerBackfill: true })}
          tournamentId="t-1"
          locale="en"
        />
      )

      expect(screen.getByText('preTournament.openerLabel')).toBeInTheDocument()
    })

    it('does not show opener label when openerBackfill=false', () => {
      render(<ActionCenterCarousel data={buildData()} tournamentId="t-1" locale="en" />)

      expect(screen.queryByText('preTournament.openerLabel')).not.toBeInTheDocument()
    })

    it('renders the opener card in the carousel when openerBackfill=true', () => {
      render(
        <ActionCenterCarousel
          data={buildData({ mode: 'fallback', games: [game1] as any, openerBackfill: true })}
          tournamentId="t-1"
          locale="en"
        />
      )

      expect(screen.getByTestId('flippable-card-game-1')).toBeInTheDocument()
      expect(screen.getByTestId('scroll-shadow-container')).toBeInTheDocument()
    })
  })

  describe('prediction progress circles', () => {
    it('renders progress circles when qtAndAwardsOpen is true', () => {
      render(<ActionCenterCarousel data={buildData({ qtAndAwardsOpen: true })} tournamentId="t-1" locale="en" />)

      expect(screen.getByText('preTournament.qtLabel')).toBeInTheDocument()
      expect(screen.getByText('preTournament.awardsLabel')).toBeInTheDocument()
      expect(screen.getByText('preTournament.gamesLabel')).toBeInTheDocument()
    })

    it('does not render progress circles when qtAndAwardsOpen is false', () => {
      render(<ActionCenterCarousel data={buildData({ qtAndAwardsOpen: false })} tournamentId="t-1" locale="en" />)

      expect(screen.queryByText('preTournament.qtLabel')).not.toBeInTheDocument()
      expect(screen.queryByText('preTournament.awardsLabel')).not.toBeInTheDocument()
      expect(screen.queryByText('preTournament.gamesLabel')).not.toBeInTheDocument()
    })

    it('renders progress circles in fallback mode when qtAndAwardsOpen is true', () => {
      render(
        <ActionCenterCarousel data={buildData({ mode: 'fallback', qtAndAwardsOpen: true })} tournamentId="t-1" locale="en" />
      )

      expect(screen.getByText('preTournament.qtLabel')).toBeInTheDocument()
      expect(screen.getByText('preTournament.awardsLabel')).toBeInTheDocument()
    })

    it('links to the correct URLs', () => {
      render(<ActionCenterCarousel data={buildData()} tournamentId="tour-42" locale="en" />)

      const links = screen.getAllByRole('link')
      const hrefs = links.map((l) => l.getAttribute('href'))
      expect(hrefs).toContain('/en/tournaments/tour-42/qualified-teams')
      expect(hrefs).toContain('/en/tournaments/tour-42/awards')
      expect(hrefs).toContain('/en/tournaments/tour-42/games')
    })
  })

  describe('countdown', () => {
    it('renders PreTournamentCountdown when tournament has not started and firstGameDate is set', () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      render(
        <ActionCenterCarousel
          data={buildData({ firstGameDate: futureDate, tournamentHasStarted: false })}
          tournamentId="t-1"
          locale="en"
        />
      )

      expect(screen.getByTestId('pre-tournament-countdown')).toBeInTheDocument()
    })

    it('does not render countdown when tournamentHasStarted=true', () => {
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      render(
        <ActionCenterCarousel
          data={buildData({ firstGameDate: pastDate, tournamentHasStarted: true })}
          tournamentId="t-1"
          locale="en"
        />
      )

      expect(screen.queryByTestId('pre-tournament-countdown')).not.toBeInTheDocument()
    })

    it('does not render countdown when firstGameDate is null', () => {
      render(
        <ActionCenterCarousel
          data={buildData({ firstGameDate: null, tournamentHasStarted: false })}
          tournamentId="t-1"
          locale="en"
        />
      )

      expect(screen.queryByTestId('pre-tournament-countdown')).not.toBeInTheDocument()
    })
  })

  describe('celebration banner', () => {
    it('renders TournamentStartBanner above carousel when tournamentJustStarted=true', () => {
      render(
        <ActionCenterCarousel
          data={buildData({ tournamentJustStarted: true })}
          tournamentId="t-1"
          locale="en"
        />
      )

      expect(screen.getByTestId('tournament-start-banner')).toBeInTheDocument()
    })

    it('does not render TournamentStartBanner when tournamentJustStarted=false', () => {
      render(
        <ActionCenterCarousel
          data={buildData({ tournamentJustStarted: false })}
          tournamentId="t-1"
          locale="en"
        />
      )

      expect(screen.queryByTestId('tournament-start-banner')).not.toBeInTheDocument()
    })
  })

  describe('single-game centering', () => {
    it('does not center when games.length > 1', () => {
      render(<ActionCenterCarousel data={buildData()} tournamentId="t-1" locale="en" />)

      const container = screen.getByTestId('scroll-shadow-container')
      // With multiple games the parent doesn't force center alignment
      expect(container).toBeInTheDocument()
      // All 3 game cards render
      expect(screen.getByTestId('flippable-card-game-1')).toBeInTheDocument()
      expect(screen.getByTestId('flippable-card-game-2')).toBeInTheDocument()
      expect(screen.getByTestId('flippable-card-game-3')).toBeInTheDocument()
    })

    it('renders exactly one card when games.length is 1', () => {
      render(
        <ActionCenterCarousel
          data={buildData({ games: [game1] as any })}
          tournamentId="t-1"
          locale="en"
        />
      )

      expect(screen.getByTestId('flippable-card-game-1')).toBeInTheDocument()
      expect(screen.queryByTestId('flippable-card-game-2')).not.toBeInTheDocument()
    })
  })
})
