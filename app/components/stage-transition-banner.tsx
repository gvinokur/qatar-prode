'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import { alpha } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Link from 'next/link'

interface StageTransitionBannerProps {
  readonly label: string
  readonly ctaLabel: string
  readonly ctaHref: string
}

export function StageTransitionBanner({ label, ctaLabel, ctaHref }: StageTransitionBannerProps) {
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
      <Button
        component={Link}
        href={ctaHref}
        variant="outlined"
        size="small"
        sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
      >
        {ctaLabel}
      </Button>
    </Box>
  )
}
