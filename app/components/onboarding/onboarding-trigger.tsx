'use client'

import { useEffect, useState } from 'react'
import OnboardingDialog from './onboarding-dialog'

/**
 * Triggers the onboarding dialog with a small delay after page load
 * This allows the page to render first before showing the modal
 */
export default function OnboardingTrigger() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Small delay to let page render first
    const timer = setTimeout(() => {
      setOpen(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return <OnboardingDialog open={open} onClose={() => setOpen(false)} />
}
