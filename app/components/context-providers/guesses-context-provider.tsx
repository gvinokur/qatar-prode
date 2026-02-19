'use client'

import React, {useCallback, useMemo, useState} from "react";
import { useLocale } from 'next-intl';
import { toLocale } from '../../utils/locale-utils';
import {
  GameGuessNew,
} from "../../db/tables-definition";
import {
  updateOrCreateGameGuesses
} from "../../actions/guesses-actions";

type GameGuessMap = {[k:string]: GameGuessNew}

interface BoostCounts {
  silver: { used: number; max: number };
  golden: { used: number; max: number };
}

interface GuessesContextValue {
  gameGuesses: GameGuessMap;
  boostCounts: BoostCounts;
  updateGameGuess: (gameId: string, gameGuess: GameGuessNew) => Promise<void>;
}

export const GuessesContext = React.createContext<GuessesContextValue>({
  gameGuesses: {} as GameGuessMap,
  boostCounts: { silver: { used: 0, max: 0 }, golden: { used: 0, max: 0 } },
  updateGameGuess: async (_gameId:string, _gameGuess: GameGuessNew) => {},
})

export interface GuessesContextProviderProps {
  readonly children: React.ReactNode
  readonly gameGuesses: {[k:string]: GameGuessNew}
  readonly autoSave?: boolean
  readonly tournamentMaxSilver?: number
  readonly tournamentMaxGolden?: number
}

export function GuessesContextProvider ({children,
                                          gameGuesses: serverGameGuesses,
                                          autoSave = false,
                                          tournamentMaxSilver = 0,
                                          tournamentMaxGolden = 0
                                        }: GuessesContextProviderProps) {
  const locale = toLocale(useLocale());
  const [gameGuesses, setGameGuesses] = useState(serverGameGuesses)

  // Calculate boost counts from game guesses
  const boostCounts = useMemo(() => {
    const guesses = Object.values(gameGuesses);
    const silverUsed = guesses.filter(g => g.boost_type === 'silver').length;
    const goldenUsed = guesses.filter(g => g.boost_type === 'golden').length;

    return {
      silver: { used: silverUsed, max: tournamentMaxSilver },
      golden: { used: goldenUsed, max: tournamentMaxGolden }
    };
  }, [gameGuesses, tournamentMaxSilver, tournamentMaxGolden]);

  const updateGameGuess = useCallback(async (
    gameId: string,
    gameGuess: GameGuessNew
  ) => {
    // Optimistic update
    const newGameGuesses = {
      ...gameGuesses,
      [gameId]: gameGuess
    }
    setGameGuesses(newGameGuesses)

    if (!autoSave) return

    // Save to server
    const result = await updateOrCreateGameGuesses([gameGuess], locale)

    // Check if save failed
    if (result && 'success' in result && !result.success) {
      console.error('[GuessesContext] Save failed:', result.error)
      throw new Error(result.error || 'Failed to save prediction')
    }
  }, [autoSave, gameGuesses, locale])

  const context = useMemo(() => ({
    gameGuesses,
    boostCounts,
    updateGameGuess
  }), [gameGuesses, boostCounts, updateGameGuess])

  return (
    <GuessesContext.Provider value={context}>
      {children}
    </GuessesContext.Provider>
  )
}
