'use client'

import { Chip } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import RemoveIcon from '@mui/icons-material/Remove'
import type { RankChangeIndicatorProps } from './types'

export default function RankChangeIndicator({
  change,
  size = 'small'
}: RankChangeIndicatorProps) {
  if (change > 0) {
    // Rank improved (moved up)
    return (
      <Chip
        icon={<TrendingUpIcon />}
        label={`${change}`}
        size={size}
        sx={{
          backgroundColor: 'success.light',
          color: 'success.contrastText',
          fontWeight: 'bold'
        }}
        aria-label={`Rank improved by ${change} position${change > 1 ? 's' : ''}`}
      />
    )
  }

  if (change < 0) {
    // Rank declined (moved down)
    return (
      <Chip
        icon={<TrendingDownIcon />}
        label={`${Math.abs(change)}`}
        size={size}
        sx={{
          backgroundColor: 'error.light',
          color: 'error.contrastText',
          fontWeight: 'bold'
        }}
        aria-label={`Rank declined by ${Math.abs(change)} position${Math.abs(change) > 1 ? 's' : ''}`}
      />
    )
  }

  // No change
  return (
    <Chip
      icon={<RemoveIcon />}
      label="—"
      size={size}
      sx={{
        backgroundColor: 'grey.300',
        color: 'text.secondary'
      }}
      aria-label="Rank unchanged"
    />
  )
}
