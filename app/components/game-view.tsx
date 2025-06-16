'use client'

import {ChangeEvent, useContext, useEffect, useState} from "react";
import {calculateScoreForGame} from "../utils/game-score-calculator";
import {ExtendedGameData} from "../definitions";
import {Game, Team} from "../db/tables-definition";
import {GuessesContext} from "./context-providers/guesses-context-provider";
import {getTeamDescription} from "../utils/playoffs-rule-helper";
import CompactGameViewCard from "./compact-game-view-card";
import {calculateTeamNamesForPlayoffGame} from "../utils/playoff-teams-calculator";

type GameViewProps = {
  game: ExtendedGameData,
  teamsMap: {[k:string]: Team}
  handleEditClick: (gameNumber: number) => void
  disabled?: boolean
}

const buildGameGuess = (game: Game) => ({
  game_id: game.id,
  game_number: game.game_number,
  user_id: '',//TODO: Fix this!!!
  home_score: undefined,
  away_score: undefined,
  home_penalty_winner: false,
  away_penalty_winner: false
})

const GameView = ({game, teamsMap, handleEditClick, disabled = false}: GameViewProps) => {
  const isPlayoffGame = (!!game.playoffStage);
  const groupContext = useContext(GuessesContext)
  const gameGuesses = groupContext.gameGuesses
  const gameGuess = gameGuesses[game.id] || buildGameGuess(game)
  // May fix issues with the game number not being set in the game guess
  if(!gameGuess.game_number) gameGuess.game_number = game.game_number
  if(!gameGuess.game_id) gameGuess.game_id = game.id

  const ONE_HOUR = 60 * 60 * 1000
  const editDisabled = (Date.now() + ONE_HOUR > game.game_date.getTime()) || disabled
  const scoreForGame = calculateScoreForGame(game, gameGuess)
  const homeTeam = game.home_team || gameGuess.home_team
  const awayTeam = game.away_team || gameGuess.away_team

  return (
    <CompactGameViewCard
        isGameGuess={true}
        isGameFixture={false}
        gameNumber={game.game_number}
        gameDate={game.game_date}
        location={game.location}
        gameTimezone={game.game_local_timezone}
        scoreForGame={scoreForGame}
        isPlayoffGame={isPlayoffGame}
        homeTeamNameOrDescription={homeTeam ? teamsMap[homeTeam].name : getTeamDescription(game.home_team_rule)}
        homeTeamShortNameOrDescription={homeTeam ? teamsMap[homeTeam].short_name : getTeamDescription(game.home_team_rule, true)}
        homeTeamTheme={homeTeam && teamsMap[homeTeam]?.theme || null}
        homeScore={gameGuess.home_score}
        awayTeamNameOrDescription={awayTeam ? teamsMap[awayTeam].name : getTeamDescription(game.away_team_rule)}
        awayTeamShortNameOrDescription={awayTeam ? teamsMap[awayTeam].short_name : getTeamDescription(game.away_team_rule, true)}
        awayTeamTheme={awayTeam && teamsMap[awayTeam]?.theme || null}
        awayScore={gameGuess.away_score}
        homePenaltyWinner={gameGuess.home_penalty_winner}
        awayPenaltyWinner={gameGuess.away_penalty_winner}
        gameResult={game.gameResult}
        disabled={editDisabled}
        onEditClick={handleEditClick}
    />
  )
}

export default GameView;
