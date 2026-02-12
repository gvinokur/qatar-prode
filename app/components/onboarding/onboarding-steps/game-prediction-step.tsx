'use client'

import { Box, Typography, Alert, Paper } from '@mui/material'
import { useState, useCallback } from 'react'
import { MockGuessesContextProvider } from '../demo/onboarding-demo-context'
import FlippableGameCard from '@/app/components/flippable-game-card'
import { CompactPredictionDashboard } from '@/app/components/compact-prediction-dashboard'
import {
  DEMO_TEAMS_MAP,
  DEMO_GAMES,
  DEMO_DASHBOARD_PROPS,
  DEMO_TOURNAMENT,
} from '../demo/demo-data'
import type { ExtendedGameData } from '@/app/definitions'

export default function GamePredictionStep() {
  // Success message state
  const [showCardSuccess, setShowCardSuccess] = useState(false)

  // Track user interactions
  const [hasInteractedWithCard, setHasInteractedWithCard] = useState(false)

  // Edit state management for flippable cards
  const [editingGameId, setEditingGameId] = useState<string | null>(null)

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

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom align="center">
        🎴 Predicciones de Partidos
      </Typography>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Haz clic en una tarjeta para voltearla y editar tu predicción
      </Typography>

      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        {/* Game Cards */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <MockGuessesContextProvider>
            <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
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

            {/* Dashboard */}
            <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Vista unificada de tus predicciones (haz clic para ver detalles):
              </Typography>
              <CompactPredictionDashboard
                {...DEMO_DASHBOARD_PROPS}
                games={DEMO_GAMES as ExtendedGameData[]}
                teamsMap={DEMO_TEAMS_MAP}
                tournamentId={DEMO_TOURNAMENT.id}
                tournamentStartDate={new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)}
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

        <Typography variant="caption" display="block" align="center" sx={{ mt: 2 }}>
          💡 Estas predicciones son de demostración. Tus predicciones reales comenzarán después del onboarding.
        </Typography>
      </Box>
    </Box>
  )
}
