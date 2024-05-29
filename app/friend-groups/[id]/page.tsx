'use server'

import {Grid, Box, Typography} from "../../components/mui-wrappers";
import {redirect} from "next/navigation";
import {DebugObject} from "../../components/debug";
import {findParticipantsInGroup, findProdeGroupById} from "../../db/prode-group-repository";
import JoinMessage from "../../components/friend-groups/friend-groups-join-message";
import {findUsersByIds} from "../../db/users-repository";
import ProdeGroupTable from "../../components/friend-groups/friends-group-table";
import {getLoggedInUser} from "../../actions/user-actions";

type Props = {
  params: {
    id: string
  },
  searchParams: {[k:string]:string}
}
export default async function FriendsGroup({params, searchParams} : Props){
  const user = await getLoggedInUser()
  const prodeGroup = await findProdeGroupById(params.id)
  if(!prodeGroup || !user) {
    redirect("/")
  }
  const participants = await findParticipantsInGroup(prodeGroup.id)

  const allParticipants = [
    prodeGroup.owner_user_id,
    ...participants.map(({user_id}) => user_id)
  ]

  const users = await findUsersByIds(allParticipants)
  const usersMap = Object.fromEntries(users.map(user => [user.id, user]))

  //TODO: Calculate scores for users, but not yes, because all is zero!! :D
  const userScores = users.map(user => ({
      userId: user.id,
      groupStageScore: 0,
      groupStageQualifiersScore: 0,
      playoffScore: 0,
      honorRollScore: 0,
      totalPoints: 0
    }))


  return (
    <Box p={2}>
      {searchParams.hasOwnProperty('debug') && (
        <DebugObject object={{
          prodeGroup,
          searchParams,
          users,
          userScores
        }}/>
      )}
      <Grid container spacing={2}>
        <Grid item>
          {prodeGroup.name.toLowerCase() === 'welltech' && (
            <img src={'/welltech-logo.jpeg'} alt={'Grupo Welltech'} height={60} width={150}/>
          )}
        </Grid>
        <Grid item>
          <Typography variant={'h2'}>
            {prodeGroup.name}
          </Typography>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item>
          <ProdeGroupTable users={usersMap} userScores={userScores} loggedInUser={user.id}/>
        </Grid>
      </Grid>
      {searchParams.hasOwnProperty('recentlyJoined') && (<JoinMessage />)}
    </Box>
  )

}
