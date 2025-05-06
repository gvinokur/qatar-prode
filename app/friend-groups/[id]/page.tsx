'use server'

import {Box, Grid, Typography} from "../../components/mui-wrappers";
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
import {findTournamentGuessByUserIdsTournament} from "../../db/tournament-guess-repository";
import {TournamentGuess} from "../../db/tables-definition";
import {UserScore} from "../../definitions";
import {InviteFriendsDialogButton} from "../../components/friend-groups/invite-friends-dialog-button";

type Props = {
  params: Promise<{
    id: string
  }>,
  searchParams: Promise<{[k:string]:string}>
}

export default async function FriendsGroup(props : Props){
  const params = await props.params
  const searchParams = await props.searchParams
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
  const isAdmin = prodeGroup.owner_user_id === user.id

  //TODO: Calculate scores for users, but not yet, because all is zero!! :D
  const userScoresByTournament =
    Object.fromEntries(
      await Promise.all(
        tournaments.map(async (tournament) => {
          const allUsersGameStatics = await getGameGuessStatisticsForUsers(allParticipants, tournament.id)
          const allUserTournamentGuesses: TournamentGuess[] = await findTournamentGuessByUserIdsTournament(allParticipants, tournament.id)
          const gameStatisticsByUserIdMap =
            customToMap(allUsersGameStatics, (userGameStatistics) => userGameStatistics.user_id)
          const tournamentGuessesByUserIdMap =
            customToMap(allUserTournamentGuesses, (userTournamentGuess) => userTournamentGuess.user_id)

          return [
            tournament.id,
            users.map(user => (({
              userId: user.id,
              groupStageScore: gameStatisticsByUserIdMap[user.id]?.group_score || 0,
              groupStageQualifiersScore: tournamentGuessesByUserIdMap[user.id]?.qualified_teams_score || 0,
              playoffScore: gameStatisticsByUserIdMap[user.id]?.playoff_score || 0,
              honorRollScore: tournamentGuessesByUserIdMap[user.id]?.honor_roll_score || 0,
              individualAwardsScore: tournamentGuessesByUserIdMap[user.id]?.individual_awards_score || 0,

              totalPoints: (
                (gameStatisticsByUserIdMap[user.id]?.total_score || 0) +
                (tournamentGuessesByUserIdMap[user.id]?.qualified_teams_score || 0) +
                (tournamentGuessesByUserIdMap[user.id]?.honor_roll_score || 0) +
                (tournamentGuessesByUserIdMap[user.id]?.individual_awards_score || 0)
              )
            }) as UserScore) )
          ];
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
            color={prodeGroup.theme?.secondary_color || ''}
      >
        <Grid>
          {prodeGroup.name.toLowerCase() === 'welltech' && (
            <img src={'/welltech-logo.jpeg'} alt={'Grupo Welltech'} height={60} width={150}/>
          )}
          {prodeGroup.theme?.logo && (
            <img src={prodeGroup.theme?.logo} alt={prodeGroup.name} height={64} width={64} style={{
              borderRadius: '8px'
            }}/>
          )}
        </Grid>
        <Grid>
          <Typography variant={'h2'} fontWeight={'bold'}>
          {prodeGroup.name}
          </Typography>
        </Grid>
      </Grid>
      <Grid container spacing={2} p={2} justifyContent={'center'}>
        <Grid size={{ xs:12, md :8 }}>
          <ProdeGroupTable
            users={usersMap}
            userScoresByTournament={userScoresByTournament}
            loggedInUser={user.id}
            tournaments={tournaments}
            action={isAdmin && (
              <InviteFriendsDialogButton
                groupName={prodeGroup.name}
                groupId={prodeGroup.id}/>
            )}
          />
        </Grid>
        {prodeGroup.owner_user_id === user.id && (
          <Grid size={{ xs:12, md : 4 }}>
           <ProdeGroupThemer group={prodeGroup}/>
          </Grid>
        ) || <></>}
      </Grid>
      {searchParams.hasOwnProperty('recentlyJoined') && (<JoinMessage />)}
    </Box>
  )

}
