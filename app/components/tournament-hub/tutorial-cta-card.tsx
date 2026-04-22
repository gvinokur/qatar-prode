'use client'

import { useState } from 'react'
import { Button, Paper, Stack, Typography, Avatar } from '@mui/material'
import { HelpOutline as HelpOutlineIcon } from '@mui/icons-material'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'

// Lazy-load the dialog so it doesn't add to the initial bundle
const OnboardingDialogClient = dynamic(
  () => import('../onboarding/onboarding-dialog-client'),
  { ssr: false }
)

interface TutorialCTACardProps {
  readonly fullWidth?: boolean
}

export function TutorialCTACard({ fullWidth }: TutorialCTACardProps) {
  const t = useTranslations('hub.newUser.tutorial')
  const [open, setOpen] = useState(false)

  return (
    <>
      <Paper variant="outlined" sx={{ p: fullWidth ? 3 : 2, width: fullWidth ? '100%' : undefined }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, flexShrink: 0 }}>
            <HelpOutlineIcon fontSize="small" />
          </Avatar>
          <Stack flexGrow={1} spacing={0.5}>
            <Typography variant="subtitle1" fontWeight="bold">
              {t('title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('subtitle')}
            </Typography>
          </Stack>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => setOpen(true)}
            sx={{ flexShrink: 0 }}
          >
            {t('cta')}
          </Button>
        </Stack>
      </Paper>

      {open && (
        <OnboardingDialogClient initialOpen={true} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
