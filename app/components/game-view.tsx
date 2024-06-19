'use client'

import {
  useMediaQuery,
  useTheme,
} from "@mui/material";

import {Done as HitIcon, DoneAll as HitAllIcon, Close as MissIcon} from "@mui/icons-material";
import {ChangeEvent, useContext, useEffect, useState} from "react";
import {calculateScoreForGame} from "../utils/game-score-calculator";
import {getDateString} from "../../utils/date-utils";
import {ExtendedGameData} from "../definitions";
import {Game, GroupFinishRule, PlayoffRound, Team, TeamWinnerRule} from "../db/tables-definition";
import {GuessesContext} from "./context-providers/guesses-context-provider";
import {getGuessLoser, getGuessWinner} from "../utils/score-utils";
import GameViewCard from "./game-view-card";
import {getTeamDescription, isTeamWinnerRule} from "../utils/playoffs-rule-helper";

type GameViewProps = {
  game: ExtendedGameData,
  teamsMap: {[k:string]: Team}
  isFinal?: boolean
  isThirdPlace?: boolean
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

const GameView = ({game, teamsMap, isFinal, isThirdPlace}: GameViewProps) => {
  const isPlayoffGame = (!!game.playoffStage);
  const groupContext = useContext(GuessesContext)
  const gameGuesses = groupContext.gameGuesses
  const [calculatedHomeTeam, setCalculatedHomeTeam] = useState<string | undefined>()
  const [calculatedAwayTeam, setCalculatedAwayTeam] = useState<string | undefined>()
  const gameGuess = gameGuesses[game.id] || buildGameGuess(game)

  useEffect(()=> {
    /**
     * Recalculate the home and away teams for playoffs of rounds below the first playoff round every time
     * a guess in the playoffs change.
     * Only do this before the games have been played and an actual team exists.
      */

    if (isPlayoffGame && !game.home_team && !game.away_team
      && isTeamWinnerRule(game.home_team_rule) && isTeamWinnerRule(game.away_team_rule)) {
      let homeTeam
      let awayTeam

      const homeTeamRule = game.home_team_rule
      const homeGameGuess = Object.values(gameGuesses)
        .find(guess => guess.game_number === homeTeamRule.game)

      if(homeGameGuess) {
        homeTeam = homeTeamRule.winner ?
          getGuessWinner(homeGameGuess, homeGameGuess?.home_team, homeGameGuess?.away_team) :
          getGuessLoser(homeGameGuess, homeGameGuess?.home_team, homeGameGuess?.away_team)
      }

      const awayTeamRule = game.away_team_rule
      const awayGameGuess = Object.values(gameGuesses)
        .find(guess => guess.game_number === awayTeamRule.game)

      if(awayGameGuess) {
        awayTeam = awayTeamRule.winner ?
          getGuessWinner(awayGameGuess, awayGameGuess?.home_team, awayGameGuess?.away_team) :
          getGuessLoser(awayGameGuess, awayGameGuess?.home_team, awayGameGuess?.away_team)
      }

      if(homeTeam !== gameGuess.home_team || awayTeam !== gameGuess.away_team) {
        groupContext.updateGameGuess(gameGuess.game_id, {
          ...gameGuess,
          home_team: homeTeam,
          away_team: awayTeam
        }, isFinal, isThirdPlace)
      }
    }
  }, [isPlayoffGame, gameGuesses, gameGuess, game, setCalculatedHomeTeam, setCalculatedAwayTeam, groupContext, isFinal, isThirdPlace])


  const handleScoreChange = (home: boolean) => (e: ChangeEvent<HTMLInputElement>) => {
    let value: number | null = Number.parseInt(e.target.value, 10);
    if(!Number.isInteger(value)) {
      value = null
    }

    const newGameGuess = {
      ...gameGuess,
      [home ? 'home_score': 'away_score']: value,
    }

    if (newGameGuess.home_score !== newGameGuess.away_score) {
      newGameGuess.home_penalty_winner = newGameGuess.away_penalty_winner = false;
    }

    groupContext.updateGameGuess(game.id, newGameGuess, isFinal, isThirdPlace)
  }

  const handlePenaltyWinnerChange = (home: boolean) => (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;

    groupContext.updateGameGuess(game.id, {
      ...gameGuess,
      [home ? 'home_penalty_winner': 'away_penalty_winner']: newValue,
      // Always set the other one to false
      [!home ? 'home_penalty_winner': 'away_penalty_winner']: false,
    }, isFinal, isThirdPlace)
  }

  const ONE_HOUR = 60 * 60 * 1000
  const editDisabled = (Date.now() + ONE_HOUR > game.game_date.getTime())
  const scoreForGame = calculateScoreForGame(game, gameGuess)
  const teamNameCols = 8 - (isPlayoffGame? 1: 0)
  const homeTeam = game.home_team || gameGuess.home_team
  const awayTeam = game.away_team || gameGuess.away_team
  // TODO: Calculate actual winner from result!!
  const winnerTeam = getGuessWinner(gameGuess, homeTeam, awayTeam)
  const isHomeWinner = homeTeam === winnerTeam
  const isAwayWinner = awayTeam === winnerTeam

  const homeAvatarInfo =
    isFinal ?
      ( isHomeWinner ? {alt:'Campeon', src:'/gold-medal.png'} :
        (isAwayWinner ? {alt:'Subampeon', src:'/silver-medal.png'} : undefined) ) :
      ( isThirdPlace ? (isHomeWinner ? {alt:'Tercero', src:'/bronze-medal.png'} : undefined) : undefined)


  const awayAvatarInfo =
    isFinal ?
      ( isAwayWinner ? {alt:'Campeon', src:'/gold-medal.png'} :
        (isHomeWinner ? {alt:'Subampeon', src:'/silver-medal.png'} : undefined) ) :
      ( isThirdPlace ? (isAwayWinner ? {alt:'Tercero', src:'/bronze-medal.png'} : undefined) : undefined)

  return (
    <GameViewCard
        isGameGuess={true}
        game={game}
        scoreForGame={scoreForGame}
        isPlayoffGame={isPlayoffGame}
        homeTeamNameOrDescription={homeTeam ? teamsMap[homeTeam].name : getTeamDescription(game.home_team_rule)}
        homeTeamAvatarInfo={homeAvatarInfo}
        homeTeamTheme={homeTeam && teamsMap[homeTeam]?.theme}
        homeScore={gameGuess.home_score}
        awayTeamNameOrDescription={awayTeam ? teamsMap[awayTeam].name : getTeamDescription(game.away_team_rule)}
        awayTeamAvatarInfo={awayAvatarInfo}
        awayTeamTheme={awayTeam && teamsMap[awayTeam]?.theme }
        awayScore={gameGuess.away_score}
        editDisabled={editDisabled}
        homePenaltyWinner={gameGuess.home_penalty_winner}
        awayPenaltyWinner={gameGuess.away_penalty_winner}
        handleScoreChange={handleScoreChange}
        handlePenaltyWinnerChange={handlePenaltyWinnerChange}
    />
  )
}

export default GameView;
