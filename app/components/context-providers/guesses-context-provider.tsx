'use client'

import React, {useCallback, useState} from "react";
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
  updateGameGuess: async (gameId:string, gameGuess: GameGuessNew) => {},
})

export interface GuessesContextProviderProps {
  children: React.ReactNode
  gameGuesses: {[k:string]: GameGuessNew}
  groupGames?: Game[],
  guessedPositions?: TournamentGroupTeamStatsGuessNew[]
  sortByGamesBetweenTeams?: boolean
  autoSave?: boolean
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

  const context = {
    gameGuesses,
    guessedPositions,
    updateGameGuess: async (gameId:string, gameGuess: GameGuessNew) => {
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
            //TODO: this does not handle well the case where the group was complete and some result has been deleted
            await updatePlayoffGameGuesses(groupGames[0].tournament_id)
          }
        }
      }
    }
  }

  return (
    <GuessesContext.Provider value={context}>
      {children}
    </GuessesContext.Provider>
  )
}

