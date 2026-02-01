'use client'

import React, {useCallback, useMemo, useState} from "react";
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
  updateGameGuess: (gameId: string, gameGuess: GameGuessNew) => Promise<void>;
}

export const GuessesContext = React.createContext<GuessesContextValue>({
  gameGuesses: {} as GameGuessMap,
  guessedPositions: [] as TournamentGroupTeamStatsGuessNew[],
  updateGameGuess: async (_gameId:string, _gameGuess: GameGuessNew) => {},
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

    // Save to server
    const result = await updateOrCreateGameGuesses([gameGuess])

    // Check if save failed
    if (result && 'success' in result && !result.success) {
      console.error('[GuessesContext] Save failed:', result.error)
      throw new Error(result.error || 'Failed to save prediction')
    }
  }, [autoSave, gameGuesses, groupGames, guessedPositions, sortByGamesBetweenTeams])

  const context = useMemo(() => ({
    gameGuesses,
    guessedPositions,
    updateGameGuess
  }), [gameGuesses, guessedPositions, updateGameGuess])

  return (
    <GuessesContext.Provider value={context}>
      {children}
    </GuessesContext.Provider>
  )
}
