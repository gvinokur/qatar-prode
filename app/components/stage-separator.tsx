'use client'

import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import { alpha } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

interface StageSeparatorProps {
  readonly label: string
}

export function StageSeparator({ label }: StageSeparatorProps) {
  return (
    <Box
      sx={{
        gridColumn: '1 / -1',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        mt: 4,
        mb: 2,
      }}
    >
      <Typography
        variant="overline"
        sx={{
          color: 'primary.main',
          letterSpacing: 2,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Typography>
      <Divider sx={{ flexGrow: 1, borderColor: (theme) => alpha(theme.palette.primary.main, 0.2) }} />
    </Box>
  )
}
