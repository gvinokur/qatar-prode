'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { getDismissalState, setDismissalState } from '../../utils/dismissal-storage'
import { EDIT_NEXT_TOKEN } from '../../utils/prediction-constants'
import { PredictionStatusHeader } from '../prediction-status-header'
import { computeEngagementVariant } from '../prediction-status-header/hub-header-variant'

const OnboardingDialogClient = dynamic(
  () => import('../onboarding/onboarding-dialog-client'),
  { ssr: false }
)

const VISIT_COUNT_KEY = 'hub-engagement-visit-count'
const APP_INSTALL_DISMISSED_KEY = 'engagement-app-install-dismissed'
const NOTIFICATION_DISMISSED_KEY = 'engagement-notification-dismissed'

type EngagementCardType = 'pre-tournament-cta' | 'app-install' | 'notification-opt-in'

interface EngagementRotatorWidgetProps {
  readonly tournamentStarted: boolean
  readonly gamesHref: string
  readonly predictedGames: number
}

export function EngagementRotatorWidget({ tournamentStarted, gamesHref, predictedGames }: EngagementRotatorWidgetProps) {
  const t = useTranslations('hub')
  const [mounted, setMounted] = useState(false)
  const [pool, setPool] = useState<EngagementCardType[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [showIosInstallHint, setShowIosInstallHint] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      deferredPromptRef.current = e as BeforeInstallPromptEvent
    }
    globalThis.addEventListener('beforeinstallprompt', handler)
    return () => globalThis.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    try {
      // Read + increment visit counter
      const raw = localStorage.getItem(VISIT_COUNT_KEY)
      const count = raw ? Number.parseInt(raw, 10) : 0
      const nextCount = Number.isNaN(count) ? 1 : count + 1
      localStorage.setItem(VISIT_COUNT_KEY, String(nextCount))

      // Detect client-side state
      const isStandalone = globalThis.matchMedia('(display-mode: standalone)').matches
      const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent)
      const notificationPermission = typeof Notification === 'undefined' ? 'denied' : Notification.permission
      const appInstallDismissed = getDismissalState(APP_INSTALL_DISMISSED_KEY)
      const notificationDismissed = getDismissalState(NOTIFICATION_DISMISSED_KEY)

      const available: EngagementCardType[] = []

      if (!tournamentStarted) {
        available.push('pre-tournament-cta')
      }

      const canInstall = deferredPromptRef.current !== null || (isIos && !isStandalone)
      if (canInstall && !appInstallDismissed) {
        available.push('app-install')
      }

      if (notificationPermission === 'default' && !notificationDismissed) {
        available.push('notification-opt-in')
      }

      setPool(available)
      setCurrentIndex(nextCount % Math.max(available.length, 1))
      setMounted(true)
    } catch {
      setMounted(true)
    }
  }, [tournamentStarted])

  const handleDismissAppInstall = () => {
    setDismissalState(APP_INSTALL_DISMISSED_KEY, true)
    setPool((prev) => prev.filter((c) => c !== 'app-install'))
  }

  const handleDismissNotification = () => {
    setDismissalState(NOTIFICATION_DISMISSED_KEY, true)
    setPool((prev) => prev.filter((c) => c !== 'notification-opt-in'))
  }

  const handleAppInstallCta = async () => {
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent)
    if (deferredPromptRef.current) {
      await deferredPromptRef.current.prompt()
      deferredPromptRef.current = null
      setPool((prev) => prev.filter((c) => c !== 'app-install'))
    } else if (isIos) {
      setShowIosInstallHint(true)
    }
  }

  const handleNotificationCta = async () => {
    try {
      const result = await Notification.requestPermission()
      if (result === 'granted' || result === 'denied') {
        setPool((prev) => prev.filter((c) => c !== 'notification-opt-in'))
      }
    } catch {
      // Notification API unavailable
    }
  }

  if (!mounted || pool.length === 0) return null

  const currentCard = pool[currentIndex % pool.length]

  if (currentCard === 'pre-tournament-cta') {
    const gamesEditHref = `${gamesHref}?edit=${EDIT_NEXT_TOKEN}`
    const variant = computeEngagementVariant('pre-tournament-cta', t, {
      predictedGames,
      gamesEditHref,
      onTutorial: () => setTutorialOpen(true),
    })
    return (
      <>
        <PredictionStatusHeader variant={variant} />
        {tutorialOpen && <OnboardingDialogClient initialOpen={true} onClose={() => setTutorialOpen(false)} />}
      </>
    )
  }

  if (currentCard === 'app-install') {
    if (showIosInstallHint) {
      const iosVariant = computeEngagementVariant('app-install', t, {
        onInstall: () => setPool((prev) => prev.filter((c) => c !== 'app-install')),
        onDismiss: handleDismissAppInstall,
      })
      // Override statusText for iOS hint
      const iosHintVariant = {
        ...iosVariant,
        message: "Tap the share icon and select 'Add to Home Screen'",
        action: { label: 'Got it', onClick: () => setPool((prev) => prev.filter((c) => c !== 'app-install')) },
      }
      return <PredictionStatusHeader variant={iosHintVariant} />
    }
    const variant = computeEngagementVariant('app-install', t, {
      onInstall: handleAppInstallCta,
      onDismiss: handleDismissAppInstall,
    })
    return <PredictionStatusHeader variant={variant} />
  }

  if (currentCard === 'notification-opt-in') {
    const variant = computeEngagementVariant('notification-opt-in', t, {
      onEnable: handleNotificationCta,
      onDismiss: handleDismissNotification,
    })
    return <PredictionStatusHeader variant={variant} />
  }

  return null
}

// Browser API type not in standard TypeScript DOM lib
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
}
