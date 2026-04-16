import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ActionCenterCarousel } from '../action-center-carousel'
import { testFactories } from '@/__tests__/db/test-factories'
import type { ActionCenterData } from '@/app/actions/hub-actions'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
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

    it('renders predict-games and quick-action links in empty mode', () => {
      render(
        <ActionCenterCarousel
          data={buildData({ mode: 'empty', games: [] })}
          tournamentId="t-1"
          locale="en"
        />
      )

      expect(screen.getByText('actionCenter.predictGames')).toBeInTheDocument()
      expect(screen.getAllByText('actionCenter.qualifiedTeamsTitle').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('actionCenter.awardsTitle').length).toBeGreaterThanOrEqual(1)
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

  describe('quick-action cards', () => {
    it('renders qualified teams and awards cards when qtAndAwardsOpen is true', () => {
      render(<ActionCenterCarousel data={buildData({ qtAndAwardsOpen: true })} tournamentId="t-1" locale="en" />)

      expect(screen.getByText('actionCenter.qualifiedTeamsHint')).toBeInTheDocument()
      expect(screen.getByText('actionCenter.awardsHint')).toBeInTheDocument()
    })

    it('does not render quick-action section when qtAndAwardsOpen is false', () => {
      render(<ActionCenterCarousel data={buildData({ qtAndAwardsOpen: false })} tournamentId="t-1" locale="en" />)

      expect(screen.queryByText('actionCenter.qualifiedTeamsHint')).not.toBeInTheDocument()
      expect(screen.queryByText('actionCenter.awardsHint')).not.toBeInTheDocument()
      expect(screen.queryByText('actionCenter.quickActions')).not.toBeInTheDocument()
    })

    it('renders quick-action cards in fallback mode when qtAndAwardsOpen is true', () => {
      render(
        <ActionCenterCarousel data={buildData({ mode: 'fallback', qtAndAwardsOpen: true })} tournamentId="t-1" locale="en" />
      )

      expect(screen.getByText('actionCenter.qualifiedTeamsHint')).toBeInTheDocument()
      expect(screen.getByText('actionCenter.awardsHint')).toBeInTheDocument()
    })

    it('links to the correct URLs', () => {
      render(<ActionCenterCarousel data={buildData()} tournamentId="tour-42" locale="en" />)

      const links = screen.getAllByRole('link')
      const hrefs = links.map((l) => l.getAttribute('href'))
      expect(hrefs).toContain('/en/tournaments/tour-42/qualified-teams')
      expect(hrefs).toContain('/en/tournaments/tour-42/awards')
    })
  })

  describe('urgency chip', () => {
    it('does not show urgency chips when msUntilPredictionLock is safe (>48h)', () => {
      render(
        <ActionCenterCarousel
          data={buildData({ qtAndAwardsOpen: true, msUntilPredictionLock: TEN_DAYS_MS })}
          tournamentId="t-1"
          locale="en"
        />
      )

      expect(screen.queryByTestId('urgency-chip-qt')).not.toBeInTheDocument()
      expect(screen.queryByTestId('urgency-chip-awards')).not.toBeInTheDocument()
    })

    it('shows urgency chips when msUntilPredictionLock is in notice range (24-48h)', () => {
      const THIRTY_HOURS_MS = 30 * 60 * 60 * 1000
      render(
        <ActionCenterCarousel
          data={buildData({ qtAndAwardsOpen: true, msUntilPredictionLock: THIRTY_HOURS_MS })}
          tournamentId="t-1"
          locale="en"
        />
      )

      expect(screen.getByTestId('urgency-chip-qt')).toBeInTheDocument()
      expect(screen.getByTestId('urgency-chip-awards')).toBeInTheDocument()
    })

    it('shows urgency chips when msUntilPredictionLock is in warning range (<24h)', () => {
      const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000
      render(
        <ActionCenterCarousel
          data={buildData({ qtAndAwardsOpen: true, msUntilPredictionLock: TWELVE_HOURS_MS })}
          tournamentId="t-1"
          locale="en"
        />
      )

      expect(screen.getByTestId('urgency-chip-qt')).toBeInTheDocument()
      expect(screen.getByTestId('urgency-chip-awards')).toBeInTheDocument()
    })

    it('does not show urgency chips when qtAndAwardsOpen is false even if ms is low', () => {
      render(
        <ActionCenterCarousel
          data={buildData({ qtAndAwardsOpen: false, msUntilPredictionLock: 1000 })}
          tournamentId="t-1"
          locale="en"
        />
      )

      expect(screen.queryByTestId('urgency-chip-qt')).not.toBeInTheDocument()
      expect(screen.queryByTestId('urgency-chip-awards')).not.toBeInTheDocument()
    })
  })
})
