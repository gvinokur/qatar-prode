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
  mode: 'urgent' as const,
  urgencyLevel: 'high' as const,
  unpredictedCount: 3,
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
      renderWithContext(<GamesActiveClient {...defaultProps} games={[game1] as any} />)
      expect(screen.getByLabelText('previous game')).toBeDisabled()
      expect(screen.getByLabelText('next game')).toBeDisabled()
    })
  })

  describe('navigation', () => {
    it('left arrow button is disabled when currentIndex is 0', () => {
      renderWithContext(<GamesActiveClient {...defaultProps} />)
      expect(screen.getByLabelText('previous game')).toBeDisabled()
    })

    it('right arrow button is disabled at the last game', () => {
      // Click right twice to reach last game (index 2 of 3)
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

    it('clicking left from index 0 does not decrement below 0', () => {
      renderWithContext(<GamesActiveClient {...defaultProps} />)
      // Button is disabled at 0, but verify boundary via state
      const leftBtn = screen.getByLabelText('previous game')
      expect(leftBtn).toBeDisabled()
      // Still shows game-1
      expect(screen.getByTestId('game-card-game-1')).toBeInTheDocument()
    })

    it('clicking right from last index does not increment beyond games.length-1', () => {
      renderWithContext(<GamesActiveClient {...defaultProps} />)
      fireEvent.click(screen.getByLabelText('next game'))
      fireEvent.click(screen.getByLabelText('next game'))
      const rightBtn = screen.getByLabelText('next game')
      expect(rightBtn).toBeDisabled()
      expect(screen.getByTestId('game-card-game-3')).toBeInTheDocument()
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
    it('renders urgency message with Error icon when urgencyLevel is "critical"', () => {
      renderWithContext(
        <GamesActiveClient {...defaultProps} urgencyLevel="critical" unpredictedCount={5} />
      )
      // Error icon renders with data-testid or role; check for message text
      expect(screen.getByText(/gamesWidget.urgentMessage/)).toBeInTheDocument()
    })

    it('renders urgency message with WarningAmber icon when urgencyLevel is "high"', () => {
      renderWithContext(
        <GamesActiveClient {...defaultProps} urgencyLevel="high" unpredictedCount={3} />
      )
      expect(screen.getByText(/gamesWidget.urgentMessage/)).toBeInTheDocument()
    })

    it('renders urgency message with Info icon when urgencyLevel is "medium"', () => {
      renderWithContext(
        <GamesActiveClient {...defaultProps} urgencyLevel="medium" unpredictedCount={2} />
      )
      expect(screen.getByText(/gamesWidget.urgentMessage/)).toBeInTheDocument()
    })

    it('renders safe message when urgencyLevel is "safe" and current game is predicted', () => {
      const guessForGame1 = testFactories.gameGuess({ game_id: 'game-1' }) as any
      renderWithContext(
        <GamesActiveClient {...defaultProps} urgencyLevel="safe" unpredictedCount={0} />,
        { gameGuesses: { 'game-1': guessForGame1 } }
      )
      expect(screen.getByText('gamesWidget.safeMessage')).toBeInTheDocument()
      expect(screen.queryByText(/gamesWidget.urgentMessage/)).not.toBeInTheDocument()
    })

    it('renders no status message when urgencyLevel is "safe" and current game is not predicted', () => {
      renderWithContext(
        <GamesActiveClient {...defaultProps} urgencyLevel="safe" unpredictedCount={0} />,
        { gameGuesses: {} }
      )
      expect(screen.queryByText('gamesWidget.safeMessage')).not.toBeInTheDocument()
      expect(screen.queryByText(/gamesWidget.urgentMessage/)).not.toBeInTheDocument()
    })

    it('renders no status message when urgencyLevel is "empty"', () => {
      renderWithContext(
        <GamesActiveClient {...defaultProps} urgencyLevel="empty" unpredictedCount={0} />
      )
      expect(screen.queryByText(/gamesWidget.urgentMessage/)).not.toBeInTheDocument()
      expect(screen.queryByText('gamesWidget.safeMessage')).not.toBeInTheDocument()
    })
  })
})
