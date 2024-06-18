'use client'

import React, {useState} from "react";
import {
  Game,
  GameGuessNew,
  TournamentGroupTeam,
  TournamentGroupTeamStatsGuess, TournamentGroupTeamStatsGuessNew,
  TournamentGuessNew
} from "../../db/tables-definition";
import {getGuessLoser, getGuessWinner} from "../../utils/score-utils";
import {calculateGroupPosition} from "../../utils/group-position-calculator";

type GameGuessMap = {[k:string]: GameGuessNew}

export const GuessesContext = React.createContext({
  gameGuesses: {} as GameGuessMap,
  tournamentGuesses: {} as TournamentGuessNew | undefined,
  guessedPositions: [] as TournamentGroupTeamStatsGuessNew[],
  updateGameGuess: (gameId:string, gameGuess: GameGuessNew, isFinal?: boolean, isThirdPlace?: boolean) => {},
})

export interface GuessesContextProviderProps {
  children: React.ReactNode
  gameGuesses: {[k:string]: GameGuessNew}
  tournamentGuesses?: TournamentGuessNew
  tournamentStartDate?: Date
  groupGames?: Game[],
  guessedPositions?: TournamentGroupTeamStatsGuessNew[]
}

export function GuessesContextProvider ({children,
                                          gameGuesses: serverGameGuesses,
                                          tournamentGuesses: serverTournamentGuesses,
                                          tournamentStartDate,
                                          groupGames,
                                          guessedPositions: serverGuessedPositions
                                        }: GuessesContextProviderProps) {
  const [gameGuesses, setGameGuesses] = useState(serverGameGuesses)
  const [tournamentGuesses, setTournamentGuesses] = useState(serverTournamentGuesses)
  const [guessedPositions, setGuessedPositions] = useState<TournamentGroupTeamStatsGuessNew[]>(serverGuessedPositions || [])

  //TODO: Recalculate teams

  const context = {
    gameGuesses,
    tournamentGuesses,
    guessedPositions,
    updateGameGuess: (gameId:string, gameGuess: GameGuessNew, isFinal?:boolean, isThirdPlace?:boolean) => {
      const newGameGuesses = {
        ...gameGuesses,
        [gameId]: gameGuess
      }
      setGameGuesses(newGameGuesses)
      if(groupGames && guessedPositions.length >1) {
        const user_id = guessedPositions[0].user_id
        const tournament_group_id = guessedPositions[0].tournament_group_id
        const teamIds = guessedPositions.map(position => position.team_id)
        const guessedGroupPositions: TournamentGroupTeamStatsGuessNew[] = calculateGroupPosition(teamIds, groupGames.map(game => ({
          ...game,
          resultOrGuess: newGameGuesses[game.id]
        }))).map((teamStat, index) => {
          return {
            user_id,
            tournament_group_id,
            position: index,
            ...teamStat
          }
        })
        setGuessedPositions(guessedGroupPositions)
      }
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

