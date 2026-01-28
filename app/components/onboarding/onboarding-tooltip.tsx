'use client'

import { useState } from 'react'
import { Tooltip, IconButton, Box } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { dismissTooltip } from '../../actions/onboarding-actions'

type OnboardingTooltipProps = {
  id: string
  title: string
  content: string
  children: React.ReactElement
  dismissed: boolean
}

/**
 * Reusable tooltip component for onboarding hints
 * Can be dismissed by the user and persists dismissal state to database
 */
export default function OnboardingTooltip({
  id,
  title,
  content,
  children,
  dismissed
}: OnboardingTooltipProps) {
  const [open, setOpen] = useState(!dismissed)

  const handleDismiss = async () => {
    setOpen(false)
    await dismissTooltip(id)
  }

  if (dismissed) {
    return children
  }

  return (
    <Tooltip
      open={open}
      title={
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <strong>{title}</strong>
            <IconButton size="small" onClick={handleDismiss} sx={{ color: 'white', ml: 1 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          {content}
        </Box>
      }
      arrow
      placement="bottom"
    >
      {children}
    </Tooltip>
  )
}
