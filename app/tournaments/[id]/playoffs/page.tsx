'use server'

import {DebugObject} from "../../../components/debug";
import {getLoggedInUser} from "../../../actions/user-actions";
import {getCompletePlayoffData, getGamesClosingWithin48Hours} from "../../../actions/tournament-actions";
import {findGameGuessesByUserId, getPredictionDashboardStats} from "../../../db/game-guess-repository";
import {GameGuess} from "../../../db/tables-definition";
import {GuessesContextProvider} from "../../../components/context-providers/guesses-context-provider";
import {calculatePlayoffTeamsFromPositions} from "../../../utils/playoff-teams-calculator";
import {findGroupsInTournament, findTournamentgroupById} from "../../../db/tournament-group-repository";
import {customToMap} from "../../../utils/ObjectUtils";
import {default as React, unstable_ViewTransition as ViewTransition} from "react";
import TabbedPlayoffsPage from '../../../components/playoffs/tabbed-playoff-page';
import { findTournamentById } from "../../../db/tournament-repository";
import {findGamesInGroup} from "../../../db/game-repository";
import {calculateGroupPosition} from "../../../utils/group-position-calculator";

type Props = {
  readonly params: Promise<{
    id: string
  }>
  readonly searchParams: Promise<{[k:string]:string}>
}

export default async function PlayoffPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams
  const user = await getLoggedInUser();
  const isLoggedIn = !!user;
  const completePlayoffData = await getCompletePlayoffData(params.id, false)
  const tournament = await findTournamentById(params.id)

  // Fetch all games closing within 48 hours for accordion display
  // Filter to only include playoff games (not group stage games)
  const allClosingGames = isLoggedIn ? await getGamesClosingWithin48Hours(params.id) : [];
  const closingGames = allClosingGames.filter(game => game.playoffStage !== null && game.playoffStage !== undefined);

  let userGameGuesses: GameGuess[] = [];
  let guessedPositionsByGroup = {};
  let dashboardStats = null;
  if (isLoggedIn) {
    userGameGuesses = await findGameGuessesByUserId(user.id, params.id)
    dashboardStats = await getPredictionDashboardStats(user.id, params.id)
    const groups = await findGroupsInTournament(params.id)

    // Calculate group positions from game guesses for each group
    const gameGuessesMap = customToMap(userGameGuesses, (gameGuess) => gameGuess.game_id)

    guessedPositionsByGroup = Object.fromEntries(
      await Promise.all(
        groups.map(async (group) => {
          const groupGames = await findGamesInGroup(group.id)
          const groupData = await findTournamentgroupById(group.id)

          // Calculate standings from game guesses
          const teamIds = groupGames.reduce((ids, game) => {
            if (game.home_team && !ids.includes(game.home_team)) ids.push(game.home_team)
            if (game.away_team && !ids.includes(game.away_team)) ids.push(game.away_team)
            return ids
          }, [] as string[])

          const standings = calculateGroupPosition(
            teamIds,
            groupGames.map(game => ({
              ...game,
              resultOrGuess: gameGuessesMap[game.id]
            })),
            groupData?.sort_by_games_between_teams
          )

          return [group.group_letter, standings]
        })
      ))
  }
  const gameGuessesMap = customToMap(userGameGuesses, (gameGuess) => gameGuess.game_id)

  const playoffTeamsByGuess = await calculatePlayoffTeamsFromPositions(
    params.id,
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
            tournamentId={params.id}
            enablePredictionDashboard={true}
            tournament={tournament || undefined}
            dashboardStats={dashboardStats || undefined}
            closingGames={closingGames}
          />
        </ViewTransition>
      </GuessesContextProvider>
    </>
  )
}
