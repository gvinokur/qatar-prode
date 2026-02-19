'use client'

import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

export default function RoundOf16Example() {
  const t = useTranslations('rules.examples')

  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {t('roundOf16')}
      </Typography>
    </Box>
  )
} 