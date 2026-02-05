'use client'

import { Box, Button, Typography } from '@mui/material'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

interface LeaderboardErrorProps {
  onRetry?: () => void
}

export default function LeaderboardError({ onRetry }: LeaderboardErrorProps) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 8,
        px: 2
      }}
    >
      <ErrorOutlineIcon
        sx={{
          fontSize: 64,
          color: 'error.main',
          mb: 2
        }}
      />
      <Typography variant="h6" color="text.primary" gutterBottom>
        Failed to load leaderboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        There was an error loading the leaderboard data. Please try again.
      </Typography>
      {onRetry && (
        <Button variant="contained" onClick={onRetry}>
          Retry
        </Button>
      )}
    </Box>
  )
}
