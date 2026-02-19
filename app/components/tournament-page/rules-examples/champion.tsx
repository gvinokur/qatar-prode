'use client'

import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

interface ChampionExampleProps {
  readonly points: number;
}

export default function ChampionExample({ points }: ChampionExampleProps) {
  const t = useTranslations('rules.examples')

  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {t('champion', { points })}
      </Typography>
    </Box>
  )
} 