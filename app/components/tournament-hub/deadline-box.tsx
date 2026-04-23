'use client'
import { Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { StatusWidgetSeverity } from '../../utils/urgency-utils'

interface DeadlineBoxProps {
  readonly severity: StatusWidgetSeverity
  readonly children: React.ReactNode
}

export function DeadlineBox({ severity, children }: DeadlineBoxProps) {
  return (
    <Box
      sx={{
        border: '1px dashed',
        borderColor: severity === 'normal' ? 'divider' : `${severity}.main`,
        borderRadius: 1,
        p: 1,
        bgcolor:
          severity === 'normal'
            ? 'transparent'
            : (theme) => alpha(theme.palette[severity].main, 0.05),
      }}
    >
      {children}
    </Box>
  )
}
