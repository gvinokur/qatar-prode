'use client'

import { Box, Typography, Paper, Stack, Chip, Alert, AlertTitle, Divider } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import StarIcon from '@mui/icons-material/Star'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import GroupsIcon from '@mui/icons-material/Groups'

export default function ScoringExplanationStep() {
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
              <Chip label="2 pts" size="small" color="primary" />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} />
                <Typography variant="body2">Resultado correcto</Typography>
              </Box>
              <Chip label="1 pt" size="small" color="success" />
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
              <Chip label="5 pts" size="small" sx={{ bgcolor: 'gold', color: 'black' }} />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">🥈 Subcampeón</Typography>
              <Chip label="3 pts" size="small" sx={{ bgcolor: 'silver', color: 'black' }} />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">🥉 Tercer lugar</Typography>
              <Chip label="1 pt" size="small" sx={{ bgcolor: '#CD7F32', color: 'white' }} />
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
            <Chip label="3 pts" size="small" color="warning" />
          </Box>

          <Divider sx={{ my: 1 }} />

          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
            <Chip label="Mejor Jugador" size="small" variant="outlined" />
            <Chip label="Goleador" size="small" variant="outlined" />
            <Chip label="Mejor Arquero" size="small" variant="outlined" />
            <Chip label="Jugador Joven" size="small" variant="outlined" />
          </Stack>

          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
            Total posible: 12 pts (4 premios × 3 pts)
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
              <Chip label="1 pt" size="small" color="info" />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">Clasificado (posición incorrecta)</Typography>
              <Chip label="1 pt" size="small" color="info" variant="outlined" />
            </Box>
          </Stack>
        </Paper>

        {/* Important Note */}
        <Alert severity="info" variant="outlined">
          <AlertTitle>Importante</AlertTitle>
          Los valores de puntaje pueden variar según el torneo. Los valores mostrados son típicos.
        </Alert>
      </Stack>
    </Box>
  )
}

function SportsSoccerIcon(props: { sx: any }) {
  // Using emoji as fallback since we're using Material-UI icons
  return <Box component="span" sx={{ fontSize: 24, ...props.sx }}>⚽</Box>
}
