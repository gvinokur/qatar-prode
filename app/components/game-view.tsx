'use client'

import { useContext, useMemo } from "react";
import { useTranslations } from 'next-intl';
import {calculateScoreForGame} from "../utils/game-score-calculator";
import {ExtendedGameData} from "../definitions";
import {Game, Team} from "../db/tables-definition";
import {GuessesContext} from "./context-providers/guesses-context-provider";
import {getTeamNames} from "../utils/team-name-helper";
import CompactGameViewCard from "./compact-game-view-card";
import { ONE_HOUR } from "../utils/countdown-utils";
import { generateAIPrediction } from "../utils/ai-prediction-generator";

type GameViewProps = {
  game: ExtendedGameData,
  teamsMap: {[k:string]: Team}
  handleEditClick: (_gameNumber: number) => void
  disabled?: boolean
  onStageClick?: () => void
  onAIGenerateClick?: (gameId: string) => void
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

const GameView = ({game, teamsMap, handleEditClick, disabled = false, onStageClick, onAIGenerateClick}: GameViewProps) => {
  const t = useTranslations('predictions');
  const isPlayoffGame = (!!game.playoffStage);
  const groupContext = useContext(GuessesContext)
  const gameGuesses = groupContext.gameGuesses
  const gameGuess = gameGuesses[game.id] || buildGameGuess(game)
  // May fix issues with the game number not being set in the game guess
  if(!gameGuess.game_number) gameGuess.game_number = game.game_number
  if(!gameGuess.game_id) gameGuess.game_id = game.id

  const editDisabled = (Date.now() + ONE_HOUR > game.game_date.getTime()) || disabled

  const handleAIGenerateClick = useMemo(() => {
    if (!onAIGenerateClick || !game.home_team || !game.away_team || editDisabled) return undefined;
    return () => {
      const homeRank = (teamsMap[game.home_team!] as { rank?: number | null })?.rank;
      const awayRank = (teamsMap[game.away_team!] as { rank?: number | null })?.rank;
      const prediction = generateAIPrediction(homeRank, awayRank, isPlayoffGame);
      groupContext.updateGameGuess(game.id, { ...gameGuess, ...prediction });
      onAIGenerateClick(game.id);
    };
  }, [onAIGenerateClick, game, teamsMap, isPlayoffGame, editDisabled, gameGuess, groupContext]);
  const { score: scoreForGame } = calculateScoreForGame(game, gameGuess)

  let stageLabel: string | undefined
  if (game.playoffStage) {
    stageLabel = game.playoffStage.round_name
  } else if (game.group) {
    stageLabel = t('secondaryFilters.groupWithLetter', { letter: game.group.group_letter })
  }

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
      stageLabel={stageLabel}
      onStageClick={onStageClick}
      onAIGenerateClick={handleAIGenerateClick}
    />
  )
}

export default GameView;
