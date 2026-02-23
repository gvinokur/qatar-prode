'use client'

import { Box } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { ReactNode } from 'react'
import { ScrollShadowContainer } from '@/app/components/common/scroll-shadow-container'

interface ScrollableContentAreaProps {
  readonly children: ReactNode
}

export default function ScrollableContentArea({ children }: ScrollableContentAreaProps) {
  const theme = useTheme()

  return (
    <Box sx={{
      height: '100%',
      width: '100%',
      backgroundColor: alpha(theme.palette.primary.main, 0.06)
    }}>
      <ScrollShadowContainer
        direction="vertical"
        hideScrollbar={true}
        sx={{ height: '100%', width: '100%', p: 2 }}
      >
        {children}
      </ScrollShadowContainer>
    </Box>
  )
}
