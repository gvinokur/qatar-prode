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

type Props = {
  params: {
    id: string
  }
  searchParams: {[k:string]:string}
}

export default async function TournamentLandingPage({ params, searchParams }: Props) {
  const tournamentId = params.id
  const user = await getLoggedInUser()
  const prodeGroups = await getGroupsForUser()

  const gamesAroundMyTime = await getGamesAroundMyTime(tournamentId);
  const teamsMap = await getTeamsMap(tournamentId)
    // Object.values(tournamentData.gamesMap)
    //   // Sort games by distance to "now"
    //   .sort((a, b) => {
    //     return Math.abs(a.game_date.getTime() - Date.now()) - Math.abs(b.game_date.getTime() - Date.now())
    //   })
    //   // Then keep only 5 of them
    //   .filter((_, index) => (index < 5))
    //   // Then sort by date ascending
    //   .sort((a,b) => a.game_date.getTime() - b.game_date.getTime())

  const userGameStatisticList = user ?
    await getGameGuessStatisticsForUsers([user.id], tournamentId) :
    []

  const userGameStatistics = userGameStatisticList.length > 0 ? userGameStatisticList[0] : undefined

  return (
    <>
      {searchParams.hasOwnProperty('debug') && (<DebugObject object={{
        gamesAroundMyTime,
        teamsMap,
        prodeGroups
      }}/>)}
      <Grid container spacing={2} p={2}>
        <Grid item xs={12} md={true}>
          <Fixtures games={gamesAroundMyTime} teamsMap={teamsMap}/>
        </Grid>
        {user && (
            <Grid item xs={12} md={true}>
              <UserTournamentStatistics userGameStatistics={userGameStatistics} />
            </Grid>
        )}
        {prodeGroups && (
          <Grid item xs={12} md={true}>
                <FriendGroupsList userGroups={prodeGroups.userGroups} participantGroups={prodeGroups.participantGroups}/>
          </Grid>
        )}
        <Grid item xs={12} md={true}>
          <Rules/>
        </Grid>
      </Grid>
    </>
  )
}
