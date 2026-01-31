'use client'

import React, {useCallback, useMemo, useState, useRef, useEffect} from "react";
import {
  Game,
  GameGuessNew,
  TournamentGroupTeamStatsGuessNew,
} from "../../db/tables-definition";
import {calculateGroupPosition} from "../../utils/group-position-calculator";
import {
  updateOrCreateGameGuesses,
  updateOrCreateTournamentGroupTeamGuesses,
  updatePlayoffGameGuesses
} from "../../actions/guesses-actions";
import {groupCompleteReducer} from "../../utils/team-stats-utils";

type GameGuessMap = {[k:string]: GameGuessNew}

interface GuessesContextValue {
  gameGuesses: GameGuessMap;
  guessedPositions: TournamentGroupTeamStatsGuessNew[];
  updateGameGuess: (gameId: string, gameGuess: GameGuessNew, options?: { immediate?: boolean; debounceMs?: number }) => Promise<void>;
  pendingSaves: Set<string>;
  saveErrors: Record<string, string>;
  clearSaveError: (gameId: string) => void;
  flushPendingSave: (gameId: string) => Promise<void>;
}

export const GuessesContext = React.createContext<GuessesContextValue>({
  gameGuesses: {} as GameGuessMap,
  guessedPositions: [] as TournamentGroupTeamStatsGuessNew[],
  updateGameGuess: async (_gameId:string, _gameGuess: GameGuessNew, _options?: { immediate?: boolean; debounceMs?: number }) => {},
  pendingSaves: new Set<string>(),
  saveErrors: {},
  clearSaveError: (_gameId: string) => {},
  flushPendingSave: async (_gameId: string) => {},
})

export interface GuessesContextProviderProps {
  readonly children: React.ReactNode
  readonly gameGuesses: {[k:string]: GameGuessNew}
  readonly groupGames?: Game[],
  readonly guessedPositions?: TournamentGroupTeamStatsGuessNew[]
  readonly sortByGamesBetweenTeams?: boolean
  readonly autoSave?: boolean
}

