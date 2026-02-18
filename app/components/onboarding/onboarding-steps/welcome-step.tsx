'use client'

import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'

export default function WelcomeStep() {
  const t = useTranslations('onboarding.steps.welcome')

  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <SportsSoccerIcon sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />

      <Typography variant="h4" gutterBottom>
        {t('title')}
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 500, mx: 'auto' }}>
        {t('description')}
      </Typography>

      <Typography variant="body2" sx={{ mt: 3, opacity: 0.7 }}>
        {t('durationInfo')}
      </Typography>
    </Box>
  )
}
