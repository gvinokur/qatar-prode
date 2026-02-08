'use server'

import {getCompleteGroupData} from "../../../../actions/tournament-actions";
import {DebugObject} from "../../../../components/debug";
import { Grid} from "../../../../components/mui-wrappers";
import {GameGuess, Team, TournamentGroupTeamStatsGuess} from "../../../../db/tables-definition";
import {GuessesContextProvider} from "../../../../components/context-providers/guesses-context-provider";
import GroupTable from "../../../../components/groups-page/group-table";
import {findGameGuessesByUserId, getPredictionDashboardStats} from "../../../../db/game-guess-repository";
import {getLoggedInUser} from "../../../../actions/user-actions";
import {findGuessedQualifiedTeams, findQualifiedTeams} from "../../../../db/team-repository";
import {calculateGroupPosition} from "../../../../utils/group-position-calculator";
import {findAllTournamentGroupTeamGuessInGroup} from "../../../../db/tournament-group-team-guess-repository";
import {customToMap} from "../../../../utils/ObjectUtils";
import GamesGrid from "../../../../components/games-grid";
import { PredictionDashboard } from "../../../../components/prediction-dashboard";
import { findTournamentById } from "../../../../db/tournament-repository";
import { unstable_ViewTransition as ViewTransition} from 'react'

type Props = {
  readonly params: Promise<{
    group_id: string
    id: string
  }>
  readonly searchParams: Promise<{[k:string]:string}>
}

export default async function GroupComponent(props : Props) {
  const params = await props.params
  const searchParams = await props.searchParams

  const user = await getLoggedInUser();
  const isLoggedIn = !!user;
  const groupId = params.group_id
  const completeGroupData = await getCompleteGroupData(groupId)
  const tournament = await findTournamentById(params.id)
  let userGameGuesses: GameGuess[] = [];
  let qualifiedTeamGuesses: Team[] = [];
  let dashboardStats = null;
  if (isLoggedIn) {
    userGameGuesses = await findGameGuessesByUserId(user.id, params.id)
    qualifiedTeamGuesses = await findGuessedQualifiedTeams(params.id, user.id, params.group_id)
    dashboardStats = await getPredictionDashboardStats(user.id, params.id)
  }
  const qualifiedTeams = await findQualifiedTeams(params.id, params.group_id)

  const gameGuesses:{[k: string]: GameGuess} = customToMap(userGameGuesses, (gameGuess) => gameGuess.game_id)

  const teamIds = Object.keys(completeGroupData.teamsMap)
  let groupTeamStatsGuesses: TournamentGroupTeamStatsGuess[] = [];
  if (isLoggedIn) {
    groupTeamStatsGuesses = await findAllTournamentGroupTeamGuessInGroup(user.id, params.group_id)
  }
  const guessedGroupPositions =
    groupTeamStatsGuesses.length > 0 ?
      groupTeamStatsGuesses.sort((a,b) => (a.position - b.position)) :
      calculateGroupPosition(teamIds, Object.values(completeGroupData.gamesMap).map(game => ({
        ...game,
        resultOrGuess: gameGuesses[game.id]
      })),
        completeGroupData.group.sort_by_games_between_teams).map((teamStat, index) => {
        return {
          user_id: user?.id || '',
          tournament_group_id: params.group_id,
          position: index,
          ...teamStat
        }
      })

  return(
    <>
      {searchParams.hasOwnProperty('debug') && (<DebugObject object={{
        completeGroupData,
        gameGuesses,
        qualifiedTeamGuesses,
        qualifiedTeams
      }}/>)}
      <GuessesContextProvider
        gameGuesses={gameGuesses}
        groupGames={Object.values(completeGroupData.gamesMap)}
        guessedPositions={guessedGroupPositions}
        sortByGamesBetweenTeams={completeGroupData.group.sort_by_games_between_teams}
        autoSave={isLoggedIn}
      >
        <ViewTransition
          name={'group-page'}
          enter={'group-enter'}
          exit={'group-exit'}
        >
          <Grid container mt={'16px'} maxWidth={'868px'} mx={'auto'}>
            <Grid size={12} mb={'16px'}>
              {isLoggedIn && tournament && dashboardStats ? (
                <PredictionDashboard
                  games={Object.values(completeGroupData.gamesMap)
                    .sort((a,b) => a.game_number - b.game_number)}
                  teamsMap={completeGroupData.teamsMap}
                  tournament={tournament}
                  isPlayoffs={false}
                  isLoggedIn={isLoggedIn}
                  tournamentId={params.id}
                  dashboardStats={dashboardStats}
                />
              ) : (
                <GamesGrid
                  isPlayoffs={false}
                  games={Object.values(completeGroupData.gamesMap)
                    .sort((a,b) => a.game_number - b.game_number)}
                  teamsMap={completeGroupData.teamsMap}
                  isLoggedIn={false}
                />
              )}
            </Grid>
            <Grid size={12} justifyContent={'center'}>
              <GroupTable
                teamStats={completeGroupData.teamPositions}
                teamsMap={completeGroupData.teamsMap}
                qualifiedTeams={qualifiedTeams}
              />
            </Grid>
          </Grid>
        </ViewTransition>
      </GuessesContextProvider>
    </>
  )
}
