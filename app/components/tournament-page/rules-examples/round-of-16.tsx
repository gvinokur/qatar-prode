'use client'

import { Box, Typography } from '@mui/material'

export default function RoundOf16Example() {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        Ejemplo: Si predices que Argentina, Brasil, Francia y Portugal clasificarán a octavos de final y efectivamente estos equipos clasifican, obtienes 1 punto por cada uno.
        Si alguno de los equipos que predijiste no clasifica, no obtienes el punto por ese equipo.
      </Typography>
    </Box>
  )
} 