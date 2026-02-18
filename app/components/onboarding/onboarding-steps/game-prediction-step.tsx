'use client'

import { Box, Typography, Alert, Paper } from '@mui/material'
import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { MockGuessesContextProvider } from '../demo/onboarding-demo-context'
import GameCardOnboardingDemo from '../demo/game-card-onboarding-demo'
import { CompactPredictionDashboard } from '@/app/components/compact-prediction-dashboard'
import {
  DEMO_TEAMS_MAP,
  DEMO_GAMES,
  DEMO_DASHBOARD_PROPS,
  DEMO_TOURNAMENT,
  DEMO_TOURNAMENT_PREDICTIONS,
} from '../demo/demo-data'
import type { ExtendedGameData } from '@/app/definitions'

export default function GamePredictionStep() {
  const t = useTranslations('onboarding.steps.gamePrediction')

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
        {t('title')}
      </Typography>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        {t('clickToFlip')}
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <MockGuessesContextProvider>
          {/* Dashboard */}
          <Box sx={{ mb: 3, maxWidth: 900, mx: 'auto' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('dashboardLabel')}
            </Typography>
            <CompactPredictionDashboard
              {...DEMO_DASHBOARD_PROPS}
              games={DEMO_GAMES as ExtendedGameData[]}
              teamsMap={DEMO_TEAMS_MAP}
              tournamentId={DEMO_TOURNAMENT.id}
              tournamentStartDate={new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)}
              tournamentPredictions={DEMO_TOURNAMENT_PREDICTIONS}
              demoMode={true}
            />
          </Box>

          {/* Game Cards */}
          <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              {t('cardInstructions')}
            </Typography>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 4,
              justifyItems: 'center'
            }}>
              <GameCardOnboardingDemo
                game={DEMO_GAMES[0]}
                teamsMap={DEMO_TEAMS_MAP}
                isPlayoffs={false}
                isEditing={editingGameId === DEMO_GAMES[0].id}
                onEditStart={() => handleEditStart(DEMO_GAMES[0].id)}
                onEditEnd={handleEditEnd}
                label={t('groupGameLabel')}
              />
              <GameCardOnboardingDemo
                game={DEMO_GAMES[1]}
                teamsMap={DEMO_TEAMS_MAP}
                isPlayoffs={true}
                isEditing={editingGameId === DEMO_GAMES[1].id}
                onEditStart={() => handleEditStart(DEMO_GAMES[1].id)}
                onEditEnd={handleEditEnd}
                label={t('playoffGameLabel')}
                demoNote={t('demoNote')}
              />
            </Box>
          </Box>
        </MockGuessesContextProvider>

        {showCardSuccess && (
          <Alert
            severity="success"
            onClose={() => setShowCardSuccess(false)}
            sx={{ mt: 2 }}
          >
            {t('successAlert')}
          </Alert>
        )}
      </Paper>

      <Typography variant="caption" display="block" align="center" sx={{ mt: 2 }}>
        {t('infoTip')}
      </Typography>
    </Box>
  )
}
