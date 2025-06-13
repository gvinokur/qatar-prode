'use client'

import { Box, Typography } from '@mui/material'

export default function WinnerDrawExample() {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        Ejemplo: Si predices que Argentina ganará contra Brasil y efectivamente Argentina gana, obtienes 1 punto.
        Si predices un empate y el partido termina en empate, también obtienes 1 punto.
      </Typography>
    </Box>
  )
} 