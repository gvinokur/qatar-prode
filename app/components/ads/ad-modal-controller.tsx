'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import { getAdSettingsAction } from '../../actions/ad-settings-actions'

const STORAGE_KEY = 'ad_last_shown_at'
const DEFAULT_MIN_MINUTES = 30
const DEFAULT_MIN_PAGEVIEWS = 10

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export default function AdModalController() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [minMinutes, setMinMinutes] = useState(DEFAULT_MIN_MINUTES)
  const [minPageviews, setMinPageviews] = useState(DEFAULT_MIN_PAGEVIEWS)
  const pageViewCount = useRef(0)
  const initialized = useRef(false)

  const isAdFree = session?.user?.isAdFree ?? false

  // Load settings once on mount
  useEffect(() => {
    if (isAdFree) return
    getAdSettingsAction()
      .then(({ modalMinMinutesBetween, modalMinPageviewsBetween }) => {
        setMinMinutes(modalMinMinutesBetween)
        setMinPageviews(modalMinPageviewsBetween)
      })
      .catch(() => {
        // Keep defaults on error
      })
  }, [isAdFree])

  // Track page views and check thresholds
  useEffect(() => {
    if (isAdFree) return
    if (!initialized.current) {
      initialized.current = true
      return
    }

    pageViewCount.current += 1

    if (pageViewCount.current < minPageviews) return

    const lastShownAt = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10)
    const minutesElapsed = (Date.now() - lastShownAt) / (1000 * 60)

    if (minutesElapsed < minMinutes) return

    setOpen(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Push ad slot when modal opens
  useEffect(() => {
    if (!open || process.env.NODE_ENV !== 'production') return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // Ad push failed silently
    }
  }, [open])

  function handleClose() {
    pageViewCount.current = 0
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
    setOpen(false)
  }

  if (isAdFree) return null

  return (
    <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ p: 1 }}>
          {process.env.NODE_ENV !== 'production' ? (
            <Box
              sx={{
                width: '100%',
                height: 250,
                bgcolor: 'grey.200',
                border: '2px dashed',
                borderColor: 'grey.400',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
              }}
            >
              Ad placeholder (dev)
            </Box>
          ) : (
            <ins
              className="adsbygoogle"
              style={{ display: 'block', minHeight: 0, overflow: 'hidden' }}
              data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
              data-ad-slot={process.env.NEXT_PUBLIC_ADSENSE_MODAL_SLOT_ID}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} size="small">
            Cerrar anuncio
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
