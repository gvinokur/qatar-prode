'use server'

import {getCompleteTournament} from "../../actions/tournament-actions";
import {redirect, RedirectType} from "next/navigation";
import {DebugObject} from "../../components/debug";
import {Fixtures} from "../../components/tournament-page/fixtures";
import {Grid} from "../../components/mui-wrappers/";
import Rules from "../../components/tournament-page/rules";
import FriendGroupsList from "../../components/tournament-page/friend-groups-list";
import {getGroupsForUser} from "../../actions/prode-group-actions";
import {getLoggedInUser} from "../../actions/user-actions";
import {UserTournamentStatistics} from "../../components/tournament-page/user-tournament-statistics";

type Props = {
  params: {
    id: string
  }
  searchParams: {[k:string]:string}
}

export default async function TournamentLandingPage({ params, searchParams }: Props) {
  const tournamentId = params.id
  const tournamentData = await getCompleteTournament(tournamentId)
  const prodeGroups = await getGroupsForUser()
  if (!tournamentData) {
    redirect('/?error=NO_TOURNAMENT_FOUND', RedirectType.replace)
  }

  const gamesAroundMyTime =
    tournamentData.games
      // Sort games by distance to "now"
      .sort((a, b) => {
        return Math.abs(a.game_date.getTime() - Date.now()) - Math.abs(b.game_date.getTime() - Date.now())
      })
      // Then keep only 5 of them
      .filter((_, index) => (index < 5))
      // Then sort by date ascending
      .sort((a,b) => a.game_date.getTime() - b.game_date.getTime())

  return (
    <>
      {searchParams.hasOwnProperty('debug') && (<DebugObject object={tournamentData}/>)}
      <Grid container spacing={2} p={2}>
        <Grid item xs={12} md={3}>
          <Fixtures games={gamesAroundMyTime} teamsMap={tournamentData.teamsMap}/>
        </Grid>
        <Grid item xs={12} md={3}>
          <UserTournamentStatistics />
        </Grid>
        {prodeGroups && (
          <Grid item xs={12} md={3}>
                <FriendGroupsList userGroups={prodeGroups.userGroups} participantGroups={prodeGroups.participantGroups}/>
          </Grid>
        )}
        <Grid item xs={12} md={3}>
          <Rules/>
        </Grid>
      </Grid>
    </>
  )
}
