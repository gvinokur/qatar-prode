'use client'

import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

interface RoundOf16ExampleProps {
  readonly points: number;
}

export default function RoundOf16Example({ points }: RoundOf16ExampleProps) {
  const t = useTranslations('rules.examples')

  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {t('roundOf32', { points })}
      </Typography>
    </Box>
  )
} 