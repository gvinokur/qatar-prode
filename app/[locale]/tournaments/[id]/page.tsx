'use server'

import { Suspense } from 'react'
import { Box, Typography } from '@mui/material'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import GroupsIcon from '@mui/icons-material/Groups'
import HistoryIcon from '@mui/icons-material/History'
import { getLocale } from 'next-intl/server'
import { toLocale } from '@/app/utils/locale-utils'
import { getLoggedInUser } from '@/app/actions/user-actions'
import { getActionCenterGames, getPublicTournamentTiming } from '@/app/actions/hub-actions'
import { DashboardCard } from '@/app/components/tournament-hub/dashboard-card'
import { DashboardBanner } from '@/app/components/tournament-hub/dashboard-banner'
import { TournamentHubRecentResults } from '@/app/components/tournament-hub/tournament-hub-recent-results'

type Props = {
  readonly params: Promise<{
    id: string
  }>
}

export default async function TournamentHubPage(props: Props) {
  const { id } = await props.params
  const locale = toLocale(await getLocale())

  const user = await getLoggedInUser()
  const [timing, data] = await Promise.all([
    getPublicTournamentTiming(id, locale),
    user ? getActionCenterGames(id, locale) : Promise.resolve(null),
  ])

  return (
    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* Banner Area */}
      <DashboardBanner user={user} timing={timing} data={data} />

      {/* Widget Grid — CSS Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 2 }}>
        <DashboardCard title="Games" icon={<SportsSoccerIcon />} count="3 pending" urgent>
          <Typography variant="body2" color="text.secondary">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </Typography>
        </DashboardCard>
        <DashboardCard title="Standings" icon={<EmojiEventsIcon />}>
          <Typography variant="body2" color="text.secondary">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </Typography>
        </DashboardCard>
        <DashboardCard title="Groups" icon={<GroupsIcon />} count="2 groups">
          <Typography variant="body2" color="text.secondary">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </Typography>
        </DashboardCard>
        {timing?.tournamentHasStarted && (
          <Suspense fallback={<DashboardCard title="Results" icon={<HistoryIcon fontSize="small" />} />}>
            <TournamentHubRecentResults tournamentId={id} locale={locale} />
          </Suspense>
        )}
      </Box>

    </Box>
  )
}
