'use client'

import { Box, Typography, Button, Paper } from '@mui/material'
import { useRouter } from 'next/navigation'
import LockIcon from '@mui/icons-material/Lock'

type ErrorProps = Readonly<{
  _error: Error & { digest?: string }
  _reset: () => void
}>

export default function TournamentError({
  _error,
  _reset,
}: ErrorProps) {
  const router = useRouter()

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="60vh"
      p={3}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
        <LockIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          You don&apos;t have permission to view this tournament. This is a development
          tournament that requires special access.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          If you believe you should have access, please contact an administrator.
        </Typography>
        <Button
          variant="contained"
          onClick={() => router.push('/')}
          sx={{ mt: 2 }}
        >
          Return to Home
        </Button>
      </Paper>
    </Box>
  )
}
