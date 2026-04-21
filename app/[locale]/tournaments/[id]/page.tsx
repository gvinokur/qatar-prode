'use server'

import { Box } from '@mui/material'
import { getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { toLocale } from '@/app/utils/locale-utils'
import { getLoggedInUser } from '@/app/actions/user-actions'
import { getActionCenterGames, computeIsIncompleteUser } from '@/app/actions/hub-actions'
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

  const user = await getLoggedInUser()
  if (!user) {
    redirect(`/${locale}/tournaments/${id}/games`)
  }

  const actionCenterData = await getActionCenterGames(id, locale)
  const isIncompleteUser = await computeIsIncompleteUser(actionCenterData)

  return (
    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TournamentHubActionCenter tournamentId={id} locale={locale} data={actionCenterData} />

      {!isIncompleteUser && <TournamentHubRecentResults tournamentId={id} locale={locale} />}

      <TournamentHubLeaderboardPeek tournamentId={id} locale={locale} />
    </Box>
  )
}
