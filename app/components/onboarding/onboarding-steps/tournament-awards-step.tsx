'use client'

import { Box, Typography, Alert, Paper, Stack, Autocomplete, TextField, Divider } from '@mui/material'
import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import TeamSelector from '@/app/components/awards/team-selector'
import { DEMO_TEAMS, DEMO_PLAYERS } from '../demo/demo-data'
import type { Player } from '@/app/db/tables-definition'

export default function TournamentAwardsStep() {
  const t = useTranslations('onboarding.steps.tournamentAwards')

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
        {t('title')}
      </Typography>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        {t('instructions')}
      </Typography>

      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          {/* Honor Roll Section */}
          <Typography variant="h6" gutterBottom>
            {t('podiumHeader')}
          </Typography>
          <Stack spacing={2} sx={{ mb: 3 }}>
            <TeamSelector
              label={t('champion.label')}
              teams={DEMO_TEAMS}
              selectedTeamId={championTeamId}
              name="champion"
              disabled={false}
              helperText={t('champion.helper')}
              onChange={(teamId) => handleTeamSelect('champion', teamId)}
            />
            <TeamSelector
              label={t('runnerUp.label')}
              teams={DEMO_TEAMS}
              selectedTeamId={runnerUpTeamId}
              name="runnerUp"
              disabled={false}
              helperText={t('runnerUp.helper')}
              onChange={(teamId) => handleTeamSelect('runnerUp', teamId)}
            />
            <TeamSelector
              label={t('thirdPlace.label')}
              teams={DEMO_TEAMS}
              selectedTeamId={thirdPlaceTeamId}
              name="thirdPlace"
              disabled={false}
              helperText={t('thirdPlace.helper')}
              onChange={(teamId) => handleTeamSelect('thirdPlace', teamId)}
            />
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Individual Awards Section */}
          <Typography variant="h6" gutterBottom>
            {t('individualAwardsHeader')}
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
                  label={t('bestPlayer.label')}
                  helperText={t('bestPlayer.helper')}
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
                  label={t('topScorer.label')}
                  helperText={t('topScorer.helper')}
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
                  label={t('bestGoalkeeper.label')}
                  helperText={t('bestGoalkeeper.helper')}
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
                  label={t('bestYoungPlayer.label')}
                  helperText={t('bestYoungPlayer.helper')}
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
              {t('podiumSuccessAlert')}
            </Alert>
          )}

          {showPlayerSuccess && (
            <Alert
              severity="success"
              onClose={() => setShowPlayerSuccess(false)}
              sx={{ mt: 2 }}
            >
              {t('awardsSuccessAlert')}
            </Alert>
          )}
        </Paper>

        <Typography variant="caption" display="block" align="center" sx={{ mt: 2 }}>
          {t('infoTip')}
        </Typography>
      </Box>
    </Box>
  )
}
