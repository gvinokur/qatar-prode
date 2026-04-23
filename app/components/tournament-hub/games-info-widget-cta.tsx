'use client'

import { useState } from 'react'
import { Button } from '@mui/material'
import Link from 'next/link'
import LoginOrSignupDialog from '../auth/login-or-signup-dialog'

interface GamesInfoWidgetCtaProps {
  readonly isLoggedOff: boolean
  readonly href: string
  readonly label: string
}

export function GamesInfoWidgetCta({ isLoggedOff, href, label }: GamesInfoWidgetCtaProps) {
  const [open, setOpen] = useState(false)

  if (isLoggedOff) {
    return (
      <>
        <Button
          variant="contained"
          color="primary"
          size="small"
          fullWidth
          onClick={() => setOpen(true)}
        >
          {label}
        </Button>
        <LoginOrSignupDialog
          openLoginDialog={open}
          handleCloseLoginDialog={() => setOpen(false)}
        />
      </>
    )
  }

  return (
    <Button
      component={Link}
      href={href}
      variant="contained"
      color="primary"
      size="small"
      fullWidth
    >
      {label}
    </Button>
  )
}
