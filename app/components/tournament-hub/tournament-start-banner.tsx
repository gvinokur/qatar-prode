'use client'

import React from 'react'
import { Paper, Stack, Typography, useTheme } from '@mui/material'
import { Celebration as CelebrationIcon } from '@mui/icons-material'
import { useTranslations } from 'next-intl'

export function TournamentStartBanner() {
  const t = useTranslations('hub')
  const theme = useTheme()

  return (
    <Paper
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.secondary.main}14 0%, ${theme.palette.secondary.main}08 100%)`,
        border: '1px solid',
        borderColor: 'secondary.light',
        borderRadius: 2,
        p: 3,
        textAlign: 'center',
        mb: 2,
      }}
    >
      <Stack direction="column" alignItems="center" spacing={1}>
        <CelebrationIcon color="secondary" sx={{ fontSize: 40 }} />
        <Typography variant="h6" fontWeight="bold" color="secondary">
          {t('tournamentStarted.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('tournamentStarted.subtitle')}
        </Typography>
      </Stack>
    </Paper>
  )
}
