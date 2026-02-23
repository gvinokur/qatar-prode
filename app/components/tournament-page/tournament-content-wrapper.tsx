'use client'

import { Box } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { ReactNode } from 'react'

interface TournamentContentWrapperProps {
  readonly children: ReactNode
}

export default function TournamentContentWrapper({ children }: TournamentContentWrapperProps) {
  const theme = useTheme()

  return (
    <Box sx={{
      backgroundColor: alpha(theme.palette.primary.main, 0.02),
      p: 2
    }}>
      {children}
    </Box>
  )
}
