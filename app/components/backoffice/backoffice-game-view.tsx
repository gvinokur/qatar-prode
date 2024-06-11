'use client'

import {ExtendedGameData} from "../../definitions";
import {Team} from "../../db/tables-definition";
import GameViewCard from "../game-view-card";
import {getTeamDescription} from "../../utils/playoffs-rule-helper";
import {ChangeEvent} from "react";

type Props = {
  game: ExtendedGameData
  teamsMap: {[k:string]: Team}
  handleScoreChange: (isHomeTeam: boolean) => (e: ChangeEvent<HTMLInputElement>) => void
  handlePenaltyScoreChange: (isHomeTeam: boolean) => (e: ChangeEvent<HTMLInputElement>) => void
  handleDraftStatusChanged: (e: ChangeEvent<HTMLInputElement>) => void
}

export default function BackofficeGameView({ game, teamsMap, handlePenaltyScoreChange, handleScoreChange, handleDraftStatusChanged} : Props) {

  return (
    <GameViewCard
      isGameGuess={false}
      game={game}
      isPlayoffGame={!!game.playoffStage}
      homeTeamNameOrDescription={game.home_team ? teamsMap[game.home_team].name : getTeamDescription(game.home_team_rule)}
      awayTeamNameOrDescription={game.away_team ? teamsMap[game.away_team].name : getTeamDescription(game.away_team_rule)}
      homeTeamTheme={game.home_team && teamsMap[game.home_team].theme}
      awayTeamTheme={game.away_team && teamsMap[game.away_team].theme}
      handleScoreChange={handleScoreChange}
      handlePenaltyScoreChange={handlePenaltyScoreChange}
      handleDraftStatusChanged={handleDraftStatusChanged}
    />
  )
}
