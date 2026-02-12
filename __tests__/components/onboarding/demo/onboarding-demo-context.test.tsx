import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import {
  MockGuessesContextProvider,
  MockQualifiedTeamsContextProvider,
  useMockQualifiedTeamsContext,
} from '@/app/components/onboarding/demo/onboarding-demo-context'
import { GuessesContext } from '@/app/components/context-providers/guesses-context-provider'
import { useContext } from 'react'
import type { GameGuessNew } from '@/app/db/tables-definition'

describe('MockGuessesContextProvider', () => {
  it('provides initial game guesses from demo data', () => {
    const { result } = renderHook(() => useContext(GuessesContext), {
      wrapper: MockGuessesContextProvider,
    })

    expect(result.current.gameGuesses).toBeDefined()
    expect(result.current.gameGuesses['game-1']).toBeDefined()
    expect(result.current.gameGuesses['game-1'].home_score).toBe(2)
    expect(result.current.gameGuesses['game-1'].away_score).toBe(1)
    expect(result.current.gameGuesses['game-1'].boost_type).toBe('silver')
  })

  it('updates game guess and merges with existing data', async () => {
    const { result } = renderHook(() => useContext(GuessesContext), {
      wrapper: MockGuessesContextProvider,
    })

    const newGuess: GameGuessNew = {
      game_id: 'game-1',
      game_number: 1,
      home_score: 3,
      away_score: 2,
      boost_type: 'golden',
    }

    await act(async () => {
      await result.current.updateGameGuess('game-1', newGuess)
    })

    await waitFor(() => {
      expect(result.current.gameGuesses['game-1'].home_score).toBe(3)
      expect(result.current.gameGuesses['game-1'].away_score).toBe(2)
      expect(result.current.gameGuesses['game-1'].boost_type).toBe('golden')
      // Verify existing fields are preserved
      expect(result.current.gameGuesses['game-1'].id).toBe('guess-1')
      expect(result.current.gameGuesses['game-1'].user_id).toBe('demo-user')
    })
  })

  it('updates penalty winner fields correctly', async () => {
    const { result } = renderHook(() => useContext(GuessesContext), {
      wrapper: MockGuessesContextProvider,
    })

    const newGuess: GameGuessNew = {
      game_id: 'game-2',
      game_number: 2,
      home_score: 1,
      away_score: 1,
      home_penalty_winner: true,
      away_penalty_winner: false,
      boost_type: null,
    }

    await act(async () => {
      await result.current.updateGameGuess('game-2', newGuess)
    })

    await waitFor(() => {
      expect(result.current.gameGuesses['game-2'].home_penalty_winner).toBe(true)
      expect(result.current.gameGuesses['game-2'].away_penalty_winner).toBe(false)
    })
  })

  it('simulates async behavior with delay', async () => {
    const { result } = renderHook(() => useContext(GuessesContext), {
      wrapper: MockGuessesContextProvider,
    })

    const startTime = Date.now()

    await act(async () => {
      await result.current.updateGameGuess('game-1', {
        game_id: 'game-1',
        game_number: 1,
        home_score: 5,
        away_score: 5,
      })
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    // Should take at least 300ms (simulated async delay)
    expect(duration).toBeGreaterThanOrEqual(250)
  })
})

describe('MockQualifiedTeamsContextProvider', () => {
  it('provides initial predictions from demo data', () => {
    const { result } = renderHook(() => useMockQualifiedTeamsContext(), {
      wrapper: MockQualifiedTeamsContextProvider,
    })

    expect(result.current.predictions).toBeDefined()
    expect(result.current.predictions.size).toBeGreaterThan(0)
    expect(result.current.predictions.get('group-a-team-1')).toBeDefined()
    expect(result.current.predictions.get('group-a-team-1')?.predicted_position).toBe(1)
    expect(result.current.predictions.get('group-a-team-1')?.predicted_to_qualify).toBe(true)
  })

  it('updates group positions correctly', async () => {
    const { result } = renderHook(() => useMockQualifiedTeamsContext(), {
      wrapper: MockQualifiedTeamsContextProvider,
    })

    const updates = [
      { teamId: 'team-1', position: 2, qualifies: true },
      { teamId: 'team-2', position: 1, qualifies: true },
    ]

    await act(async () => {
      await result.current.updateGroupPositions('group-a', updates)
    })

    await waitFor(() => {
      expect(result.current.predictions.get('group-a-team-1')?.predicted_position).toBe(2)
      expect(result.current.predictions.get('group-a-team-2')?.predicted_position).toBe(1)
    })
  })

  it('initializes with idle save state', () => {
    const { result } = renderHook(() => useMockQualifiedTeamsContext(), {
      wrapper: MockQualifiedTeamsContextProvider,
    })

    expect(result.current.saveState).toBe('idle')
    expect(result.current.isSaving).toBe(false)
    expect(result.current.lastSaved).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('transitions to saved state after update', async () => {
    const { result } = renderHook(() => useMockQualifiedTeamsContext(), {
      wrapper: MockQualifiedTeamsContextProvider,
    })

    await act(async () => {
      await result.current.updateGroupPositions('group-a', [
        { teamId: 'team-1', position: 1, qualifies: true },
      ])
    })

    // Should eventually transition to saved
    await waitFor(
      () => {
        expect(result.current.saveState).toBe('saved')
        expect(result.current.lastSaved).toBeInstanceOf(Date)
      },
      { timeout: 1000 }
    )
  })

  it('provides clearError function', () => {
    const { result } = renderHook(() => useMockQualifiedTeamsContext(), {
      wrapper: MockQualifiedTeamsContextProvider,
    })

    expect(typeof result.current.clearError).toBe('function')
  })
})
