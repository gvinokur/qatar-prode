'use server'

import {Box, Grid, Typography} from "../../../../../components/mui-wrappers";
import {redirect} from "next/navigation";
import {DebugObject} from "../../../../../components/debug";
import {findParticipantsInGroup, findProdeGroupById} from "../../../../../db/prode-group-repository";
import {findPendingJoinRequest} from "../../../../../db/prode-group-join-request-repository";
import JoinMessage from "../../../../../components/friend-groups/friend-groups-join-message";
import {findUsersByIds} from "../../../../../db/users-repository";
import ProdeGroupTable from "../../../../../components/friend-groups/friends-group-table";
import {getLoggedInUser} from "../../../../../actions/user-actions";
import ProdeGroupThemer from "../../../../../components/friend-groups/friend-groups-themer";
import {findTournamentById} from "../../../../../db/tournament-repository";
import { toMap} from "../../../../../utils/ObjectUtils";
import {InviteFriendsDialogButton} from "../../../../../components/friend-groups/invite-friends-dialog-button";
import {getThemeLogoUrl} from "../../../../../utils/theme-utils";
import { getGroupTournamentBettingConfigAction, getGroupTournamentBettingPaymentsAction } from '../../../../../actions/group-tournament-betting-actions';
import LeaveGroupButton from '../../../../../components/friend-groups/leave-group-button';
import { getUserScoresForTournament } from "../../../../../actions/prode-group-actions";
import { getGroupJoinRequests, getPendingRequestCount } from "../../../../../actions/prode-group-join-request-actions";
import PendingRequestView from "../../../../../components/friend-groups/pending-request-view";
import AdminTabs from "../../../../../components/friend-groups/admin-tabs";
import JoinRequestManager from "../../../../../components/friend-groups/join-request-manager";
import GroupTournamentBettingAdmin from "../../../../../components/friend-groups/group-tournament-betting-admin";
import PrivacyIndicatorIcon from "../../../../../components/friend-groups/privacy-indicator-icon";
import GroupPrivacySettings from "../../../../../components/friend-groups/group-privacy-settings";

