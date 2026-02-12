'use client'

import { Box, Typography, Paper } from '@mui/material'
import { MockQualifiedTeamsContextProvider } from '../demo/onboarding-demo-context'
import QualifiedTeamsClientPage from '@/app/components/qualified-teams/qualified-teams-client-page'
import {
  DEMO_GROUPS,
  DEMO_TOURNAMENT,
  DEMO_QUALIFIED_PREDICTIONS_ARRAY,
} from '../demo/demo-data'

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
          <MockQualifiedTeamsContextProvider>
            <QualifiedTeamsClientPage
              tournament={DEMO_TOURNAMENT}
              groups={DEMO_GROUPS}
              initialPredictions={DEMO_QUALIFIED_PREDICTIONS_ARRAY}
              userId="demo-user"
              isLocked={false}
              allowsThirdPlace={false}
              maxThirdPlace={0}
              completeGroupIds={new Set<string>()}
              allGroupsComplete={false}
            />
          </MockQualifiedTeamsContextProvider>
        </Paper>

        <Typography variant="caption" display="block" align="center" sx={{ mt: 2 }}>
          💡 Arrastra los equipos para reordenarlos. Los 2 primeros clasifican automáticamente. Los cambios se guardan automáticamente.
        </Typography>
      </Box>
    </Box>
  )
}
