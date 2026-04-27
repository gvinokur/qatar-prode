'use client'

import { useState } from 'react'
import { Button } from '@mui/material'
import dynamic from 'next/dynamic'

const OnboardingDialogClient = dynamic(
  () => import('../onboarding/onboarding-dialog-client'),
  { ssr: false }
)

interface TutorialDialogButtonProps {
  readonly label: string
}

export function TutorialDialogButton({ label }: TutorialDialogButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outlined" size="small" sx={{ flexShrink: 0 }} onClick={() => setOpen(true)}>
        {label}
      </Button>
      {open && <OnboardingDialogClient initialOpen={true} onClose={() => setOpen(false)} />}
    </>
  )
}
