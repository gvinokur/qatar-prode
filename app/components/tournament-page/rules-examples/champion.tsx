'use client'

import { Box, Typography } from '@mui/material'

export default function ChampionExample() {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        Ejemplo: Si predices que Argentina será campeón y efectivamente Argentina gana el torneo, obtienes 5 puntos.
        Si Argentina llega a la final pero pierde, no obtienes los puntos.
      </Typography>
    </Box>
  )
} 