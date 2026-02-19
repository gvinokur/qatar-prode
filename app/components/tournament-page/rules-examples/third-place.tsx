'use client'

import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

export default function ThirdPlaceExample() {
  const t = useTranslations('rules.examples')

  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {t('thirdPlace')}
      </Typography>
    </Box>
  )
} 