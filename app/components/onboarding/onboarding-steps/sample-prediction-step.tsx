'use client'

import { Box, Typography, Alert, Divider, Paper, Stack } from '@mui/material'
import { useState, useCallback } from 'react'
import { MockGuessesContextProvider, MockQualifiedTeamsContextProvider } from '../demo/onboarding-demo-context'
import FlippableGameCard from '@/app/components/flippable-game-card'
import QualifiedTeamsClientPage from '@/app/components/qualified-teams/qualified-teams-client-page'
import { CompactPredictionDashboard } from '@/app/components/compact-prediction-dashboard'
import TeamSelector from '@/app/components/awards/team-selector'
import {
  DEMO_TEAMS,
  DEMO_TEAMS_MAP,
  DEMO_GAMES,
  DEMO_GROUPS,
  DEMO_DASHBOARD_PROPS,
  DEMO_TOURNAMENT,
  DEMO_QUALIFIED_PREDICTIONS_ARRAY,
} from '../demo/demo-data'

export default function SamplePredictionStep() {
  // Success message states
  const [showCardSuccess, setShowCardSuccess] = useState(false)
  const [showTeamSuccess, setShowTeamSuccess] = useState(false)

  // Track user interactions
  const [hasInteractedWithCard, setHasInteractedWithCard] = useState(false)

  // Edit state management for flippable cards
  const [editingGameId, setEditingGameId] = useState<string | null>(null)

  // Selected tournament predictions
  const [championTeamId, setChampionTeamId] = useState<string>('')
  const [runnerUpTeamId, setRunnerUpTeamId] = useState<string>('')
  const [thirdPlaceTeamId, setThirdPlaceTeamId] = useState<string>('')

  // Handle flippable card edit start
  const handleEditStart = useCallback((gameId: string) => {
    setEditingGameId(gameId)
    if (!hasInteractedWithCard) {
      setHasInteractedWithCard(true)
      setShowCardSuccess(true)
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setShowCardSuccess(false)
      }, 5000)
    }
  }, [hasInteractedWithCard])

  // Handle flippable card edit end
  const handleEditEnd = useCallback(() => {
    setEditingGameId(null)
  }, [])

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
        Explora las Predicciones
      </Typography>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Conoce las nuevas formas de predecir partidos, ordenar equipos y más
      </Typography>

      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        {/* Section 1: Game Predictions - Flippable Cards */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🎴 Predicciones de Partidos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Haz clic en una tarjeta para voltearla y editar tu predicción
          </Typography>

          <MockGuessesContextProvider>
            <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2 }}>
              <FlippableGameCard
                game={DEMO_GAMES[0]}
                teamsMap={DEMO_TEAMS_MAP}
                isPlayoffs={false}
                isEditing={editingGameId === DEMO_GAMES[0].id}
                onEditStart={() => handleEditStart(DEMO_GAMES[0].id)}
                onEditEnd={handleEditEnd}
                silverUsed={0}
                silverMax={5}
                goldenUsed={0}
                goldenMax={2}
                disabled={false}
              />
              <FlippableGameCard
                game={DEMO_GAMES[1]}
                teamsMap={DEMO_TEAMS_MAP}
                isPlayoffs={false}
                isEditing={editingGameId === DEMO_GAMES[1].id}
                onEditStart={() => handleEditStart(DEMO_GAMES[1].id)}
                onEditEnd={handleEditEnd}
                silverUsed={0}
                silverMax={5}
                goldenUsed={0}
                goldenMax={2}
                disabled={false}
              />
            </Box>
          </MockGuessesContextProvider>

          {showCardSuccess && (
            <Alert
              severity="success"
              onClose={() => setShowCardSuccess(false)}
              sx={{ mt: 2 }}
            >
              ¡Perfecto! Haz clic en la tarjeta para editarla. Los cambios se guardan automáticamente.
            </Alert>
          )}
        </Paper>

        <Divider sx={{ my: 3 }} />

        {/* Section 2: Qualified Teams - Drag and Drop */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🏆 Ordenar Equipos Clasificados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Arrastra y suelta para ordenar los equipos en cada grupo
          </Typography>

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

        <Divider sx={{ my: 3 }} />

        {/* Section 3: Unified Dashboard View */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            📊 Vista Unificada de Predicciones
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Todas tus predicciones en un solo lugar
          </Typography>

          <CompactPredictionDashboard {...DEMO_DASHBOARD_PROPS} />

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Vista previa de próximos partidos:
            </Typography>
            <MockGuessesContextProvider>
              <Stack spacing={2}>
                <FlippableGameCard
                  game={DEMO_GAMES[2]}
                  teamsMap={DEMO_TEAMS_MAP}
                  isPlayoffs={false}
                  isEditing={editingGameId === DEMO_GAMES[2].id}
                  onEditStart={() => handleEditStart(DEMO_GAMES[2].id)}
                  onEditEnd={handleEditEnd}
                  silverUsed={0}
                  silverMax={5}
                  goldenUsed={0}
                  goldenMax={2}
                  disabled={false}
                />
                <FlippableGameCard
                  game={DEMO_GAMES[3]}
                  teamsMap={DEMO_TEAMS_MAP}
                  isPlayoffs={false}
                  isEditing={editingGameId === DEMO_GAMES[3].id}
                  onEditStart={() => handleEditStart(DEMO_GAMES[3].id)}
                  onEditEnd={handleEditEnd}
                  silverUsed={0}
                  silverMax={5}
                  goldenUsed={0}
                  goldenMax={2}
                  disabled={false}
                />
              </Stack>
            </MockGuessesContextProvider>
          </Box>
        </Paper>

        <Divider sx={{ my: 3 }} />

        {/* Section 4: Tournament Awards */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🎖️ Predicciones del Torneo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Predice el campeón, subcampeón y tercer lugar
          </Typography>

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
          💡 Todas estas predicciones son de demostración. Tus predicciones reales comenzarán después del onboarding.
        </Typography>
      </Box>
    </Box>
  )
}
