'use client'

import { Box, Typography, Paper } from '@mui/material'
import { useTranslations } from 'next-intl'
import QualifiedTeamsOnboardingDemo from '../demo/qualified-teams-onboarding-demo'
import { DEMO_GROUPS } from '../demo/demo-data'

export default function QualifiedTeamsPredictionStep() {
  const t = useTranslations('onboarding.steps.qualifiedTeams')

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom align="center">
        {t('title')}
      </Typography>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        {t('instructions')}
      </Typography>

      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <QualifiedTeamsOnboardingDemo
            group={DEMO_GROUPS[0].group}
            teams={DEMO_GROUPS[0].teams}
          />
        </Paper>

        <Typography variant="caption" display="block" align="center" sx={{ mt: 2 }}>
          {t('infoTip')}
        </Typography>
      </Box>
    </Box>
  )
}
