import { getTranslations } from 'next-intl/server'
import GroupsIcon from '@mui/icons-material/Groups'
import { getLeaderboardPeekData } from '../../actions/hub-actions'
import { DashboardCard } from './dashboard-card'
import { LeaderboardPeekCard } from './leaderboard-peek-card'
import { SocialHubCard } from './social-hub-card'
import { PreTournamentGroupsPreview } from './pre-tournament-groups-preview'
import type { Locale } from '../../../i18n.config'

interface TournamentHubLeaderboardPeekProps {
  readonly tournamentId: string
  readonly locale: Locale
  readonly isAuthenticated: boolean
}

export async function TournamentHubLeaderboardPeek({
  tournamentId,
  locale,
  isAuthenticated,
}: TournamentHubLeaderboardPeekProps) {
  const t = await getTranslations({ locale, namespace: 'hub' })

  if (!isAuthenticated) {
    return (
      <DashboardCard title={t('groups')} icon={<GroupsIcon fontSize="small" />}>
        <SocialHubCard
          locale={locale}
          tournamentId={tournamentId}
          loginHref={`/${locale}/auth/signin`}
        />
      </DashboardCard>
    )
  }

  const { groups, userHasGroups, allGroupNames } = await getLeaderboardPeekData(tournamentId, locale)

  if (!userHasGroups) {
    return (
      <DashboardCard title={t('groups')} icon={<GroupsIcon fontSize="small" />}>
        <SocialHubCard locale={locale} tournamentId={tournamentId} />
      </DashboardCard>
    )
  }

  if (groups.length === 0) {
    return (
      <DashboardCard title={t('yourStandings')} icon={<GroupsIcon fontSize="small" />}>
        <PreTournamentGroupsPreview
          allGroupNames={allGroupNames}
          locale={locale}
          tournamentId={tournamentId}
        />
      </DashboardCard>
    )
  }

  return (
    <>
      {groups.map((group) => (
        <LeaderboardPeekCard
          key={group.groupId}
          data={group}
          groupLeaderboardHref={`/${locale}/tournaments/${tournamentId}/friend-groups/${group.groupId}`}
        />
      ))}
    </>
  )
}
