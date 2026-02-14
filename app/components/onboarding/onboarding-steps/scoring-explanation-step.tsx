'use client'

import { Box, Typography, Paper, Stack, Chip, Alert, AlertTitle, Divider } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import StarIcon from '@mui/icons-material/Star'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import GroupsIcon from '@mui/icons-material/Groups'
import type { Tournament } from '@/app/db/tables-definition'

// Import DEFAULT_SCORING for fallback values
const DEFAULT_SCORING = {
  game_exact_score_points: 2,
  game_correct_outcome_points: 1,
  champion_points: 5,
  runner_up_points: 3,
  third_place_points: 1,
  individual_award_points: 3,
  qualified_team_points: 1,
  exact_position_qualified_points: 2,
}

interface ScoringExplanationStepProps {
  readonly tournament?: Tournament
}

export default function ScoringExplanationStep({ tournament }: ScoringExplanationStepProps) {
  // Use tournament-specific values or fall back to defaults
  const points = {
    gameExact: tournament?.game_exact_score_points ?? DEFAULT_SCORING.game_exact_score_points,
    gameOutcome: tournament?.game_correct_outcome_points ?? DEFAULT_SCORING.game_correct_outcome_points,
    champion: tournament?.champion_points ?? DEFAULT_SCORING.champion_points,
    runnerUp: tournament?.runner_up_points ?? DEFAULT_SCORING.runner_up_points,
    thirdPlace: tournament?.third_place_points ?? DEFAULT_SCORING.third_place_points,
    individualAward: tournament?.individual_award_points ?? DEFAULT_SCORING.individual_award_points,
    qualifiedTeam: tournament?.qualified_team_points ?? DEFAULT_SCORING.qualified_team_points,
    exactPosition: tournament?.exact_position_qualified_points ?? DEFAULT_SCORING.exact_position_qualified_points,
  }

  // Calculate total for exact position (qualified + exact position bonus)
  const exactPositionTotal = points.qualifiedTeam + points.exactPosition

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom align="center">
        ¿Cómo se Calcula el Puntaje?
      </Typography>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Gana puntos por predicciones correctas en partidos y torneo
      </Typography>

      <Stack spacing={2} sx={{ maxWidth: 550, mx: 'auto' }}>
        {/* Game Scoring */}
        <Paper elevation={2} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <SportsSoccerIcon sx={{ color: 'primary.main' }} />
            <Typography variant="subtitle1" fontWeight="bold">
              Partidos
            </Typography>
          </Box>

          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StarIcon sx={{ fontSize: 20, color: 'gold' }} />
                <Typography variant="body2">Resultado exacto</Typography>
              </Box>
              <Chip label={`${points.gameExact} pts`} size="small" color="primary" />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} />
                <Typography variant="body2">Resultado correcto</Typography>
              </Box>
              <Chip label={`${points.gameOutcome} pt${points.gameOutcome === 1 ? '' : 's'}`} size="small" color="success" />
            </Box>
          </Stack>
        </Paper>

        {/* Tournament Scoring */}
        <Paper elevation={2} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <EmojiEventsIcon sx={{ color: 'warning.main' }} />
            <Typography variant="subtitle1" fontWeight="bold">
              Torneo
            </Typography>
          </Box>

          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">🥇 Campeón</Typography>
              <Chip label={`${points.champion} pts`} size="small" sx={{ bgcolor: 'gold', color: 'black' }} />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">🥈 Subcampeón</Typography>
              <Chip label={`${points.runnerUp} pts`} size="small" sx={{ bgcolor: 'silver', color: 'black' }} />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">🥉 Tercer lugar</Typography>
              <Chip label={`${points.thirdPlace} pt${points.thirdPlace === 1 ? '' : 's'}`} size="small" sx={{ bgcolor: '#CD7F32', color: 'white' }} />
            </Box>
          </Stack>
        </Paper>

        {/* Individual Awards */}
        <Paper elevation={2} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <StarIcon sx={{ color: 'warning.main' }} />
            <Typography variant="subtitle1" fontWeight="bold">
              Premios Individuales
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2">Por cada premio correcto</Typography>
            <Chip label={`${points.individualAward} pts`} size="small" color="warning" />
          </Box>

          <Divider sx={{ my: 1 }} />

          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
            <Chip label="Mejor Jugador" size="small" variant="outlined" />
            <Chip label="Goleador" size="small" variant="outlined" />
            <Chip label="Mejor Arquero" size="small" variant="outlined" />
            <Chip label="Jugador Joven" size="small" variant="outlined" />
          </Stack>

          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
            Total posible: {points.individualAward * 4} pts (4 premios × {points.individualAward} pts)
          </Typography>
        </Paper>

        {/* Qualifiers */}
        <Paper elevation={2} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <GroupsIcon sx={{ color: 'info.main' }} />
            <Typography variant="subtitle1" fontWeight="bold">
              Clasificación
            </Typography>
          </Box>

          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">Posición exacta + clasificado</Typography>
              <Chip label={`${exactPositionTotal} pt${exactPositionTotal === 1 ? '' : 's'}`} size="small" color="info" />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">Clasificado (posición incorrecta)</Typography>
              <Chip label={`${points.qualifiedTeam} pt${points.qualifiedTeam === 1 ? '' : 's'}`} size="small" color="info" variant="outlined" />
            </Box>
          </Stack>
        </Paper>

        {/* Important Note */}
        <Alert severity="info" variant="outlined">
          {tournament ? (
            <>
              <AlertTitle>Configuración de {tournament.long_name || tournament.short_name}</AlertTitle>
              Estos son los valores de puntaje para este torneo específico.
            </>
          ) : (
            <>
              <AlertTitle>Importante</AlertTitle>
              Los valores de puntaje pueden variar según el torneo. Los valores mostrados son típicos.
            </>
          )}
        </Alert>
      </Stack>
    </Box>
  )
}

function SportsSoccerIcon(props: { readonly sx: any }) {
  // Using emoji as fallback since we're using Material-UI icons
  return <Box component="span" sx={{ fontSize: 24, ...props.sx }}>⚽</Box>
}
