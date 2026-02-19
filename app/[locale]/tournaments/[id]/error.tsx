'use client'

import { Box, Typography, Button, Paper } from '@mui/material'
import { useRouter } from 'next/navigation'
import LockIcon from '@mui/icons-material/Lock'
import { useLocale, useTranslations } from 'next-intl'

type ErrorProps = Readonly<{
  _error: Error & { digest?: string }
  _reset: () => void
}>

export default function TournamentError({
  _error,
  _reset,
}: ErrorProps) {
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations('errors')

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
          {t('tournament.accessDenied')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {t('tournament.noPermission')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('tournament.contactAdmin')}
        </Typography>
        <Button
          variant="contained"
          onClick={() => router.push(`/${locale}`)}
          sx={{ mt: 2 }}
        >
          {t('returnHome')}
        </Button>
      </Paper>
    </Box>
  )
}
