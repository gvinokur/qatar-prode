'use client'

import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import { useLocale } from 'next-intl';
import { toLocale } from '../../utils/locale-utils';
import {
  GameGuessNew,
} from "../../db/tables-definition";
import {
  updateOrCreateGameGuesses
} from "../../actions/guesses-actions";
import { trackEvent } from '@/app/utils/ga4';

type GameGuessMap = {[k:string]: GameGuessNew}

interface BoostCounts {
  silver: { used: number; max: number };
  golden: { used: number; max: number };
}

interface GuessesContextValue {
  gameGuesses: GameGuessMap;
  boostCounts: BoostCounts;
  updateGameGuess: (gameId: string, gameGuess: GameGuessNew) => Promise<void>;
  bulkSetGameGuesses: (guesses: GameGuessNew[]) => void;
}

export const GuessesContext = React.createContext<GuessesContextValue>({
  gameGuesses: {} as GameGuessMap,
  boostCounts: { silver: { used: 0, max: 0 }, golden: { used: 0, max: 0 } },
  updateGameGuess: async (_gameId:string, _gameGuess: GameGuessNew) => {},
  bulkSetGameGuesses: (_guesses: GameGuessNew[]) => {},
})

export interface GuessesContextProviderProps {
  readonly children: React.ReactNode
  readonly gameGuesses: {[k:string]: GameGuessNew}
  readonly autoSave?: boolean
  readonly tournamentMaxSilver?: number
  readonly tournamentMaxGolden?: number
  /**
   * Tournament-wide count of silver boosts already applied across ALL games (not just the
   * carousel window). When provided, boost usage is computed as this baseline plus any
   * changes made to carousel games during the current session (delta tracking). Resets on
   * remount (key change) alongside the carousel data refetch.
   */
  readonly tournamentSilverUsed?: number
  /**
   * Tournament-wide count of golden boosts already applied across ALL games (not just the
   * carousel window). Same delta-tracking semantics as tournamentSilverUsed.
   */
  readonly tournamentGoldenUsed?: number
}

export function GuessesContextProvider ({children,
                                          gameGuesses: serverGameGuesses,
                                          autoSave = false,
                                          tournamentMaxSilver = 0,
                                          tournamentMaxGolden = 0,
                                          tournamentSilverUsed,
                                          tournamentGoldenUsed,
                                        }: GuessesContextProviderProps) {
  const locale = toLocale(useLocale());
  const [gameGuesses, setGameGuesses] = useState(serverGameGuesses)

  // Snapshot initial carousel boost counts for delta tracking.
  // Resets automatically on component remount (key change after carousel refetch).
  const initialCarouselBoostsRef = useRef({
    silver: Object.values(serverGameGuesses).filter(g => g.boost_type === 'silver').length,
    golden: Object.values(serverGameGuesses).filter(g => g.boost_type === 'golden').length,
  })

  // Sync state with server-provided guesses when they change (e.g., after router.refresh() or
  // soft navigation). This is needed because useState only initializes once — subsequent prop
  // changes (new fallback games with their guesses, or deleted guesses after navigation) are
  // ignored without this effect.
  useEffect(() => {
    setGameGuesses(serverGameGuesses)
  }, [serverGameGuesses])

  // Calculate boost counts from game guesses.
  // When tournament-wide baseline counts are provided (tournamentSilverUsed/tournamentGoldenUsed),
  // use them plus a delta from this carousel session to get the correct tournament-wide total.
  // This prevents wrong counts when the user has boosts on games outside the carousel window.
  // Falls back to counting from local carousel guesses only when no baseline is provided.
  const boostCounts = useMemo(() => {
    const guesses = Object.values(gameGuesses);
    const currentCarouselSilver = guesses.filter(g => g.boost_type === 'silver').length;
    const currentCarouselGolden = guesses.filter(g => g.boost_type === 'golden').length;

    const silverUsed = tournamentSilverUsed !== undefined
      ? tournamentSilverUsed + (currentCarouselSilver - initialCarouselBoostsRef.current.silver)
      : currentCarouselSilver;
    const goldenUsed = tournamentGoldenUsed !== undefined
      ? tournamentGoldenUsed + (currentCarouselGolden - initialCarouselBoostsRef.current.golden)
      : currentCarouselGolden;

    return {
      silver: { used: silverUsed, max: tournamentMaxSilver },
      golden: { used: goldenUsed, max: tournamentMaxGolden }
    };
  }, [gameGuesses, tournamentMaxSilver, tournamentMaxGolden, tournamentSilverUsed, tournamentGoldenUsed]);

  const bulkSetGameGuesses = useCallback((guesses: GameGuessNew[]) => {
    setGameGuesses(prev => {
      const updated = { ...prev };
      for (const g of guesses) updated[g.game_id] = g;
      return updated;
    });
  }, []);

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

    if (result && result.success && result.analyticsEvent) {
      trackEvent(result.analyticsEvent.name, result.analyticsEvent.params);
    }
  }, [autoSave, gameGuesses, locale])

  const context = useMemo(() => ({
    gameGuesses,
    boostCounts,
    updateGameGuess,
    bulkSetGameGuesses
  }), [gameGuesses, boostCounts, updateGameGuess, bulkSetGameGuesses])

  return (
    <GuessesContext.Provider value={context}>
      {children}
    </GuessesContext.Provider>
  )
}
