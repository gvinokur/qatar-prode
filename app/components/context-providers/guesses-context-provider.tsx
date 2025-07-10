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
import {groupCompleteReducer} from "../../utils/playoff-teams-calculator";

type GameGuessMap = {[k:string]: GameGuessNew}

export const GuessesContext = React.createContext({
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

  const autoSaveGameGuesses = useCallback(async (gameGuesses: GameGuessMap) => {
    await updateOrCreateGameGuesses(Object.values(gameGuesses))
  }, [])

  const updateGameGuess = useCallback(async (gameId:string, gameGuess: GameGuessNew) => {
    const newGameGuesses = {
      ...gameGuesses,
      [gameId]: gameGuess
    }
    setGameGuesses(newGameGuesses)
    if(autoSave) {
      await autoSaveGameGuesses(newGameGuesses)
    }
    if(groupGames && guessedPositions.length >1) {
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
          // Note: If group results are deleted after completion, playoff games may need manual re-evaluation
          await updatePlayoffGameGuesses(groupGames[0].tournament_id)
        }
      }
    }
  }, [gameGuesses, autoSave, autoSaveGameGuesses, groupGames, guessedPositions, sortByGamesBetweenTeams])

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

