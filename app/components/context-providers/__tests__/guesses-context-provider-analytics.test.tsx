import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { GuessesContextProvider, GuessesContext } from '../guesses-context-provider'
import type { GameGuessNew } from '../../../db/tables-definition'

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: vi.fn().mockReturnValue('en'),
}))

// Mock guesses-actions
vi.mock('../../../actions/guesses-actions', () => ({
  updateOrCreateGameGuesses: vi.fn(),
}))

// Mock GA4
vi.mock('@/app/utils/ga4', () => ({
  trackEvent: vi.fn(),
}))

import { updateOrCreateGameGuesses } from '../../../actions/guesses-actions'
import { trackEvent } from '@/app/utils/ga4'

// Test component that uses the GuessesContext
function TestComponent({ onUpdateComplete }: { onUpdateComplete?: () => void }) {
  return (
    <GuessesContext.Consumer>
      {(context) => (
        <button
          data-testid="update-guess"
          onClick={async () => {
            try {
              await context.updateGameGuess('game-1', {
                game_id: 'game-1',
                user_id: 'user-1',
                home_score: 1,
                away_score: 0,
                home_boost: false,
                away_boost: false,
                boost_type: null,
              })
              onUpdateComplete?.()
            } catch {
              // error is expected in failure scenarios — let each test assert trackEvent/completion
            }
          }}
        >
          Update Guess
        </button>
      )}
    </GuessesContext.Consumer>
  )
}

describe('GuessesContextProvider - Analytics Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('calls trackEvent when updateOrCreateGameGuesses returns analyticsEvent', async () => {
    const analyticsEvent = {
      name: 'prediction_submitted',
      params: { number_of_guesses: 1, game_ids: ['game-1'] },
    }

    vi.mocked(updateOrCreateGameGuesses).mockResolvedValue({
      success: true,
      analyticsEvent,
    })

    let updateComplete = false

    const { getByTestId } = render(
      <GuessesContextProvider
        gameGuesses={{}}
        autoSave={true}
      >
        <TestComponent onUpdateComplete={() => { updateComplete = true }} />
      </GuessesContextProvider>
    )

    const button = getByTestId('update-guess')
    button.click()

    await waitFor(() => {
      expect(updateComplete).toBe(true)
    })

    expect(trackEvent).toHaveBeenCalledWith('prediction_submitted', {
      number_of_guesses: 1,
      game_ids: ['game-1'],
    })
    expect(trackEvent).toHaveBeenCalledTimes(1)
  })

  it('does NOT call trackEvent when updateOrCreateGameGuesses returns success: false', async () => {
    vi.mocked(updateOrCreateGameGuesses).mockResolvedValue({
      success: false,
      error: 'Failed to save prediction',
    })

    let updateComplete = false
    let errorThrown = false

    const { getByTestId } = render(
      <GuessesContextProvider
        gameGuesses={{}}
        autoSave={true}
      >
        <TestComponent onUpdateComplete={() => { updateComplete = true }} />
      </GuessesContextProvider>
    )

    const button = getByTestId('update-guess')
    button.click()

    // Wait for the action to be called, then verify trackEvent was not called
    await waitFor(() => {
      expect(updateOrCreateGameGuesses).toHaveBeenCalled()
    })

    expect(trackEvent).not.toHaveBeenCalled()
  })

  it('does NOT call trackEvent when updateOrCreateGameGuesses returns success: true without analyticsEvent', async () => {
    vi.mocked(updateOrCreateGameGuesses).mockResolvedValue({
      success: true,
    })

    let updateComplete = false

    const { getByTestId } = render(
      <GuessesContextProvider
        gameGuesses={{}}
        autoSave={true}
      >
        <TestComponent onUpdateComplete={() => { updateComplete = true }} />
      </GuessesContextProvider>
    )

    const button = getByTestId('update-guess')
    button.click()

    await waitFor(() => {
      expect(updateComplete).toBe(true)
    })

    expect(trackEvent).not.toHaveBeenCalled()
  })

  it('does NOT call trackEvent when autoSave is false', async () => {
    vi.mocked(updateOrCreateGameGuesses).mockResolvedValue({
      success: true,
      analyticsEvent: {
        name: 'prediction_submitted',
        params: { number_of_guesses: 1, game_ids: ['game-1'] },
      },
    })

    let updateComplete = false

    const { getByTestId } = render(
      <GuessesContextProvider
        gameGuesses={{}}
        autoSave={false}
      >
        <TestComponent onUpdateComplete={() => { updateComplete = true }} />
      </GuessesContextProvider>
    )

    const button = getByTestId('update-guess')
    button.click()

    await waitFor(() => {
      expect(updateComplete).toBe(true)
    })

    // When autoSave is false, updateOrCreateGameGuesses is not called
    expect(updateOrCreateGameGuesses).not.toHaveBeenCalled()
    expect(trackEvent).not.toHaveBeenCalled()
  })

  it('passes correct locale to updateOrCreateGameGuesses', async () => {
    vi.mocked(updateOrCreateGameGuesses).mockResolvedValue({
      success: true,
      analyticsEvent: {
        name: 'prediction_submitted',
        params: { number_of_guesses: 1, game_ids: ['game-1'] },
      },
    })

    let updateComplete = false

    const { getByTestId } = render(
      <GuessesContextProvider
        gameGuesses={{}}
        autoSave={true}
      >
        <TestComponent onUpdateComplete={() => { updateComplete = true }} />
      </GuessesContextProvider>
    )

    const button = getByTestId('update-guess')
    button.click()

    await waitFor(() => {
      expect(updateComplete).toBe(true)
    })

    // Verify updateOrCreateGameGuesses was called with correct arguments
    expect(updateOrCreateGameGuesses).toHaveBeenCalledWith(
      expect.any(Array),
      'en' // locale from useLocale mock
    )
  })
})

