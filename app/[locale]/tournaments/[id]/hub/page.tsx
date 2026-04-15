'use server'

import { Box, Paper, Typography } from '@mui/material'
import { getTranslations, getLocale } from 'next-intl/server'

type Props = {
  readonly params: Promise<{
    id: string
  }>
}

export default async function TournamentHubPage(props: Props) {
  await props.params
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'hub' })

  const placeholders = [
    t('smartPredictorCarousel'),
    t('predictionDashboard'),
    t('leaderboardPeek'),
  ]

  return (
    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