export function GuessesContextProvider ({children,
                                          gameGuesses: serverGameGuesses,
                                          groupGames,
                                          guessedPositions: serverGuessedPositions,
                                          sortByGamesBetweenTeams,
                                          autoSave = false
                                        }: GuessesContextProviderProps) {
  const [gameGuesses, setGameGuesses] = useState(serverGameGuesses)
  const [guessedPositions, setGuessedPositions] = useState<TournamentGroupTeamStatsGuessNew[]>(serverGuessedPositions || [])

  // New state for debouncing and error handling
  const [pendingSaves, setPendingSaves] = useState<Set<string>>(new Set())
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({})
  const [dirtyGames, setDirtyGames] = useState<Set<string>>(new Set())
  const [lastSavedValues, setLastSavedValues] = useState<Record<string, GameGuessNew>>({})

  // Refs for debouncing and concurrent save protection
  const saveTimeoutRefs = useRef<Record<string, NodeJS.Timeout>>({})
  const saveAbortControllers = useRef<Record<string, AbortController>>({})
  const pendingSavePromises = useRef<Map<string, Promise<void>>>(new Map())

  // CRITICAL FIX: Use ref to always read latest gameGuesses state (avoid stale closure)
  const gameGuessesRef = useRef(gameGuesses)
  useEffect(() => {
    gameGuessesRef.current = gameGuesses
  }, [gameGuesses])

  const autoSaveGameGuesses = useCallback(async () => {
    // Always read from ref to get latest values (avoid stale closure)
    const currentGuesses = gameGuessesRef.current

    // Filter only dirty games that have actually changed
    const dirtyGuessesArray = Array.from(dirtyGames)
      .filter(gameId => {
        const current = currentGuesses[gameId]
        const lastSaved = lastSavedValues[gameId]
        return !lastSaved || JSON.stringify(current) !== JSON.stringify(lastSaved)
      })
      .map(gameId => currentGuesses[gameId])

    if (dirtyGuessesArray.length === 0) return

    // Include updated_at timestamp for optimistic locking
    const guessesWithTimestamp = dirtyGuessesArray.map(g => ({
      ...g,
      updated_at: new Date()
    }))

    await updateOrCreateGameGuesses(guessesWithTimestamp)

    // Update lastSavedValues
    setLastSavedValues(prev => ({
      ...prev,
      ...Object.fromEntries(dirtyGuessesArray.map(g => [g.game_id, g]))
    }))

    // Clear dirty flags for saved games
    setDirtyGames(prev => {
      const next = new Set(prev)
      dirtyGuessesArray.forEach(g => next.delete(g.game_id))
      return next
    })
  }, [dirtyGames, lastSavedValues])

  const updateGameGuess = useCallback(async (
    gameId: string,
    gameGuess: GameGuessNew,
    options?: { immediate?: boolean; debounceMs?: number }
  ) => {
    const { immediate = false, debounceMs = 500 } = options || {}

    // Store previous guess for rollback
    const previousGuess = gameGuesses[gameId]

    // Optimistic update (immediate state change)
    const newGameGuesses = {
      ...gameGuesses,
      [gameId]: gameGuess
    }
    setGameGuesses(newGameGuesses)

    // Mark game as dirty
    setDirtyGames(prev => {
      const next = new Set(prev)
      next.add(gameId)
      return next
    })

    // Clear any existing error for this game
    setSaveErrors(prev => {
      const next = { ...prev }
      delete next[gameId]
      return next
    })

    // Update group positions if needed
    if(groupGames && guessedPositions.length > 1) {
      const user_id = guessedPositions[0].user_id
      const tournament_group_id = guessedPositions[0].tournament_group_id
      const teamIds = guessedPositions.map(position => position.team_id)
      const guessedGroupPositions: TournamentGroupTeamStatsGuessNew[] = calculateGroupPosition(teamIds, groupGames.map(game => ({
        ...game,
        resultOrGuess: newGameGuesses[game.id]
      })),
        sortByGamesBetweenTeams).map((teamStat, index) => {
        return {
          user_id,
          tournament_group_id,
          position: index,
          ...teamStat
        }
      })
      setGuessedPositions(guessedGroupPositions)
      if(autoSave) {
        await updateOrCreateTournamentGroupTeamGuesses(guessedGroupPositions)
        if (groupCompleteReducer(guessedGroupPositions)) {
          // Update playoff game guesses when group is complete
          await updatePlayoffGameGuesses(groupGames[0].tournament_id)
        }
      }
    }

    if (!autoSave) return

    // Clear existing timeout for this game
    if (saveTimeoutRefs.current[gameId]) {
      clearTimeout(saveTimeoutRefs.current[gameId])
      delete saveTimeoutRefs.current[gameId]
    }

    // Abort existing save request for this game
    if (saveAbortControllers.current[gameId]) {
      saveAbortControllers.current[gameId].abort()
      delete saveAbortControllers.current[gameId]
    }

    // Mark as pending save
    setPendingSaves(prev => {
      const next = new Set(prev)
      next.add(gameId)
      return next
    })

    const executeSave = async () => {
      // Check if save already in progress
      if (pendingSavePromises.current.has(gameId)) {
        await pendingSavePromises.current.get(gameId)
        return
      }

      // Create AbortController for this save
      const abortController = new AbortController()
      saveAbortControllers.current[gameId] = abortController

      const savePromise = (async () => {
        try {
          await autoSaveGameGuesses()

          // Success: clear flags
          setPendingSaves(prev => {
            const next = new Set(prev)
            next.delete(gameId)
            return next
          })
        } catch (error: any) {
          if (error.name === 'AbortError') return // Cancelled, not an error

          // Check for conflict (409 status)
          if (error.status === 409 || error.code === 'CONFLICT') {
            // Multi-user conflict detected
            setSaveErrors(prev => ({
              ...prev,
              [gameId]: 'This prediction was updated by another user. Please refresh.'
            }))
            // Don't rollback - let user see conflict message
            setPendingSaves(prev => {
              const next = new Set(prev)
              next.delete(gameId)
              return next
            })
            return
          }

          // Check if retryable error (network/server errors)
          const isRetryable = error.status >= 500 || error.message === 'Network Error'

          if (isRetryable) {
            // Network/server error: rollback
            setGameGuesses(prev => ({
              ...prev,
              [gameId]: previousGuess
            }))

            setSaveErrors(prev => ({
              ...prev,
              [gameId]: 'Network error. Click Retry.'
            }))
          } else {
            // Non-retryable: show error, keep values (might be validation)
            setSaveErrors(prev => ({
              ...prev,
              [gameId]: error.message || 'Failed to save.'
            }))
          }

          setPendingSaves(prev => {
            const next = new Set(prev)
            next.delete(gameId)
            return next
          })
        } finally {
          pendingSavePromises.current.delete(gameId)
          delete saveAbortControllers.current[gameId]
        }
      })()

      pendingSavePromises.current.set(gameId, savePromise)
      await savePromise
    }

    // Debounce or execute immediately
    if (immediate) {
      await executeSave()
    } else {
      const timeout = setTimeout(executeSave, debounceMs)
      saveTimeoutRefs.current[gameId] = timeout
    }
  }, [gameGuesses, autoSave, autoSaveGameGuesses, groupGames, guessedPositions, sortByGamesBetweenTeams])

  // Clear save error for a game
  const clearSaveError = useCallback((gameId: string) => {
    setSaveErrors(prev => {
      const next = { ...prev }
      delete next[gameId]
      return next
    })
  }, [])

  // Flush pending save for a game (wait for completion)
  const flushPendingSave = useCallback(async (gameId: string) => {
    // If there's a timeout, execute immediately
    if (saveTimeoutRefs.current[gameId]) {
      clearTimeout(saveTimeoutRefs.current[gameId])
      delete saveTimeoutRefs.current[gameId]
    }

    // Wait for pending promise if exists
    if (pendingSavePromises.current.has(gameId)) {
      await pendingSavePromises.current.get(gameId)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear timeouts
      Object.values(saveTimeoutRefs.current).forEach(clearTimeout)

      // Abort in-flight requests
      Object.values(saveAbortControllers.current).forEach(c => c.abort())

      // Flush remaining dirty games
      if (dirtyGames.size > 0) {
        const currentGuesses = gameGuessesRef.current
        const dirtyGuessesArray = Array.from(dirtyGames).map(id => currentGuesses[id])
        updateOrCreateGameGuesses(dirtyGuessesArray).catch(() => {
          // Silent fail on unmount
        })
      }
    }
  }, [dirtyGames])

  const context = useMemo(() => ({
    gameGuesses,
    guessedPositions,
    updateGameGuess,
    pendingSaves,
    saveErrors,
    clearSaveError,
    flushPendingSave
  }), [gameGuesses, guessedPositions, updateGameGuess, pendingSaves, saveErrors, clearSaveError, flushPendingSave])

  return (
    <GuessesContext.Provider value={context}>
      {children}
    </GuessesContext.Provider>
  )
}