describe('GuessesContextProvider - Server props sync', () => {
  function GuessCountDisplay() {
    return (
      <GuessesContext.Consumer>
        {({ gameGuesses }) => (
          <span data-testid="guess-count">{Object.keys(gameGuesses).length}</span>
        )}
      </GuessesContext.Consumer>
    )
  }

  function GuessScoreDisplay({ gameId }: { gameId: string }) {
    return (
      <GuessesContext.Consumer>
        {({ gameGuesses }) => {
          const g = gameGuesses[gameId]
          return <span data-testid="home-score">{g?.home_score ?? 'none'}</span>
        }}
      </GuessesContext.Consumer>
    )
  }

  const makeGuess = (gameId: string, homeScore: number, awayScore: number): GameGuessNew => ({
    game_id: gameId,
    user_id: 'u-1',
    game_number: 1,
    home_score: homeScore,
    away_score: awayScore,
    home_penalty_winner: false,
    away_penalty_winner: false,
    boost_type: null,
  } as any)

  it('updates state when serverGameGuesses prop changes to include new games (simulates router.refresh)', async () => {
    const { rerender } = render(
      <GuessesContextProvider gameGuesses={{}}>
        <GuessCountDisplay />
      </GuessesContextProvider>
    )
    expect(screen.getByTestId('guess-count').textContent).toBe('0')

    rerender(
      <GuessesContextProvider gameGuesses={{ 'game-4': makeGuess('game-4', 1, 0) }}>
        <GuessCountDisplay />
      </GuessesContextProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('guess-count').textContent).toBe('1')
    })
  })

  it('clears stale client state when server reports a deleted guess (simulates navigation after deletion)', async () => {
    const initialGuesses = { 'game-1': makeGuess('game-1', 2, 1) }

    const { rerender } = render(
      <GuessesContextProvider gameGuesses={initialGuesses}>
        <GuessScoreDisplay gameId="game-1" />
      </GuessesContextProvider>
    )
    expect(screen.getByTestId('home-score').textContent).toBe('2')

    // Server re-renders with empty guesses (guess was deleted elsewhere)
    rerender(
      <GuessesContextProvider gameGuesses={{}}>
        <GuessScoreDisplay gameId="game-1" />
      </GuessesContextProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('home-score').textContent).toBe('none')
    })
  })
})
