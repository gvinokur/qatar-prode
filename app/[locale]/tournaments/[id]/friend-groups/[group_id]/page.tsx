'use server'

import type { Metadata } from 'next'
import {Box, Grid, Typography, Button} from "../../../../../components/mui-wrappers";
import Link from 'next/link';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { getTranslations, getLocale } from 'next-intl/server';
import {redirect} from "next/navigation";
import {DebugObject} from "../../../../../components/debug";
import {findParticipantsInGroup, findProdeGroupById} from "../../../../../db/prode-group-repository";
import {findPendingJoinRequest} from "../../../../../db/prode-group-join-request-repository";
import JoinMessage from "../../../../../components/friend-groups/friend-groups-join-message";
import {findUsersByIds} from "../../../../../db/users-repository";
import ProdeGroupTable from "../../../../../components/friend-groups/friends-group-table";
import {getLoggedInUser} from "../../../../../actions/user-actions";
import {findTournamentById} from "../../../../../db/tournament-repository";
import { toMap} from "../../../../../utils/ObjectUtils";
import {InviteFriendsDialogButton} from "../../../../../components/friend-groups/invite-friends-dialog-button";
import {getThemeLogoUrl} from "../../../../../utils/theme-utils";
import { getGroupTournamentBettingConfigAction, getGroupTournamentBettingPaymentsAction } from '../../../../../actions/group-tournament-betting-actions';
import LeaveGroupButton from '../../../../../components/friend-groups/leave-group-button';
import { getUserScoresForTournament } from "../../../../../actions/prode-group-actions";
import { getTournamentStartDate } from "../../../../../actions/tournament-actions";
import { findQualifiedTeams } from "../../../../../db/team-repository";
import { getGroupJoinRequests, getPendingRequestCount } from "../../../../../actions/prode-group-join-request-actions";
import type { TournamentBadgeConfig } from "../../../../../components/leaderboard/types";
import PendingRequestView from "../../../../../components/friend-groups/pending-request-view";
import AdminTabs from "../../../../../components/friend-groups/admin-tabs";
import HistoryTab from "../../../../../components/leaderboard/HistoryTab";
import PrivacyIndicatorIcon from "../../../../../components/friend-groups/privacy-indicator-icon";
import AdminSectionTabs from "../../../../../components/friend-groups/admin-section-tabs";
import { generateShortUrlForGroup } from '../../../../../actions/short-url-actions';
import { getScoreHistoryForGroup } from '../../../../../actions/score-history-actions';
import { computeSnapshotScores } from '../../../../../utils/score-history-utils'
import { buildPageMetadata } from '../../../../../utils/metadata-utils';

type Props = {
  readonly params: Promise<{
    id: string  // tournament ID
    group_id: string  // friend group ID
    locale: string
  }>,
  readonly searchParams: Promise<{[k:string]:string}>
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string; group_id: string }> }
): Promise<Metadata> {
  const { id, group_id } = await params
  const locale = await getLocale()
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const tGroups = await getTranslations({ locale, namespace: 'groups' })
  const appName = tCommon('app.name')

  try {
    const [group, tournament] = await Promise.all([
      findProdeGroupById(group_id),
      findTournamentById(id),
    ])

    if (!group) return { title: appName }

    const tournamentSuffix = tournament?.short_name ? ` | ${tournament.short_name}` : ''
    const title = `${group.name}${tournamentSuffix} | ${appName}`
    const description = tGroups('metadata.description', { name: group.name })

    return buildPageMetadata(title, description)
  } catch {
    return { title: appName }
  }
}

export default async function TournamentScopedFriendGroup(props : Props){
  const params = await props.params
  const searchParams = await props.searchParams
  const t = await getTranslations('groups')
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

  // Get scores, qualified teams, and tournament start date in parallel for badge config
  const [userScores, qualifiedTeamsResult, tournamentStartDate] = await Promise.all([
    getUserScoresForTournament(allParticipants, tournament.id),
    findQualifiedTeams(tournament.id),
    getTournamentStartDate(tournament.id),
  ])

  // Build badge config from tournament settings + qualified teams count
  // Default points (5, 3, 1) match updateTournamentHonorRoll in backoffice-actions.ts
  const tournamentBadgeConfig: TournamentBadgeConfig = {
    tournamentStarted: new Date() >= tournamentStartDate,
    championPoints: tournament.champion_points ?? 5,
    runnerUpPoints: tournament.runner_up_points ?? 3,
    thirdPlacePoints: tournament.third_place_points ?? 1,
    individualAwardPoints: tournament.individual_award_points ?? 0,
    totalQualifyingSlots: qualifiedTeamsResult.teams.length,
  }
  const tournamentBadgeConfigs = { [tournament.id]: tournamentBadgeConfig }

  let logoUrl = getThemeLogoUrl(prodeGroup.theme)

  const shortUrlRecord = await generateShortUrlForGroup(prodeGroup.id, tournament.id)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://prodemundial.app'
  const shareJoinUrl = `${baseUrl}/j/${shortUrlRecord.code}`

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

  // Fetch score history for this tournament's History tab
  const historyData = await getScoreHistoryForGroup(allParticipants, tournament.id);
  const historyByTournament = { [tournament.id]: historyData };

  // Patch snapshot scores onto user scores for rank-change tracking
  const snapshotScores = computeSnapshotScores(historyData.userHistories)
  const patchedUserScores = userScores.map(score => {
    const snapshots = snapshotScores.get(score.userId)
    return {
      ...score,
      latestSnapshotPoints: snapshots?.latest,
      penultimateSnapshotPoints: snapshots?.penultimate,
    }
  })
  const userScoresByTournament = {
    [tournament.id]: patchedUserScores
  }

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


  return (
    <Box>
      {searchParams.hasOwnProperty('debug') && (
        <DebugObject object={{
          prodeGroup,
          tournament,
          searchParams,
          users,
          userScoresByTournament,
          historyData
        }}/>
      )}
      {/* Back Navigation */}
      <Box sx={{ px: 2, pt: 1 }}>
        <Button
          component={Link}
          href={`/${params.locale}/tournaments/${params.id}/friend-groups`}
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ mb: 1 }}
        >
          {t('actions.backToGroups')}
        </Button>
      </Box>
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
            pendingRequestCount={pendingRequestCount}
            standingsContent={
              <ProdeGroupTable
                users={usersMap}
                userScoresByTournament={userScoresByTournament}
                loggedInUser={user.id}
                tournaments={[tournament]}
                groupId={prodeGroup.id}
                members={members}
                bettingData={bettingData}
                selectedTournamentId={tournament.id}
                groupName={prodeGroup.name}
                joinUrl={shareJoinUrl}
                themeColor={prodeGroup.theme?.primary_color ?? undefined}
                tournamentBadgeConfigs={tournamentBadgeConfigs}
                historyByTournament={historyByTournament}
              />
            }
            historyContent={
              <HistoryTab
                historyData={historyData}
                themeColor={prodeGroup.theme?.primary_color ?? undefined}
              />
            }
            adminContent={
              <AdminSectionTabs
                groupId={prodeGroup.id}
                initialRequests={joinRequests}
                locale={params.locale as 'en' | 'es'}
                tournamentId={tournament.id}
                groupName={prodeGroup.name}
                initialIsPublic={prodeGroup.is_public ?? false}
                initialDescription={prodeGroup.description ?? null}
                isAdmin={isAdmin}
                members={members}
                config={config ?? null}
                payments={payments}
                group={prodeGroup}
                pendingRequestCount={pendingRequestCount}
              />
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
