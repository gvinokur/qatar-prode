'use client'

import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

interface GoalDifferenceExampleProps {
  readonly points: number;
}

export default function GoalDifferenceExample({ points }: GoalDifferenceExampleProps) {
  const t = useTranslations('rules.examples')

  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {t('goalDifference', { points })}
      </Typography>
    </Box>
  )
}
