'use client'

import { Box, Typography, Paper } from '@mui/material'
import QualifiedTeamsOnboardingDemo from '../demo/qualified-teams-onboarding-demo'
import { DEMO_GROUPS } from '../demo/demo-data'

export default function QualifiedTeamsPredictionStep() {
  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom align="center">
        🏆 Ordenar Equipos Clasificados
      </Typography>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Arrastra y suelta para ordenar los equipos del grupo
      </Typography>

      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <QualifiedTeamsOnboardingDemo
            group={DEMO_GROUPS[0].group}
            teams={DEMO_GROUPS[0].teams}
          />
        </Paper>

        <Typography variant="caption" display="block" align="center" sx={{ mt: 2 }}>
          💡 Arrastra los equipos para reordenarlos. Los 2 primeros clasifican automáticamente. Los cambios se guardan automáticamente.
        </Typography>
      </Box>
    </Box>
  )
}
