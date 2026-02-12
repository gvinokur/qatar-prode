'use client'

import { Box, Typography, Alert, Paper, Stack } from '@mui/material'
import { useState, useCallback } from 'react'
import TeamSelector from '@/app/components/awards/team-selector'
import { DEMO_TEAMS } from '../demo/demo-data'

export default function TournamentAwardsStep() {
  // Success message state
  const [showTeamSuccess, setShowTeamSuccess] = useState(false)

  // Selected tournament predictions
  const [championTeamId, setChampionTeamId] = useState<string>('')
  const [runnerUpTeamId, setRunnerUpTeamId] = useState<string>('')
  const [thirdPlaceTeamId, setThirdPlaceTeamId] = useState<string>('')

  // Handle team selection
  const handleTeamSelect = useCallback((type: 'champion' | 'runnerUp' | 'thirdPlace', teamId: string) => {
    if (type === 'champion') {
      setChampionTeamId(teamId)
    } else if (type === 'runnerUp') {
      setRunnerUpTeamId(teamId)
    } else if (type === 'thirdPlace') {
      setThirdPlaceTeamId(teamId)
    }

    if (teamId && !showTeamSuccess) {
      setShowTeamSuccess(true)
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setShowTeamSuccess(false)
      }, 5000)
    }
  }, [showTeamSuccess])

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom align="center">
        🎖️ Predicciones del Torneo
      </Typography>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Predice el campeón, subcampeón y tercer lugar del torneo
      </Typography>

      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Stack spacing={2}>
            <TeamSelector
              label="Campeón"
              teams={DEMO_TEAMS}
              selectedTeamId={championTeamId}
              name="champion"
              disabled={false}
              helperText="Selecciona el equipo que predigas que ganará el torneo"
              onChange={(teamId) => handleTeamSelect('champion', teamId)}
            />
            <TeamSelector
              label="Subcampeón"
              teams={DEMO_TEAMS}
              selectedTeamId={runnerUpTeamId}
              name="runnerUp"
              disabled={false}
              helperText="Selecciona el equipo que predigas que llegará a la final"
              onChange={(teamId) => handleTeamSelect('runnerUp', teamId)}
            />
            <TeamSelector
              label="Tercer Lugar"
              teams={DEMO_TEAMS}
              selectedTeamId={thirdPlaceTeamId}
              name="thirdPlace"
              disabled={false}
              helperText="Selecciona el equipo que predigas que quedará tercero"
              onChange={(teamId) => handleTeamSelect('thirdPlace', teamId)}
            />
          </Stack>

          {showTeamSuccess && (
            <Alert
              severity="success"
              onClose={() => setShowTeamSuccess(false)}
              sx={{ mt: 2 }}
            >
              ¡Genial! Selecciona tus predicciones para el torneo.
            </Alert>
          )}
        </Paper>

        <Typography variant="caption" display="block" align="center" sx={{ mt: 2 }}>
          💡 Estas predicciones son de demostración. Podrás hacer tus predicciones reales después del onboarding.
        </Typography>
      </Box>
    </Box>
  )
}
