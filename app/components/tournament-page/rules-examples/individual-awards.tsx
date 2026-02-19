'use client'

import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

interface IndividualAwardsExampleProps {
  readonly points: number;
}

export default function IndividualAwardsExample({ points }: IndividualAwardsExampleProps) {
  const t = useTranslations('rules.examples')

  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {t('individualAwards', { points })}
      </Typography>
    </Box>
  )
} 