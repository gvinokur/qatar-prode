'use server'

import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import {Box, Grid, Typography} from "../../../components/mui-wrappers";
import {redirect} from "next/navigation";
import {DebugObject} from "../../../components/debug";
import {findParticipantsInGroup, findProdeGroupById} from "../../../db/prode-group-repository";
import JoinMessage from "../../../components/friend-groups/friend-groups-join-message";
import {findUsersByIds} from "../../../db/users-repository";
import ProdeGroupTable from "../../../components/friend-groups/friends-group-table";
import AdminTabs from "../../../components/friend-groups/admin-tabs";
import HistoryTab from "../../../components/leaderboard/HistoryTab";
import {getLoggedInUser} from "../../../actions/user-actions";
import ProdeGroupThemer from "../../../components/friend-groups/friend-groups-themer";
import {findAllActiveTournaments} from "../../../db/tournament-repository";
import { toMap} from "../../../utils/ObjectUtils";
import {InviteFriendsDialogButton} from "../../../components/friend-groups/invite-friends-dialog-button";
import {getThemeLogoUrl} from "../../../utils/theme-utils";
import { getGroupTournamentBettingConfigAction, getGroupTournamentBettingPaymentsAction } from '../../../actions/group-tournament-betting-actions';
import LeaveGroupButton from '../../../components/friend-groups/leave-group-button';
import { getUserScoresForTournament } from "../../../actions/prode-group-actions";
import { findQualifiedTeams } from "../../../db/team-repository";
import { getTournamentStartDate } from "../../../actions/tournament-actions";
import { generateShortUrlForGroup } from '../../../actions/short-url-actions';
import type { TournamentBadgeConfig } from "../../../components/leaderboard/types";
import { getScoreHistoryForGroup } from '../../../actions/score-history-actions';
import { computeSnapshotScores } from '../../../utils/score-history-utils'
import { buildPageMetadata } from '../../../utils/metadata-utils';

type Props = {
  readonly params: Promise<{
    id: string
    locale: string
  }>,
  readonly searchParams: Promise<{[k:string]:string}>
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const locale = await getLocale()
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const tGroups = await getTranslations({ locale, namespace: 'groups' })
  const appName = tCommon('app.name')

  try {
    const group = await findProdeGroupById(id)
    if (!group) return { title: appName }

    const title = `${group.name} | ${appName}`
    const description = tGroups('metadata.description', { name: group.name })

    return buildPageMetadata(title, description)
  } catch {
    return { title: appName }
  }
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
  // Calculate user scores, qualified teams, and start date for each active tournament (in parallel per-tournament)
  const now = new Date()
  const tournamentData = await Promise.all(
    tournaments.map(async (tournament) => {
      const [scores, qualifiedTeamsResult, tournamentStartDate] = await Promise.all([
        getUserScoresForTournament(allParticipants, tournament.id),
        findQualifiedTeams(tournament.id),
        getTournamentStartDate(tournament.id),
      ])
      const badgeConfig: TournamentBadgeConfig = {
        tournamentStarted: now >= tournamentStartDate,
        championPoints: tournament.champion_points ?? 5,
        runnerUpPoints: tournament.runner_up_points ?? 3,
        thirdPlacePoints: tournament.third_place_points ?? 1,
        individualAwardPoints: tournament.individual_award_points ?? 0,
        totalQualifyingSlots: qualifiedTeamsResult.teams.length,
      }
      return { tournamentId: tournament.id, scores, badgeConfig }
    })
  )

  const userScoresByTournament = Object.fromEntries(
    tournamentData.map(({ tournamentId, scores }) => [tournamentId, scores])
  )
  const tournamentBadgeConfigs = Object.fromEntries(
    tournamentData.map(({ tournamentId, badgeConfig }) => [tournamentId, badgeConfig])
  )

  let logoUrl = getThemeLogoUrl(prodeGroup.theme)

  const shortUrlRecord = await generateShortUrlForGroup(prodeGroup.id)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://prodemundial.app'
  const shareJoinUrl = `${baseUrl}/j/${shortUrlRecord.code}`

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

  // Fetch score history per tournament for the History tab
  const historyByTournament = Object.fromEntries(
    await Promise.all(
      tournaments.map(async (tournament) => [
        tournament.id,
        await getScoreHistoryForGroup(allParticipants, tournament.id),
      ])
    )
  );

  // Patch snapshot scores onto user scores for rank-change tracking
  const patchedUserScoresByTournament = Object.fromEntries(
    Object.entries(userScoresByTournament).map(([tournamentId, scores]) => {
      const historyResult = historyByTournament[tournamentId]
      if (!historyResult) return [tournamentId, scores]
      const snapshotMap = computeSnapshotScores(historyResult.userHistories)
      return [
        tournamentId,
        scores.map(score => {
          const snapshots = snapshotMap.get(score.userId)
          return {
            ...score,
            latestSnapshotPoints: snapshots?.latest,
            penultimateSnapshotPoints: snapshots?.penultimate,
          }
        })
      ]
    })
  );

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
      <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 2 }}>
        <Grid container spacing={2} justifyContent={'center'}>
          <Grid size={{ xs:12, md :9 }}>
            <AdminTabs
              isAdmin={prodeGroup.owner_user_id === user.id || !!members.find(m => m.id === user.id)?.is_admin}
              standingsContent={
                <ProdeGroupTable
                  users={usersMap}
                  userScoresByTournament={patchedUserScoresByTournament}
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
                  members={members}
                  bettingData={bettingData}
                  selectedTournamentId={searchParams.tournament}
                  groupName={prodeGroup.name}
                  joinUrl={shareJoinUrl}
                  themeColor={prodeGroup.theme?.primary_color ?? undefined}
                  tournamentBadgeConfigs={tournamentBadgeConfigs}
                  historyByTournament={historyByTournament}
                />
              }
              historyContent={
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {tournaments.map((tournament) => (
                    <Box key={tournament.id}>
                      {tournaments.length > 1 && (
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, px: 1 }}>
                          {tournament.long_name}
                        </Typography>
                      )}
                      <HistoryTab
                        historyData={historyByTournament[tournament.id]}
                        themeColor={prodeGroup.theme?.primary_color ?? undefined}
                      />
                    </Box>
                  ))}
                </Box>
              }
            />
          </Grid>
          {(prodeGroup.owner_user_id === user.id || members.find(m => m.id === user.id)?.is_admin) && (
            <Grid size={{ xs:12, md : 3 }}>
             <ProdeGroupThemer group={prodeGroup}/>
            </Grid>
          ) || <></>}
        </Grid>
        {searchParams.hasOwnProperty('recentlyJoined') && (<JoinMessage />)}
      </Box>
    </Box>
  )
}
