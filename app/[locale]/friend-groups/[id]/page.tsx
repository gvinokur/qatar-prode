'use server'

import {Box, Grid, Typography} from "../../../components/mui-wrappers";
import {redirect} from "next/navigation";
import {DebugObject} from "../../../components/debug";
import {findParticipantsInGroup, findProdeGroupById} from "../../../db/prode-group-repository";
import JoinMessage from "../../../components/friend-groups/friend-groups-join-message";
import {findUsersByIds} from "../../../db/users-repository";
import ProdeGroupTable from "../../../components/friend-groups/friends-group-table";
import {getLoggedInUser} from "../../../actions/user-actions";
import ProdeGroupThemer from "../../../components/friend-groups/friend-groups-themer";
import {findAllActiveTournaments} from "../../../db/tournament-repository";
import { toMap} from "../../../utils/ObjectUtils";
import {InviteFriendsDialogButton} from "../../../components/friend-groups/invite-friends-dialog-button";
import {getThemeLogoUrl} from "../../../utils/theme-utils";
import { getGroupTournamentBettingConfigAction, getGroupTournamentBettingPaymentsAction } from '../../../actions/group-tournament-betting-actions';
import LeaveGroupButton from '../../../components/friend-groups/leave-group-button';
import { getUserScoresForTournament } from "../../../actions/prode-group-actions";

type Props = {
  readonly params: Promise<{
    id: string
  }>,
  readonly searchParams: Promise<{[k:string]:string}>
}

export default async function FriendsGroup(props : Props){
  const params = await props.params
  const searchParams = await props.searchParams
  const user = await getLoggedInUser()
  const prodeGroup = await findProdeGroupById(params.id)
  if(!prodeGroup || !user) {
    redirect("/es")
  }

  const tournaments = await findAllActiveTournaments(user.id)

  const participants = await findParticipantsInGroup(prodeGroup.id)
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
        tournaments.map(async (tournament) => [
            tournament.id,
            await getUserScoresForTournament(allParticipants, tournament.id)
          ]
      )))

  let logoUrl = getThemeLogoUrl(prodeGroup.theme)

  const members = users.map(u => ({ id: u.id, nombre: u.nickname || u.email, is_admin: participants.find((p: any) => p.user_id === u.id)?.is_admin || false }));

  // Fetch betting config and payments for each tournament
  const bettingData: { [tournamentId: string]: { config: any, payments: any[] } } = {};
  for (const tournament of tournaments) {
    const config = await getGroupTournamentBettingConfigAction(prodeGroup.id, tournament.id);
    let payments: any[] = [];
    if (config) {
      payments = await getGroupTournamentBettingPaymentsAction(config.id);
    }
    bettingData[tournament.id] = { config, payments };
  }

  return (
    <Box>
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
        <Grid size={{ xs:12, md :8 }}>
          <ProdeGroupTable
            users={usersMap}
            userScoresByTournament={userScoresByTournament}
            loggedInUser={user.id}
            tournaments={tournaments}
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
            selectedTournamentId={searchParams.tournament}
          />
        </Grid>
        {(prodeGroup.owner_user_id === user.id || members.find(m => m.id === user.id)?.is_admin) && (
          <Grid size={{ xs:12, md : 4 }}>
           <ProdeGroupThemer group={prodeGroup}/>
          </Grid>
        ) || <></>}
      </Grid>
      {searchParams.hasOwnProperty('recentlyJoined') && (<JoinMessage />)}
    </Box>
  )
}
