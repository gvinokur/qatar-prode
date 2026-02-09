'use client'

import React, {useCallback, useMemo, useState} from "react";
import {
  Game,
  GameGuessNew,
} from "../../db/tables-definition";
import {
  updateOrCreateGameGuesses,
  updatePlayoffGameGuesses
} from "../../actions/guesses-actions";

type GameGuessMap = {[k:string]: GameGuessNew}

interface GuessesContextValue {
  gameGuesses: GameGuessMap;
  updateGameGuess: (gameId: string, gameGuess: GameGuessNew) => Promise<void>;
}

export const GuessesContext = React.createContext<GuessesContextValue>({
  gameGuesses: {} as GameGuessMap,
  updateGameGuess: async (_gameId:string, _gameGuess: GameGuessNew) => {},
})

export interface GuessesContextProviderProps {
  readonly children: React.ReactNode
  readonly gameGuesses: {[k:string]: GameGuessNew}
  readonly groupGames?: Game[],
  readonly sortByGamesBetweenTeams?: boolean
  readonly autoSave?: boolean
}

export function GuessesContextProvider ({children,
                                          gameGuesses: serverGameGuesses,
                                          groupGames,
                                          sortByGamesBetweenTeams,
                                          autoSave = false
                                        }: GuessesContextProviderProps) {
  const [gameGuesses, setGameGuesses] = useState(serverGameGuesses)

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
    const result = await updateOrCreateGameGuesses([gameGuess])

    // Check if save failed
    if (result && 'success' in result && !result.success) {
      console.error('[GuessesContext] Save failed:', result.error)
      throw new Error(result.error || 'Failed to save prediction')
    }

    // Update playoff game guesses when all group games are guessed
    if (groupGames) {
      const allGamesGuessed = groupGames.every(game => newGameGuesses[game.id])
      if (allGamesGuessed) {
        await updatePlayoffGameGuesses(groupGames[0].tournament_id)
      }
    }
  }, [autoSave, gameGuesses, groupGames])

  const context = useMemo(() => ({
    gameGuesses,
    updateGameGuess
  }), [gameGuesses, updateGameGuess])

  return (
    <GuessesContext.Provider value={context}>
      {children}
    </GuessesContext.Provider>
  )
}
