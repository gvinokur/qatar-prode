'use client'

import React, {useState} from "react";
import {GameGuessNew, TournamentGuessNew} from "../../db/tables-definition";
import {getGuessLoser, getGuessWinner} from "../../utils/score-utils";

type GameGuessMap = {[k:string]: GameGuessNew}

export const GuessesContext = React.createContext({
  gameGuesses: {} as GameGuessMap,
  tournamentGuesses: {} as TournamentGuessNew | undefined,
  updateGameGuess: (gameId:string, gameGuess: GameGuessNew, isFinal?: boolean, isThirdPlace?: boolean) => {},
})

interface GroupContextProviderProps {
  children: React.ReactNode
  gameGuesses: {[k:string]: GameGuessNew}
  tournamentGuesses?: TournamentGuessNew
  tournamentStartDate?: Date
}

export function GuessesContextProvider ({children,
                                          gameGuesses: serverGameGuesses,
                                          tournamentGuesses: serverTournamentGuesses,
                                          tournamentStartDate,
                                        }: GroupContextProviderProps) {
  const [gameGuesses, setGameGuesses] = useState(serverGameGuesses)
  const [tournamentGuesses, setTournamentGuesses] = useState(serverTournamentGuesses)

  //TODO: Recalculate teams

  const context = {
    gameGuesses,
    tournamentGuesses,
    updateGameGuess: (gameId:string, gameGuess: GameGuessNew, isFinal?:boolean, isThirdPlace?:boolean) => {
      setGameGuesses({
        ...gameGuesses,
        [gameId]: gameGuess
      })
      if(tournamentGuesses && tournamentStartDate && tournamentStartDate.getTime() > Date.now()) {
        if (isFinal) {
          const championTeamId = getGuessWinner(gameGuess, gameGuess.home_team, gameGuess.away_team)
          const runnerUpTeamId = getGuessLoser(gameGuess, gameGuess.home_team, gameGuess.away_team)
          //Ensure we override also when null
          const {champion_team_id, runner_up_team_id, ...restOfTournamentGuess} = tournamentGuesses
          setTournamentGuesses({
            ...restOfTournamentGuess,
            champion_team_id: championTeamId,
            runner_up_team_id: runnerUpTeamId,
          })
        } else if (isThirdPlace) {
          const thirPlaceId = getGuessWinner(gameGuess, gameGuess.home_team, gameGuess.away_team)
          //Ensure we override also when null
          const {third_place_team_id, ...restOfTournamentGuess} = tournamentGuesses
          setTournamentGuesses({
            ...restOfTournamentGuess,
            third_place_team_id: thirPlaceId,
          })
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

