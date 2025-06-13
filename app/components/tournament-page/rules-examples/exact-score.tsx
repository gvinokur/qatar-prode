'use client'

import { Box, Typography } from '@mui/material'

export default function ExactScoreExample() {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        Ejemplo: Si predices que Argentina ganará 2-1 contra Brasil y efectivamente el resultado es 2-1, obtienes 1 punto extra.
        Si predices 2-1 pero el resultado es 3-2, solo obtienes el punto por acertar el ganador.
      </Typography>
    </Box>
  )
} 