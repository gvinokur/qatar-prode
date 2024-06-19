'use server'

import {Grid, Box, Typography} from "../../components/mui-wrappers";
import {redirect} from "next/navigation";
import {DebugObject} from "../../components/debug";
import {findParticipantsInGroup, findProdeGroupById} from "../../db/prode-group-repository";
import JoinMessage from "../../components/friend-groups/friend-groups-join-message";
import {findUsersByIds} from "../../db/users-repository";
import ProdeGroupTable from "../../components/friend-groups/friends-group-table";
import {getLoggedInUser} from "../../actions/user-actions";
import ProdeGroupThemer from "../../components/friend-groups/friend-groups-themer";
import {findAllActiveTournaments} from "../../db/tournament-repository";
import {getGameGuessStatisticsForUsers} from "../../db/game-guess-repository";
import {customToMap, toMap} from "../../utils/ObjectUtils";

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
  const tournaments = await findAllActiveTournaments()

  const allParticipants = [
    prodeGroup.owner_user_id,
    ...participants.map(({user_id}) => user_id)
  ]

  const users = await findUsersByIds(allParticipants)
  const usersMap = toMap(users)


  //TODO: Calculate scores for users, but not yet, because all is zero!! :D
  const userScoresByTournament =
    Object.fromEntries(
      await Promise.all(
        tournaments.map(async (tournament) => {
          const allUsersGameStatics = await getGameGuessStatisticsForUsers(allParticipants, tournament.id)
          const gameStatisticsByUserIdMap =
            customToMap(allUsersGameStatics, (userGameStatistics) => userGameStatistics.user_id)
          return [
            tournament.id,
            users.map(user => ({
              userId: user.id,
              groupStageScore: gameStatisticsByUserIdMap[user.id]?.group_score || 0,
              groupStageQualifiersScore: 0,
              playoffScore: gameStatisticsByUserIdMap[user.id]?.playoff_score || 0,
              honorRollScore: 0,
              totalPoints: (
                (gameStatisticsByUserIdMap[user.id]?.total_score || 0)
              )
            }))
          ]
        }
      )))


  return (
    <Box pt={2} pb={2}>
      {searchParams.hasOwnProperty('debug') && (
        <DebugObject object={{
          prodeGroup,
          searchParams,
          users,
          userScoresByTournament
        }}/>
      )}
      <Grid container spacing={2}
            pl={2}
            bgcolor={prodeGroup.theme?.primary_color || ''}
            color={prodeGroup.theme?.secondary_color || ''}>
        <Grid item>
          {prodeGroup.name.toLowerCase() === 'welltech' && (
            <img src={'/welltech-logo.jpeg'} alt={'Grupo Welltech'} height={60} width={150}/>
          )}
          {prodeGroup.theme?.logo && (
            <img src={prodeGroup.theme?.logo} alt={prodeGroup.name} height={64} width={64} style={{
              borderRadius: '8px'
            }}/>
          )}
        </Grid>
        <Grid item>
          <Typography variant={'h2'} fontWeight={'bold'}>
          {prodeGroup.name}
          </Typography>
        </Grid>
      </Grid>
      <Grid container spacing={2} xs={12} p={2}>
        <Grid item xs={12} md={8}>
          <ProdeGroupTable
            users={usersMap}
            userScoresByTournament={userScoresByTournament}
            loggedInUser={user.id}
            tournaments={tournaments}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          {prodeGroup.owner_user_id === user.id && <ProdeGroupThemer group={prodeGroup}/>}
        </Grid>
      </Grid>
      {searchParams.hasOwnProperty('recentlyJoined') && (<JoinMessage />)}
    </Box>
  )

}
