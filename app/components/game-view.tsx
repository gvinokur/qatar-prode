'use client'

import { useContext} from "react";
import { useTranslations } from 'next-intl';
import {calculateScoreForGame} from "../utils/game-score-calculator";
import {ExtendedGameData} from "../definitions";
import {Game, Team} from "../db/tables-definition";
import {GuessesContext} from "./context-providers/guesses-context-provider";
import {getTeamNames} from "../utils/team-name-helper";
import CompactGameViewCard from "./compact-game-view-card";
import { ONE_HOUR } from "../utils/countdown-utils";

type GameViewProps = {
  game: ExtendedGameData,
  teamsMap: {[k:string]: Team}
  handleEditClick: (_gameNumber: number) => void
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
  const t = useTranslations('predictions');
  const isPlayoffGame = (!!game.playoffStage);
  const groupContext = useContext(GuessesContext)
  const gameGuesses = groupContext.gameGuesses
  const gameGuess = gameGuesses[game.id] || buildGameGuess(game)
  // May fix issues with the game number not being set in the game guess
  if(!gameGuess.game_number) gameGuess.game_number = game.game_number
  if(!gameGuess.game_id) gameGuess.game_id = game.id

  const editDisabled = (Date.now() + ONE_HOUR > game.game_date.getTime()) || disabled
  const scoreForGame = calculateScoreForGame(game, gameGuess)

  // Get team names using shared utility
  const {
    homeTeamId,
    awayTeamId,
    homeTeamName,
    awayTeamName,
    homeTeamShortName,
    awayTeamShortName,
  } = getTeamNames(game, gameGuess, teamsMap, t);

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
      homeTeamNameOrDescription={homeTeamName}
      homeTeamShortNameOrDescription={homeTeamShortName}
      homeTeamTheme={homeTeamId && teamsMap[homeTeamId]?.theme || null}
      homeScore={gameGuess.home_score}
      awayTeamNameOrDescription={awayTeamName}
      awayTeamShortNameOrDescription={awayTeamShortName}
      awayTeamTheme={awayTeamId && teamsMap[awayTeamId]?.theme || null}
      awayScore={gameGuess.away_score}
      homePenaltyWinner={gameGuess.home_penalty_winner}
      awayPenaltyWinner={gameGuess.away_penalty_winner}
      gameResult={game.gameResult}
      boostType={gameGuess.boost_type || null}
      disabled={editDisabled}
      onEditClick={handleEditClick}
    />
  )
}

export default GameView;
