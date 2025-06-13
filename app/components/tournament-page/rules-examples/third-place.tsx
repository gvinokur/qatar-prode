'use client'

import { Box, Typography } from '@mui/material'

export default function ThirdPlaceExample() {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        Ejemplo: Si el torneo tiene partido por el tercer lugar y predices que Francia quedará en tercer lugar, obtienes 1 punto si efectivamente Francia gana el partido por el tercer lugar.
        Si el torneo no tiene partido por el tercer lugar, este punto no se otorga.
      </Typography>
    </Box>
  )
} 