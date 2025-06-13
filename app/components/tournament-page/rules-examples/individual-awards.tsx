'use client'

import { Box, Typography } from '@mui/material'

export default function IndividualAwardsExample() {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        Ejemplo: Si predices que Messi será el mejor jugador del torneo y efectivamente Messi gana el premio, obtienes 3 puntos.
        Si predices que Mbappé será el goleador y efectivamente Mbappé es el goleador, obtienes otros 3 puntos.
        Cada premio individual acertado suma 3 puntos.
      </Typography>
    </Box>
  )
} 