'use client'

import React, { useState, useEffect } from 'react'
import { Box, Stack, Typography, Paper, useTheme } from '@mui/material'
import { useTranslations } from 'next-intl'

// ---------------------------------------------------------------------------
// PreTournamentCountdown — exported so ActionCenterCarousel can render it
// ABOVE the "Action Center" header title.
// ---------------------------------------------------------------------------

interface PreTournamentCountdownProps {
  readonly firstGameDate: Date
}

interface TimeLeft {
  days: number
  hours: number
  mins: number
}

function computeTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now())
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return { days, hours, mins }
}

export function PreTournamentCountdown({ firstGameDate }: PreTournamentCountdownProps) {
  const t = useTranslations('hub')
  const theme = useTheme()
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => computeTimeLeft(firstGameDate))

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(computeTimeLeft(firstGameDate)), 1000)
    return () => clearInterval(id)
  }, [firstGameDate])

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
      <Typography variant="overline" color="secondary">
        {t('preTournament.countdownTitle')}
      </Typography>
      <Stack direction="row" justifyContent="center" spacing={4} sx={{ mt: 1 }}>
        <Box textAlign="center">
          <Typography variant="h3" fontWeight="bold" color="secondary">
            {timeLeft.days}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('preTournament.days')}
          </Typography>
        </Box>
        <Box textAlign="center">
          <Typography variant="h3" fontWeight="bold" color="secondary">
            {timeLeft.hours}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('preTournament.hours')}
          </Typography>
        </Box>
        <Box textAlign="center">
          <Typography variant="h3" fontWeight="bold" color="secondary">
            {timeLeft.mins}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('preTournament.mins')}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}
