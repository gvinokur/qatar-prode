'use server'

import {DebugObject} from "../../../components/debug";
import {getLoggedInUser} from "../../../actions/user-actions";
import {getCompletePlayoffData} from "../../../actions/tournament-actions";
import {findGameGuessesByUserId} from "../../../db/game-guess-repository";
import {GameGuess, TournamentGuessNew} from "../../../db/tables-definition";
import {GuessesContextProvider} from "../../../components/context-providers/guesses-context-provider";
import {calculatePlayoffTeamsFromPositions} from "../../../utils/playoff-teams-calculator";
import {findGroupsInTournament} from "../../../db/tournament-group-repository";
import {findAllTournamentGroupTeamGuessInGroup} from "../../../db/tournament-group-team-guess-repository";
import {customToMap} from "../../../utils/ObjectUtils";
import {unstable_ViewTransition as ViewTransition} from "react";
import React from "react";
import TabbedPlayoffsPage from '../../../components/playoffs/tabbed-playoff-page';

type Props = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{[k:string]:string}>
}

const buildTournamentGuesses = (userId: string, tournamentId: string) => ({
  user_id: userId,
  tournament_id: tournamentId
} as TournamentGuessNew)

export default async function PlayoffPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams
  const user = await getLoggedInUser();
  const isLoggedIn = !!user;
  const completePlayoffData = await getCompletePlayoffData(params.id, false)
  let userGameGuesses: GameGuess[] = [];
  let guessedPositionsByGroup = {};
  if (isLoggedIn) {
    userGameGuesses = await findGameGuessesByUserId(user.id, params.id)
    const groups = await findGroupsInTournament(params.id)
    guessedPositionsByGroup = Object.fromEntries(
      await Promise.all(
        groups.map(async (group) => [
          group.group_letter,
          await findAllTournamentGroupTeamGuessInGroup(user.id, group.id)
        ])
      ))
  }
  const gameGuessesMap = customToMap(userGameGuesses, (gameGuess) => gameGuess.game_id)

  const playoffTeamsByGuess = calculatePlayoffTeamsFromPositions(
    completePlayoffData.playoffStages[0],
    completePlayoffData.gamesMap,
    guessedPositionsByGroup)


  Object.keys(playoffTeamsByGuess).forEach(game_id => {
    gameGuessesMap[game_id] = {
      ...gameGuessesMap[game_id],
      home_team: playoffTeamsByGuess[game_id].homeTeam?.team_id || null,
      away_team: playoffTeamsByGuess[game_id].awayTeam?.team_id || null
    }
  })

  const playoffStagesPreFinal = completePlayoffData
    .playoffStages
    .filter(ps => (!ps.is_final && !ps.is_third_place))
    .sort((a,b) => a.round_order - b.round_order)

  const final = completePlayoffData.playoffStages.find(ps => ps.is_final)

  const thirdPlace = completePlayoffData.playoffStages.find(ps => ps.is_third_place)

  const sections = [
    ...playoffStagesPreFinal
      .map(playoffStage => ({
        section: playoffStage.round_name,
        games: playoffStage.games.map(
          ({game_id}) => completePlayoffData.gamesMap[game_id])
          .sort((a,b) => a.game_number - b.game_number)
      })),
      {
        section: 'Finales',
        games: [
          ...(thirdPlace && thirdPlace.games.length > 0 ? [
            completePlayoffData.gamesMap[thirdPlace.games[0].game_id]
          ] : []),
          ...(final && final.games.length > 0 ? [
            completePlayoffData.gamesMap[final.games[0].game_id]
          ] : [])
        ]
      }
    ]

    // Get tournament start time to check if predictions are still allowed
  const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
  const currentTime = new Date()
  const isAwardsPredictionLocked = (currentTime.getTime() - completePlayoffData.tournamentStartDate.getTime()) >= FIVE_DAYS_MS;

  return (
    <>
      {searchParams.hasOwnProperty('debug') && (<DebugObject object={{
        playoffStagesPreFinal,
        final,
        thirdPlace,
        gameGuesses: gameGuessesMap,
        playoffTeamsByGuess,
        guessedPositionsByGroup,
        gameSections: sections,
      }}/>)}

      <GuessesContextProvider gameGuesses={gameGuessesMap} autoSave={isLoggedIn}>
        <ViewTransition name={'group-page'} enter={'group-enter'} exit={'group-exit'}>
          <TabbedPlayoffsPage 
            sections={sections} 
            teamsMap={completePlayoffData.teamsMap} 
            isLoggedIn={isLoggedIn} 
            isAwardsPredictionLocked={isAwardsPredictionLocked}
          />
        </ViewTransition>
      </GuessesContextProvider>
    </>
  )
}
