import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { GamesActiveClient } from '../games-active-client'
import { GuessesContext } from '@/app/components/context-providers/guesses-context-provider'
import { testFactories } from '@/__tests__/db/test-factories'
import type { GameGuessNew } from '@/app/db/tables-definition'

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string, params?: Record<string, unknown>) => {
    if (params && Object.keys(params).length > 0) return `${key}(${JSON.stringify(params)})`
    return key
  }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock FlippableGameCard with a testable implementation
const mockFlippableGameCard = vi.fn()
vi.mock('@/app/components/flippable-game-card', () => ({
  default: (props: any) => {
    mockFlippableGameCard(props)
    return (
      <div
        data-testid={`game-card-${props.game.id}`}
        data-is-editing={String(props.isEditing)}
      />
    )
  },
}))

const team1 = testFactories.team({ id: 'team-1', name: 'Team 1' })
const team2 = testFactories.team({ id: 'team-2', name: 'Team 2' })
const teamsMap = { 'team-1': team1, 'team-2': team2 }

const game1 = testFactories.game({ id: 'game-1', home_team: 'team-1', away_team: 'team-2' })
const game2 = testFactories.game({ id: 'game-2', home_team: 'team-1', away_team: 'team-2' })
const game3 = testFactories.game({ id: 'game-3', home_team: 'team-1', away_team: 'team-2' })
const games = [game1, game2, game3] as any

// Playoff game fixture — used for penalty-winner completeness tests
const playoffGame1 = testFactories.game({
  id: 'pg-1',
  home_team: 'team-1',
  away_team: 'team-2',
  game_type: 'playoff',
  playoffStage: { tournament_playoff_round_id: 'r-1', round_name: 'QF', is_final: false, is_third_place: false },
} as any)

const defaultContextValue = {
  gameGuesses: {} as Record<string, GameGuessNew>,
  boostCounts: { silver: { used: 0, max: 0 }, golden: { used: 0, max: 0 } },
  updateGameGuess: vi.fn(),
}

function renderWithContext(
  ui: React.ReactElement,
  contextOverrides: Partial<typeof defaultContextValue> = {}
) {
  const contextValue = { ...defaultContextValue, ...contextOverrides }
  return render(
    <GuessesContext.Provider value={contextValue}>{ui}</GuessesContext.Provider>
  )
}

