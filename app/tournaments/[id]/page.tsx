'use server'

import {getGamesAroundMyTime, getTeamsMap} from "../../actions/tournament-actions";
import {DebugObject} from "../../components/debug";
import {Fixtures} from "../../components/tournament-page/fixtures";
import {Grid} from "../../components/mui-wrappers/";
import Rules from "../../components/tournament-page/rules";
import FriendGroupsList from "../../components/tournament-page/friend-groups-list";
import {getGroupsForUser} from "../../actions/prode-group-actions";
import {getLoggedInUser} from "../../actions/user-actions";
import {UserTournamentStatistics} from "../../components/tournament-page/user-tournament-statistics";
import {getGameGuessStatisticsForUsers} from "../../db/game-guess-repository";
import {findTournamentGuessByUserIdTournament} from "../../db/tournament-guess-repository";
import {unstable_ViewTransition as ViewTransition} from "react";

type Props = {
  readonly params: Promise<{
    id: string
  }>
  readonly searchParams: Promise<{[k:string]:string}>
}

export default async function TournamentLandingPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams

  const tournamentId = params.id
  const user = await getLoggedInUser()
  const prodeGroups = await getGroupsForUser()

  const gamesAroundMyTime = await getGamesAroundMyTime(tournamentId);
  const teamsMap = await getTeamsMap(tournamentId)

  const userGameStatisticList = user ?
    await getGameGuessStatisticsForUsers([user.id], tournamentId) :
    []
  const tournamentGuesses = user && (await findTournamentGuessByUserIdTournament(user.id, params.id))

  const userGameStatistics = userGameStatisticList.length > 0 ? userGameStatisticList[0] : undefined

  return (
    <>
      {searchParams.hasOwnProperty('debug') && (<DebugObject object={{
        gamesAroundMyTime,
        teamsMap,
        prodeGroups
      }}/>)}
      <ViewTransition
        name={'group-page'}
        enter={'group-enter'}
        exit={'group-exit'}>
        <Grid container maxWidth={'868px'} mt={1} mx={{md: 'auto'}} spacing={2}>
          <Grid size={{ xs:12, md: 8 }}>
            <Fixtures games={gamesAroundMyTime} teamsMap={teamsMap}/>
          </Grid>
          <Grid size={{ xs:12, md: 4 }}>
            <Grid container rowSpacing={2}>
              <Grid size={12}>
                <Rules expanded={false}/>
              </Grid>
              {user && (
                  <Grid size={12}>
                    <UserTournamentStatistics userGameStatistics={userGameStatistics} tournamentGuess={tournamentGuesses} />
                  </Grid>
              )}
              {prodeGroups && (
                <Grid size={12}>
                  <FriendGroupsList userGroups={prodeGroups.userGroups} participantGroups={prodeGroups.participantGroups}/>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </ViewTransition>
    </>
  )
}