type Props = {
  readonly params: Promise<{
    id: string  // tournament ID
    group_id: string  // friend group ID
    locale: string
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
    redirect(`/${params.locale}/tournaments/${params.id}`)
  }

  // Check user access
  const participants = await findParticipantsInGroup(prodeGroup.id)
  const isOwner = prodeGroup.owner_user_id === user.id;
  const participantRecord = participants.find((p: any) => p.user_id === user.id);
  const isMember = !!participantRecord || isOwner;
  const isAdmin = !!(isOwner || participantRecord?.is_admin);

  // Check for pending join request
  const pendingRequest = await findPendingJoinRequest(prodeGroup.id, user.id);

  // Access control
  if (pendingRequest && !isMember) {
    // Show pending request view
    return (
      <Box p={2}>
        <PendingRequestView
          group={prodeGroup}
          requestId={pendingRequest.id}
          requestedAt={pendingRequest.requested_at}
          memberCount={participants.length}
          tournamentId={tournament.id}
        />
      </Box>
    );
  }

  if (!isMember) {
    // Not a member, redirect to join page
    redirect(`/${params.locale}/friend-groups/join/${prodeGroup.id}`);
  }

  // Build user data
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

  const members = users.map(u => ({
    id: u.id,
    nombre: u.nickname || u.email,
    is_admin: participants.find((p: any) => p.user_id === u.id)?.is_admin || false
  }));

  // Fetch betting config and payments for this tournament only
  const config = await getGroupTournamentBettingConfigAction(prodeGroup.id, tournament.id);
  let payments: any[] = [];
  if (config) {
    payments = await getGroupTournamentBettingPaymentsAction(config.id);
  }
  const bettingData = {
    [tournament.id]: { config, payments }
  };

  // Fetch pending request count for admin badge
  const pendingRequestCount = isAdmin ? await getPendingRequestCount(prodeGroup.id) : 0;

  // Fetch pending join requests for admin
  let joinRequests: any[] = [];
  if (isAdmin) {
    try {
      joinRequests = await getGroupJoinRequests(prodeGroup.id);
    } catch (err) {
      console.error('Error fetching join requests:', err);
    }
  }

  // Check for default tab from URL
  const defaultTab = searchParams.tab === 'admin' && isAdmin ? 'admin' : 'leaderboard';

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
      {/* Group Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          borderLeft: 4,
          borderLeftColor: prodeGroup.theme?.primary_color || 'primary.main',
          bgcolor: prodeGroup.theme?.primary_color
            ? `color-mix(in srgb, ${prodeGroup.theme.primary_color} 5%, transparent)`
            : 'action.hover',
        }}
      >
        {logoUrl && (
          <Box
            component="img"
            src={logoUrl}
            alt={prodeGroup.name}
            sx={{
              maxHeight: { xs: 32, sm: 40, md: 48 },
              borderRadius: '8px',
              flexShrink: 0,
            }}
          />
        )}
        <Typography
          component="h1"
          sx={{
            fontWeight: 600,
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
            lineHeight: 1.2,
            color: 'text.primary',
          }}
        >
          {prodeGroup.name}
        </Typography>
        <PrivacyIndicatorIcon isPublic={prodeGroup.is_public ?? false} size="medium" />
        <Box sx={{ ml: 'auto' }}>
          {isOwner && (
            <InviteFriendsDialogButton
              groupName={prodeGroup.name}
              groupId={prodeGroup.id}
              tournamentId={tournament.id}
            />
          )}
        </Box>
      </Box>

      {/* Content with Tabs */}
      <Grid container spacing={2} p={2} justifyContent={'center'}>
        <Grid size={12}>
          <AdminTabs
            isAdmin={isAdmin}
            defaultTab={defaultTab}
            pendingRequestCount={pendingRequestCount}
            leaderboardContent={
              <ProdeGroupTable
                users={usersMap}
                userScoresByTournament={userScoresByTournament}
                loggedInUser={user.id}
                tournaments={[tournament]}
                groupId={prodeGroup.id}
                members={members}
                bettingData={bettingData}
                selectedTournamentId={tournament.id}
              />
            }
            adminContent={
              <Box>
                {/* Section 1: Join Requests */}
                <Box sx={{ mb: 3 }}>
                  <JoinRequestManager
                    groupId={prodeGroup.id}
                    initialRequests={joinRequests}
                    locale={params.locale as 'en' | 'es'}
                    tournamentId={tournament.id}
                  />
                </Box>

                {/* Section 2: Betting Configuration */}
                <Box sx={{ mb: 3 }}>
                  <GroupTournamentBettingAdmin
                    groupId={prodeGroup.id}
                    tournamentId={tournament.id}
                    isAdmin={isAdmin}
                    members={members}
                    config={config ?? null}
                    payments={payments}
                  />
                </Box>

                {/* Section 3: Privacy Settings */}
                <Box sx={{ mb: 3 }}>
                  <GroupPrivacySettings
                    groupId={prodeGroup.id}
                    groupName={prodeGroup.name}
                    initialIsPublic={prodeGroup.is_public ?? false}
                    initialDescription={prodeGroup.description ?? null}
                  />
                </Box>

                {/* Section 4: Theme Customization */}
                <Box>
                  <ProdeGroupThemer group={prodeGroup} />
                </Box>
              </Box>
            }
          />
        </Grid>
        {!isOwner && (
          <Grid size={12} sx={{ display: 'flex', justifyContent: 'flex-end', px: 2 }}>
            <LeaveGroupButton groupId={prodeGroup.id} tournamentId={tournament.id} />
          </Grid>
        )}
      </Grid>

      {searchParams.hasOwnProperty('recentlyJoined') && (<JoinMessage />)}
    </Box>
  )
}
