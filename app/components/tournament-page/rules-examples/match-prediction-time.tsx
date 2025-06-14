'use client'

import { Box, Typography } from '@mui/material'

export default function MatchPredictionTimeExample() {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        Ejemplo: Si un partido comienza a las 15:00, podrás modificar tu pronóstico hasta las 14:00.
        Después de ese momento, el pronóstico quedará bloqueado y no podrá ser modificado.
      </Typography>
    </Box>
  )
} 