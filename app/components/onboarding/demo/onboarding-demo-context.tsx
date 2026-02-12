'use client'

/**
 * Mock context providers for onboarding demos
 * These provide the same interfaces as actual contexts but use local state only (no server actions)
 */

import React, { createContext, useContext, useCallback, useState, useMemo } from 'react'
import type { GameGuessNew, QualifiedTeamPrediction } from '@/app/db/tables-definition'
import { GuessesContext } from '@/app/components/context-providers/guesses-context-provider'
import {
  DEMO_GAME_GUESSES,
  DEMO_QUALIFIED_PREDICTIONS,
} from './demo-data'

// Re-export types from actual contexts for consistency
type GameGuessMap = { [k: string]: GameGuessNew }
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

/**
 * MockGuessesContextProvider
 *
 * Provides same interface as GuessesContext but with local state only.
 * No server actions, all updates stay in memory.
 */
export interface MockGuessesContextProviderProps {
  readonly children: React.ReactNode
}

export function MockGuessesContextProvider({ children }: MockGuessesContextProviderProps) {
  const [gameGuesses, setGameGuesses] = useState<GameGuessMap>(DEMO_GAME_GUESSES)

  const updateGameGuess = useCallback(
    async (gameId: string, gameGuess: GameGuessNew) => {
      // Optimistic update - local state only
      // Merge new values with existing guess to preserve all fields
      const newGameGuesses = {
        ...gameGuesses,
        [gameId]: {
          ...gameGuesses[gameId],
          ...gameGuess,
        },
      }
      setGameGuesses(newGameGuesses)

      // Simulate async for realistic behavior
      await new Promise((resolve) => setTimeout(resolve, 300))

      // No server action - just local state update
    },
    [gameGuesses]
  )

  const context = useMemo(
    () => ({
      gameGuesses,
      updateGameGuess,
    }),
    [gameGuesses, updateGameGuess]
  )

  return <GuessesContext.Provider value={context}>{children}</GuessesContext.Provider>
}

/**
 * MockQualifiedTeamsContextProvider
 *
 * Provides same interface as QualifiedTeamsContext but with local state only.
 * Includes save state machine for realistic UI behavior.
 */

interface QualifiedTeamsContextValue {
  predictions: Map<string, QualifiedTeamPrediction>
  saveState: SaveState
  isSaving: boolean
  lastSaved: Date | null
  error: string | null
  updateGroupPositions: (
    groupId: string,
    _updates: Array<{ teamId: string; position: number; qualifies: boolean }>
  ) => Promise<void>
  clearError: () => void
}

const MockQualifiedTeamsContext = createContext<QualifiedTeamsContextValue | undefined>(
  undefined
)

export interface MockQualifiedTeamsContextProviderProps {
  readonly children: React.ReactNode
}

export function useMockQualifiedTeamsContext() {
  const context = useContext(MockQualifiedTeamsContext)
  if (!context) {
    throw new Error(
      'useMockQualifiedTeamsContext must be used within MockQualifiedTeamsContextProvider'
    )
  }
  return context
}

export function MockQualifiedTeamsContextProvider({
  children,
}: MockQualifiedTeamsContextProviderProps) {
  const [predictions, setPredictions] = useState<Map<string, QualifiedTeamPrediction>>(
    DEMO_QUALIFIED_PREDICTIONS
  )
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const updateGroupPositions = useCallback(
    async (
      groupId: string,
      _updates: Array<{ teamId: string; position: number; qualifies: boolean }>
    ) => {
      // Prevent changes while saving
      if (saveState === 'saving') return

      // Optimistic update: Apply changes immediately to UI
      setPredictions((prev) => {
        const newPredictions = new Map(prev)

        _updates.forEach(({ teamId, position, qualifies }) => {
          // Use proper Map key format: groupId-teamId
          const mapKey = `${groupId}-${teamId}`
          const prediction = prev.get(mapKey)
          if (prediction) {
            newPredictions.set(mapKey, {
              ...prediction,
              predicted_position: position,
              predicted_to_qualify: qualifies,
              updated_at: new Date(),
            })
          }
        })

        return newPredictions
      })

      // Simulate save state machine
      setSaveState('saving')
      setError(null)

      // Simulate async save with 500ms delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Simulate successful save
      setSaveState('saved')
      setLastSaved(new Date())

      // Auto-return to idle after 2 seconds
      setTimeout(() => {
        setSaveState((prev) => (prev === 'saved' ? 'idle' : prev))
      }, 2000)

      // No server action - just local state update
    },
    [saveState]
  )

  const clearError = useCallback(() => {
    setError(null)
    setSaveState('idle')
  }, [])

  const context = useMemo(
    () => ({
      predictions,
      saveState,
      isSaving: saveState === 'saving',
      lastSaved,
      error,
      updateGroupPositions,
      clearError,
    }),
    [predictions, saveState, lastSaved, error, updateGroupPositions, clearError]
  )

  return (
    <MockQualifiedTeamsContext.Provider value={context}>
      {children}
    </MockQualifiedTeamsContext.Provider>
  )
}
