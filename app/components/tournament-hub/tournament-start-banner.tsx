'use client'

import React from 'react'
import { Paper, Stack, Typography, Button } from '@mui/material'
import { EmojiEvents as EmojiEventsIcon } from '@mui/icons-material'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import type { Locale } from '../../../i18n.config'

interface TournamentStartBannerProps {
  readonly locale: Locale
  readonly tournamentId: string
}

export function TournamentStartBanner({
  locale,
  tournamentId,
}: TournamentStartBannerProps) {
  const t = useTranslations('hub')

  return (
    <Paper
      sx={{
        background: 'linear-gradient(135deg, #7B1FA2 0%, #4A148C 100%)',
        p: 3,
        mb: 2,
        textAlign: 'center',
        borderRadius: 2,
      }}
    >
      <Stack direction="column" alignItems="center" spacing={1}>
        <EmojiEventsIcon sx={{ fontSize: 40, color: 'white' }} />
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          {t('tournamentStarted.title')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
          {t('tournamentStarted.subtitle')}
        </Typography>
        <Button
          component={Link}
          href={`/${locale}/tournaments/${tournamentId}`}
          variant="contained"
          sx={{
            mt: 1,
            backgroundColor: 'white',
            color: 'primary.dark',
            '&:hover': { backgroundColor: 'grey.100' },
          }}
        >
          {t('tournamentStarted.seeGames')}
        </Button>
      </Stack>
    </Paper>
  )
}
