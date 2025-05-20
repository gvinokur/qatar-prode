'use client'

import {ExtendedGameData} from "../../../definitions";
import {Team} from "../../../db/tables-definition";
import {getTeamDescription} from "../../../utils/playoffs-rule-helper";
import {ChangeEvent} from "react";
import CompactGameViewCard from "../../compact-game-view-card";

type Props = {
  game: ExtendedGameData
  teamsMap: {[k:string]: Team}
  onEditClick: (gameNumber: number) => void
  onPublishClick: (gameNumber: number) => Promise<void>
}

export default function BackofficeGameView({ game, teamsMap, onEditClick, onPublishClick } : Props) {

  return (
    <CompactGameViewCard
      isGameGuess={false}
      gameNumber={game.game_number}
      gameDate={game.game_date}
      location={game.location}
      gameTimezone={game.game_local_timezone}
      isPlayoffGame={!!game.playoffStage}
      homeTeamNameOrDescription={game.home_team ? teamsMap[game.home_team].name : getTeamDescription(game.home_team_rule)}
      awayTeamNameOrDescription={game.away_team ? teamsMap[game.away_team].name : getTeamDescription(game.away_team_rule)}
      homeTeamTheme={game.home_team && teamsMap[game.home_team].theme || null}
      awayTeamTheme={game.away_team && teamsMap[game.away_team].theme || null}
      isDraft={game.gameResult ? game.gameResult.is_draft : true}
      homeScore={game.gameResult?.home_score}
      awayScore={game.gameResult?.away_score}
      homePenaltyScore={game.gameResult?.home_penalty_score}
      awayPenaltyScore={game.gameResult?.away_penalty_score}
      onEditClick={onEditClick}
      onPublishClick={onPublishClick}
    />
  )
}
