'use client'

import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

export default function PodiumPredictionTimeExample() {
  const t = useTranslations('rules.examples')

  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {t('podiumPredictionTime')}
      </Typography>
    </Box>
  )
} 