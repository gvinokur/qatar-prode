'use server'

import {Box, Grid, Typography} from "../../../../components/mui-wrappers";
import {redirect} from "next/navigation";
import {DebugObject} from "../../../../components/debug";
import {findParticipantsInGroup, findProdeGroupById} from "../../../../db/prode-group-repository";
import JoinMessage from "../../../../components/friend-groups/friend-groups-join-message";
import {findUsersByIds} from "../../../../db/users-repository";
import ProdeGroupTable from "../../../../components/friend-groups/friends-group-table";
import {getLoggedInUser} from "../../../../actions/user-actions";
import ProdeGroupThemer from "../../../../components/friend-groups/friend-groups-themer";
import {findTournamentById} from "../../../../db/tournament-repository";
import { toMap} from "../../../../utils/ObjectUtils";
import {InviteFriendsDialogButton} from "../../../../components/friend-groups/invite-friends-dialog-button";
import {getThemeLogoUrl} from "../../../../utils/theme-utils";
import { getGroupTournamentBettingConfigAction, getGroupTournamentBettingPaymentsAction } from '../../../../actions/group-tournament-betting-actions';
import LeaveGroupButton from '../../../../components/friend-groups/leave-group-button';
import { getUserScoresForTournament } from "../../../../actions/prode-group-actions";

type Props = {
  readonly params: Promise<{
    id: string  // tournament ID
    group_id: string  // friend group ID
  }>,
  readonly searchParams: Promise<{[k:string]:string}>
}

export default async function TournamentScopedFriendGroup(props : Props){
  const params = await props.params
  const searchParams = await props.searchParams
  const user = await getLoggedInUser()
  const prodeGroup = await findProdeGroupById(params.group_id)
  const tournament = await findTournamentById(params.id)

  if(!prodeGroup || !user || !tournament) {
    redirect(`/tournaments/${params.id}`)
  }

  const participants = await findParticipantsInGroup(prodeGroup.id)
  const allParticipants = [
    prodeGroup.owner_user_id,
    ...participants.map(({user_id}) => user_id)
  ]

  const users = await findUsersByIds(allParticipants)
  const usersMap = toMap(users)

  // Get scores only for this tournament
  const userScores = await getUserScoresForTournament(allParticipants, tournament.id)
  const userScoresByTournament = {
    [tournament.id]: userScores
  }

  let logoUrl = getThemeLogoUrl(prodeGroup.theme)

  const members = users.map(u => ({ id: u.id, nombre: u.nickname || u.email, is_admin: participants.find((p: any) => p.user_id === u.id)?.is_admin || false }));

  // Fetch betting config and payments for this tournament only
  const config = await getGroupTournamentBettingConfigAction(prodeGroup.id, tournament.id);
  let payments: any[] = [];
  if (config) {
    payments = await getGroupTournamentBettingPaymentsAction(config.id);
  }
  const bettingData = {
    [tournament.id]: { config, payments }
  };

  return (
    <Box>
      {searchParams.hasOwnProperty('debug') && (
        <DebugObject object={{
          prodeGroup,
          tournament,
          searchParams,
          users,
          userScoresByTournament
        }}/>
      )}
      <Grid container spacing={2}
            mx={-2}
            pl={2}
            pt={1}
            bgcolor={prodeGroup.theme?.primary_color || ''}
            color={prodeGroup.theme?.secondary_color || ''}
            alignItems="center"
            justifyContent="center"
            direction="row"
      >
        <Grid>
          {logoUrl && (
            <Box
              component="img"
              src={logoUrl}
              alt={prodeGroup.name}
              sx={{
                maxHeight: { xs: 32, sm: 40, md: 48 },
                borderRadius: '8px',
              }}
            />
          )}
        </Grid>
        <Grid>
          <Typography
            sx={{
              textAlign: { xs: 'center', sm: 'center', md: 'left' },
              fontWeight: 'bold',
              fontSize: { xs: '2rem', sm: '2.2rem', md: '2.8rem' },
              lineHeight: 1.1
            }}
            variant={undefined}
            component="h1"
          >
            {prodeGroup.name}
          </Typography>
        </Grid>
      </Grid>
      <Grid container spacing={2} p={2} justifyContent={'center'}>
        <Grid size={12}>
          <ProdeGroupTable
            users={usersMap}
            userScoresByTournament={userScoresByTournament}
            loggedInUser={user.id}
            tournaments={[tournament]}  // Only this tournament
            action={prodeGroup.owner_user_id === user.id ? (
              <InviteFriendsDialogButton
                groupName={prodeGroup.name}
                groupId={prodeGroup.id}/>
            ) : (
              <LeaveGroupButton groupId={prodeGroup.id} />

            )}
            groupId={prodeGroup.id}
            ownerId={prodeGroup.owner_user_id}
            members={members}
            bettingData={bettingData}
            selectedTournamentId={tournament.id}  // Pre-select this tournament
          />
        </Grid>
        {(prodeGroup.owner_user_id === user.id || members.find(m => m.id === user.id)?.is_admin) && (
          <Grid size={12}>
           <ProdeGroupThemer group={prodeGroup}/>
          </Grid>
        ) || <></>}
      </Grid>
      {searchParams.hasOwnProperty('recentlyJoined') && (<JoinMessage />)}
    </Box>
  )
}
