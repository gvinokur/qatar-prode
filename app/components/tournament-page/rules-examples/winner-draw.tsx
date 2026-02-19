'use client'

import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

interface WinnerDrawExampleProps {
  readonly points: number;
}

export default function WinnerDrawExample({ points }: WinnerDrawExampleProps) {
  const t = useTranslations('rules.examples')

  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {t('winnerDraw', { points })}
      </Typography>
    </Box>
  )
} 