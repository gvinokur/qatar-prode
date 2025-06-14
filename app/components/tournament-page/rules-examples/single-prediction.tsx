'use client'

import { Box, Typography } from '@mui/material'

export default function SinglePredictionExample() {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        Ejemplo: Puedes crear un único pronóstico y utilizarlo en múltiples grupos.
        Por ejemplo, si predices que Argentina será campeón, ese mismo pronóstico se utilizará en todos los grupos donde participes.
        No se permite tener diferentes pronósticos para el mismo torneo.
      </Typography>
    </Box>
  )
} 