const defaultProps = {
  games,
  teamsMap,
  tournamentId: 't-1',
  gamesHref: '/en/tournaments/t-1/games',
  urgencyLevel: 'high' as const,
  cardTitle: 'Matches',
  initialPredicted: 30,
  totalGames: 64,
  urgentGameIds: ['game-1', 'game-2', 'game-3'],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GamesActiveClient', () => {
  describe('initial render', () => {
    it('renders FlippableGameCard for the first game initially', () => {
      renderWithContext(<GamesActiveClient {...defaultProps} />)
      expect(screen.getByTestId('game-card-game-1')).toBeInTheDocument()
      expect(screen.queryByTestId('game-card-game-2')).not.toBeInTheDocument()
    })

    it('renders single game with both arrows disabled when games.length is 1', () => {
      renderWithContext(<GamesActiveClient {...defaultProps} games={[game1] as any} urgentGameIds={['game-1']} />)
      expect(screen.getByLabelText('previous game')).toBeDisabled()
      expect(screen.getByLabelText('next game')).toBeDisabled()
    })

    it('renders the card title', () => {
      renderWithContext(<GamesActiveClient {...defaultProps} />)
      expect(screen.getByText('Matches')).toBeInTheDocument()
    })

    it('renders initial predicted count', () => {
      renderWithContext(<GamesActiveClient {...defaultProps} />)
      expect(screen.getByText('30/64')).toBeInTheDocument()
    })
  })

  describe('navigation', () => {
    it('left arrow button is disabled when currentIndex is 0', () => {
      renderWithContext(<GamesActiveClient {...defaultProps} />)
      expect(screen.getByLabelText('previous game')).toBeDisabled()
    })

    it('right arrow button is disabled at the last game', () => {
      renderWithContext(<GamesActiveClient {...defaultProps} />)
      fireEvent.click(screen.getByLabelText('next game'))
      fireEvent.click(screen.getByLabelText('next game'))
      expect(screen.getByLabelText('next game')).toBeDisabled()
    })

    it('clicking right increments currentIndex and renders next game', () => {
      renderWithContext(<GamesActiveClient {...defaultProps} />)
      fireEvent.click(screen.getByLabelText('next game'))
      expect(screen.getByTestId('game-card-game-2')).toBeInTheDocument()
      expect(screen.queryByTestId('game-card-game-1')).not.toBeInTheDocument()
    })

    it('clicking left decrements currentIndex and renders previous game', () => {
      renderWithContext(<GamesActiveClient {...defaultProps} />)
      fireEvent.click(screen.getByLabelText('next game'))
      fireEvent.click(screen.getByLabelText('previous game'))
      expect(screen.getByTestId('game-card-game-1')).toBeInTheDocument()
    })
  })

  describe('reactive counter (delta tracking)', () => {
    it('increments displayed count when a new guess is added to context', () => {
      const guess = testFactories.gameGuess({ game_id: 'game-1' }) as any
      // First render with empty guesses — useRef snapshot is captured here
      const { rerender } = renderWithContext(
        <GamesActiveClient {...defaultProps} />,
        { gameGuesses: {} }
      )
      expect(screen.getByText('30/64')).toBeInTheDocument()
      // Context updates (user predicts game-1)
      rerender(
        <GuessesContext.Provider value={{ ...defaultContextValue, gameGuesses: { 'game-1': guess } }}>
          <GamesActiveClient {...defaultProps} />
        </GuessesContext.Provider>
      )
      // delta = 1 (one new guess vs empty snapshot) → 30 + 1 = 31
      expect(screen.getByText('31/64')).toBeInTheDocument()
    })

    it('decrements displayed count when a guess is removed from context', () => {
      const guess = testFactories.gameGuess({ game_id: 'game-1' }) as any
      // Start with one guess in context (initial snapshot captures it)
      const { rerender } = renderWithContext(
        <GamesActiveClient {...defaultProps} initialPredicted={31} />,
        { gameGuesses: { 'game-1': guess } }
      )
      // Now context loses the guess (user deleted it) — but initial snapshot still has it
      rerender(
        <GuessesContext.Provider value={{ ...defaultContextValue, gameGuesses: {} }}>
          <GamesActiveClient {...defaultProps} initialPredicted={31} />
        </GuessesContext.Provider>
      )
      // delta = 0 - 1 = -1 → 31 - 1 = 30
      expect(screen.getByText('30/64')).toBeInTheDocument()
    })
  })

  describe('completeness check (scores + playoff penalty)', () => {
    it('does not increment count for a partial guess missing away_score', () => {
      const partialGuess = testFactories.gameGuess({ game_id: 'game-1', home_score: 2, away_score: undefined as any }) as any
      const { rerender } = renderWithContext(
        <GamesActiveClient {...defaultProps} />,
        { gameGuesses: {} }
      )
      expect(screen.getByText('30/64')).toBeInTheDocument()
      rerender(
        <GuessesContext.Provider value={{ ...defaultContextValue, gameGuesses: { 'game-1': partialGuess } }}>
          <GamesActiveClient {...defaultProps} />
        </GuessesContext.Provider>
      )
      // partial guess is not complete → delta stays 0
      expect(screen.getByText('30/64')).toBeInTheDocument()
    })

    it('does not count a tied playoff game without a penalty winner', () => {
      const tiedGuess = testFactories.gameGuess({
        game_id: 'pg-1',
        home_score: 1,
        away_score: 1,
        home_penalty_winner: false,
        away_penalty_winner: false,
      }) as any
      const playoffProps = {
        ...defaultProps,
        games: [playoffGame1] as any,
        urgentGameIds: ['pg-1'],
      }
      const { rerender } = renderWithContext(
        <GamesActiveClient {...playoffProps} />,
        { gameGuesses: {} }
      )
      expect(screen.getByText('30/64')).toBeInTheDocument()
      rerender(
        <GuessesContext.Provider value={{ ...defaultContextValue, gameGuesses: { 'pg-1': tiedGuess } }}>
          <GamesActiveClient {...playoffProps} />
        </GuessesContext.Provider>
      )
      // tied playoff without penalty winner → not complete → count stays at 30
      expect(screen.getByText('30/64')).toBeInTheDocument()
    })

    it('counts a tied playoff game once penalty winner is selected', () => {
      const completeGuess = testFactories.gameGuess({
        game_id: 'pg-1',
        home_score: 1,
        away_score: 1,
        home_penalty_winner: true,
        away_penalty_winner: false,
      }) as any
      const playoffProps = {
        ...defaultProps,
        games: [playoffGame1] as any,
        urgentGameIds: ['pg-1'],
      }
      const { rerender } = renderWithContext(
        <GamesActiveClient {...playoffProps} />,
        { gameGuesses: {} }
      )
      expect(screen.getByText('30/64')).toBeInTheDocument()
      rerender(
        <GuessesContext.Provider value={{ ...defaultContextValue, gameGuesses: { 'pg-1': completeGuess } }}>
          <GamesActiveClient {...playoffProps} />
        </GuessesContext.Provider>
      )
      // tied playoff with penalty winner → complete → count = 31
      expect(screen.getByText('31/64')).toBeInTheDocument()
    })
  })

  describe('urgency → safe transition', () => {
    it('transitions to safe urgency when all urgentGameIds are predicted in context', () => {
      const guesses = {
        'game-1': testFactories.gameGuess({ game_id: 'game-1' }) as any,
        'game-2': testFactories.gameGuess({ game_id: 'game-2' }) as any,
        'game-3': testFactories.gameGuess({ game_id: 'game-3' }) as any,
      }
      renderWithContext(
        <GamesActiveClient {...defaultProps} urgencyLevel="high" urgentGameIds={['game-1', 'game-2', 'game-3']} />,
        { gameGuesses: guesses }
      )
      // All urgent games predicted → effectiveIsUrgent=false, safe message shown (current game-1 is predicted)
      expect(screen.getByText('gamesWidget.safeMessage')).toBeInTheDocument()
      expect(screen.queryByText(/gamesWidget.urgentMessage/)).not.toBeInTheDocument()
    })
  })

  describe('GuessesContext integration', () => {
    it('reads gameGuesses from GuessesContext and passes scores to FlippableGameCard', () => {
      const guess = testFactories.gameGuess({ game_id: 'game-1', home_score: 2, away_score: 1 })
      renderWithContext(<GamesActiveClient {...defaultProps} />, {
        gameGuesses: { 'game-1': guess },
      })
      const calls = mockFlippableGameCard.mock.calls
      const game1Props = calls.find((c) => c[0].game.id === 'game-1')?.[0]
      expect(game1Props?.homeScore).toBe(2)
      expect(game1Props?.awayScore).toBe(1)
    })
  })

  describe('view all link', () => {
    it('renders "View All Matches" link button with correct gamesHref', () => {
      renderWithContext(<GamesActiveClient {...defaultProps} />)
      const link = screen.getByRole('link', { name: /gamesWidget.ctaViewAll/i })
      expect(link).toHaveAttribute('href', '/en/tournaments/t-1/games')
    })
  })

  describe('urgency messages', () => {
    it('renders urgency message when urgencyLevel is "critical" and urgent games remain unpredicted', () => {
      renderWithContext(
        <GamesActiveClient {...defaultProps} urgencyLevel="critical" />,
        { gameGuesses: {} }
      )
      expect(screen.getByText(/gamesWidget.urgentMessage/)).toBeInTheDocument()
    })

    it('renders urgency message when urgencyLevel is "high" and urgent games remain unpredicted', () => {
      renderWithContext(
        <GamesActiveClient {...defaultProps} urgencyLevel="high" />,
        { gameGuesses: {} }
      )
      expect(screen.getByText(/gamesWidget.urgentMessage/)).toBeInTheDocument()
    })

    it('renders urgency message when urgencyLevel is "medium" and urgent games remain unpredicted', () => {
      renderWithContext(
        <GamesActiveClient {...defaultProps} urgencyLevel="medium" />,
        { gameGuesses: {} }
      )
      expect(screen.getByText(/gamesWidget.urgentMessage/)).toBeInTheDocument()
    })

    it('renders safe message when urgencyLevel is "safe", regardless of which card is currently visible', () => {
      renderWithContext(
        // No urgentGameIds → effectiveIsUrgent=false → effectiveUrgencyLevel='safe'
        // No guesses — current card is NOT predicted, but message should still show
        <GamesActiveClient {...defaultProps} urgencyLevel="safe" urgentGameIds={[]} />,
        { gameGuesses: {} }
      )
      expect(screen.getByText('gamesWidget.safeMessage')).toBeInTheDocument()
      expect(screen.queryByText(/gamesWidget.urgentMessage/)).not.toBeInTheDocument()
    })

    it('renders no status message when urgencyLevel is "empty"', () => {
      renderWithContext(
        <GamesActiveClient {...defaultProps} urgencyLevel="empty" urgentGameIds={[]} />
      )
      expect(screen.queryByText(/gamesWidget.urgentMessage/)).not.toBeInTheDocument()
      expect(screen.queryByText('gamesWidget.safeMessage')).not.toBeInTheDocument()
    })
  })
})
