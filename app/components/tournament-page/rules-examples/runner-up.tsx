'use client'

import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

interface RunnerUpExampleProps {
  readonly points: number;
}

export default function RunnerUpExample({ points }: RunnerUpExampleProps) {
  const t = useTranslations('rules.examples')

  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {t('runnerUp', { points })}
      </Typography>
    </Box>
  )
} 