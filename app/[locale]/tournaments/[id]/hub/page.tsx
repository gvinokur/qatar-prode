'use server'

import { Box } from '@mui/material'
import { getLocale } from 'next-intl/server'
import { toLocale } from '@/app/utils/locale-utils'
import { TournamentHubActionCenter } from '@/app/components/tournament-hub/tournament-hub-action-center'
import { TournamentHubLeaderboardPeek } from '@/app/components/tournament-hub/tournament-hub-leaderboard-peek'
import { TournamentHubRecentResults } from '@/app/components/tournament-hub/tournament-hub-recent-results'

type Props = {
  readonly params: Promise<{
    id: string
  }>
}

export default async function TournamentHubPage(props: Props) {
  const { id } = await props.params
  const rawLocale = await getLocale()
  const locale = toLocale(rawLocale)

  return (
    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TournamentHubActionCenter tournamentId={id} locale={locale} />

      <TournamentHubRecentResults tournamentId={id} locale={locale} />

      <TournamentHubLeaderboardPeek tournamentId={id} locale={locale} />
    </Box>
  )
}
