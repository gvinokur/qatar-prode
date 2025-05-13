'use server'

import {getCompleteGroupData} from "../../../../actions/tournament-actions";
import {DebugObject} from "../../../../components/debug";
import GroupSelector from "../../../../components/groups-page/group-selector";
import {Box, Grid} from "../../../../components/mui-wrappers";
import {GameGuess} from "../../../../db/tables-definition";
import GameView from "../../../../components/game-view";
import {ExtendedGameData} from "../../../../definitions";
import {GuessesContextProvider, GuessesContext} from "../../../../components/context-providers/guesses-context-provider";
import GroupTable from "../../../../components/groups-page/group-table";
import SaveComponent from "../../../../components/groups-page/save-component";
import {findGameGuessesByUserId} from "../../../../db/game-guess-repository";
import {getLoggedInUser} from "../../../../actions/user-actions";
import {redirect} from "next/navigation";
import {findGuessedQualifiedTeams, findQualifiedTeams} from "../../../../db/team-repository";
import {calculateGroupPosition} from "../../../../utils/group-position-calculator";
import {findAllTournamentGroupTeamGuessInGroup} from "../../../../db/tournament-group-team-guess-repository";
import {customToMap, toMap} from "../../../../utils/ObjectUtils";
import GamesGrid from "../../../../components/games-grid";
import { unstable_ViewTransition as ViewTransition} from 'react'

type Props = {
  params: Promise<{
    group_id: string
    id: string
  }>
  searchParams: Promise<{[k:string]:string}>
}

export default async function GroupComponent(props : Props) {
  const params = await props.params
  const searchParams = await props.searchParams

  const user = await getLoggedInUser();
  if(!user) {
    redirect('/')
  }
  const groupId = params.group_id
  const completeGroupData = await getCompleteGroupData(groupId)
  const userGameGuesses = await findGameGuessesByUserId(user.id, params.id)
  const qualifiedTeamGuesses = await findGuessedQualifiedTeams(params.id, user.id, params.group_id)
  const qualifiedTeams = await findQualifiedTeams(params.id, params.group_id)

  const gameGuesses:{[k: string]: GameGuess} = customToMap(userGameGuesses, (gameGuess) => gameGuess.game_id)

  const teamIds = Object.keys(completeGroupData.teamsMap)
  const groupTeamStatsGuesses = await findAllTournamentGroupTeamGuessInGroup(user.id, params.group_id)
  const guessedGroupPositions =
    groupTeamStatsGuesses.length > 0 ?
      groupTeamStatsGuesses.sort((a,b) => (a.position - b.position)) :
      calculateGroupPosition(teamIds, Object.values(completeGroupData.gamesMap).map(game => ({
        ...game,
        resultOrGuess: gameGuesses[game.id]
      })),
        completeGroupData.group.sort_by_games_between_teams).map((teamStat, index) => {
        return {
          user_id: user.id,
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
        autoSave={true}
      >
        <ViewTransition
          name={'group-page'}
          enter={'group-enter'}
          exit={'group-exit'}
        >
          <Grid container mt={'16px'} maxWidth={'868px'} mx={'auto'}>
            <Grid size={12} mb={'16px'}>
              <GamesGrid
                isPlayoffs={false}
                games={Object.values(completeGroupData.gamesMap)
                  .sort((a,b) => a.game_number - b.game_number)}
                teamsMap={completeGroupData.teamsMap}
              />
            </Grid>
            <Grid size={12} justifyContent={'center'}>
              <GroupTable
                games={Object.values(completeGroupData.gamesMap)}
                teamsMap={completeGroupData.teamsMap}
                qualifiedTeamGuesses={qualifiedTeamGuesses}
                qualifiedTeams={qualifiedTeams}
                realPositions={completeGroupData.teamPositions}
                isPredictions={true}/>
            </Grid>
          </Grid>
        </ViewTransition>
      </GuessesContextProvider>
    </>
  )
}
