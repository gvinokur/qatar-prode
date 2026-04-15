'use server'

import { Box, Paper, Typography } from '@mui/material'
import { getTranslations, getLocale } from 'next-intl/server'
import { toLocale } from '@/app/utils/locale-utils'
import { TournamentHubActionCenter } from '@/app/components/tournament-hub/tournament-hub-action-center'

type Props = {
  readonly params: Promise<{
    id: string
  }>
}

export default async function TournamentHubPage(props: Props) {
  const { id } = await props.params
  const rawLocale = await getLocale()
  const locale = toLocale(rawLocale)
  const t = await getTranslations({ locale, namespace: 'hub' })

  const placeholders = [t('predictionDashboard'), t('leaderboardPeek')]

  return (
    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TournamentHubActionCenter tournamentId={id} locale={locale} />

      {placeholders.map((label) => (
        <Paper key={label} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            {label}
          </Typography>
        </Paper>
      ))}
    </Box>
  )
}
