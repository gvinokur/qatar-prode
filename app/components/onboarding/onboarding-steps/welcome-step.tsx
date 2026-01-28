'use client'

import { Box, Typography } from '@mui/material'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'

export default function WelcomeStep() {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <SportsSoccerIcon sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />

      <Typography variant="h4" gutterBottom>
        ¡Bienvenido a Qatar Prode!
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 500, mx: 'auto' }}>
        Te guiaremos a través de las funciones principales para que puedas empezar a hacer tus predicciones
        y competir con tus amigos.
      </Typography>

      <Typography variant="body2" sx={{ mt: 3, opacity: 0.7 }}>
        Este tutorial tomará aproximadamente 2 minutos
      </Typography>
    </Box>
  )
}
