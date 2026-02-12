'use client'

import { Box, Typography, Alert, Paper, Stack, Autocomplete, TextField, Divider } from '@mui/material'
import { useState, useCallback } from 'react'
import TeamSelector from '@/app/components/awards/team-selector'
import { DEMO_TEAMS, DEMO_PLAYERS } from '../demo/demo-data'
import type { Player } from '@/app/db/tables-definition'

export default function TournamentAwardsStep() {
  // Success message state
  const [showTeamSuccess, setShowTeamSuccess] = useState(false)
  const [showPlayerSuccess, setShowPlayerSuccess] = useState(false)

  // Selected honor roll predictions
  const [championTeamId, setChampionTeamId] = useState<string>('')
  const [runnerUpTeamId, setRunnerUpTeamId] = useState<string>('')
  const [thirdPlaceTeamId, setThirdPlaceTeamId] = useState<string>('')

  // Selected individual awards
  const [bestPlayer, setBestPlayer] = useState<Player | null>(null)
  const [topScorer, setTopScorer] = useState<Player | null>(null)
  const [bestGoalkeeper, setBestGoalkeeper] = useState<Player | null>(null)
  const [bestYoungPlayer, setBestYoungPlayer] = useState<Player | null>(null)

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

  // Handle player selection
  const handlePlayerSelect = useCallback((player: Player | null) => {
    if (player && !showPlayerSuccess) {
      setShowPlayerSuccess(true)
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setShowPlayerSuccess(false)
      }, 5000)
    }
  }, [showPlayerSuccess])

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom align="center">
        🎖️ Predicciones del Torneo
      </Typography>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Predice el podio del torneo y los premios individuales
      </Typography>

      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          {/* Honor Roll Section */}
          <Typography variant="h6" gutterBottom>
            Podio del Torneo
          </Typography>
          <Stack spacing={2} sx={{ mb: 3 }}>
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

          <Divider sx={{ my: 3 }} />

          {/* Individual Awards Section */}
          <Typography variant="h6" gutterBottom>
            Premios Individuales
          </Typography>
          <Stack spacing={2}>
            <Autocomplete
              options={DEMO_PLAYERS}
              getOptionLabel={(option) => `${option.name} (${DEMO_TEAMS.find(t => t.id === option.team_id)?.short_name})`}
              value={bestPlayer}
              onChange={(_, newValue) => {
                setBestPlayer(newValue)
                handlePlayerSelect(newValue)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Mejor Jugador"
                  helperText="Selecciona el mejor jugador del torneo"
                />
              )}
            />
            <Autocomplete
              options={DEMO_PLAYERS}
              getOptionLabel={(option) => `${option.name} (${DEMO_TEAMS.find(t => t.id === option.team_id)?.short_name})`}
              value={topScorer}
              onChange={(_, newValue) => {
                setTopScorer(newValue)
                handlePlayerSelect(newValue)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Goleador"
                  helperText="Selecciona el máximo goleador del torneo"
                />
              )}
            />
            <Autocomplete
              options={DEMO_PLAYERS.filter(p => p.position === 'GK')}
              getOptionLabel={(option) => `${option.name} (${DEMO_TEAMS.find(t => t.id === option.team_id)?.short_name})`}
              value={bestGoalkeeper}
              onChange={(_, newValue) => {
                setBestGoalkeeper(newValue)
                handlePlayerSelect(newValue)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Mejor Arquero"
                  helperText="Selecciona el mejor arquero del torneo"
                />
              )}
            />
            <Autocomplete
              options={DEMO_PLAYERS.filter(p => p.age_at_tournament < 25)}
              getOptionLabel={(option) => `${option.name} (${DEMO_TEAMS.find(t => t.id === option.team_id)?.short_name})`}
              value={bestYoungPlayer}
              onChange={(_, newValue) => {
                setBestYoungPlayer(newValue)
                handlePlayerSelect(newValue)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Mejor Jugador Joven"
                  helperText="Selecciona el mejor jugador joven del torneo"
                />
              )}
            />
          </Stack>

          {showTeamSuccess && (
            <Alert
              severity="success"
              onClose={() => setShowTeamSuccess(false)}
              sx={{ mt: 2 }}
            >
              ¡Genial! Selecciona tus predicciones para el podio.
            </Alert>
          )}

          {showPlayerSuccess && (
            <Alert
              severity="success"
              onClose={() => setShowPlayerSuccess(false)}
              sx={{ mt: 2 }}
            >
              ¡Perfecto! Selecciona los mejores jugadores del torneo.
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
