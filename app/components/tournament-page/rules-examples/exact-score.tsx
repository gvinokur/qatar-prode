'use client'

import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

interface ExactScoreExampleProps {
  readonly total: number;
  readonly correctOutcome: number;
  readonly bonus: number;
}

export default function ExactScoreExample({ total, correctOutcome, bonus }: ExactScoreExampleProps) {
  const t = useTranslations('rules.examples')

  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {t('exactScore', { total, correctOutcome, bonus })}
      </Typography>
    </Box>
  )
} 