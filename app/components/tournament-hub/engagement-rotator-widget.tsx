'use client'

import React from 'react'
import { Paper, Stack, Avatar, Typography, Button } from '@mui/material'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import InstallMobileIcon from '@mui/icons-material/InstallMobile'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { getDismissalState, setDismissalState } from '../../utils/dismissal-storage'
import { EDIT_NEXT_TOKEN } from '../../utils/prediction-constants'

const OnboardingDialogClient = dynamic(
  () => import('../onboarding/onboarding-dialog-client'),
  { ssr: false }
)

const VISIT_COUNT_KEY = 'hub-engagement-visit-count'
const APP_INSTALL_DISMISSED_KEY = 'engagement-app-install-dismissed'
const NOTIFICATION_DISMISSED_KEY = 'engagement-notification-dismissed'

type EngagementCardType = 'pre-tournament-cta' | 'app-install' | 'notification-opt-in'

interface CardProps {
  avatarBgColor: string
  avatarIcon: React.ReactNode
  title: string
  subtitle: string
  cta: string
  onCtaClick?: () => void
  onDismiss?: () => void
  dismissLabel?: string
  secondaryAction?: React.ReactNode
}

function EngagementCard({ avatarBgColor, avatarIcon, title, subtitle, cta, onCtaClick, onDismiss, dismissLabel = 'Dismiss', secondaryAction }: CardProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack direction="row" alignItems="center" gap={2}>
        <Avatar
          sx={{
            bgcolor: avatarBgColor,
            width: 40,
            height: 40,
            fontSize: '1.2rem',
            flexShrink: 0,
          }}
        >
          {avatarIcon}
        </Avatar>

        <Stack flexGrow={1} minWidth={0}>
          <Typography variant="body1" fontWeight={600} noWrap>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {subtitle}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" gap={0.5} flexShrink={0}>
          {secondaryAction}
          <Button
            variant="contained"
            size="small"
            color="primary"
            onClick={onCtaClick}
          >
            {cta}
          </Button>
          {onDismiss && (
            <Button size="small" color="inherit" onClick={onDismiss} sx={{ color: 'text.secondary' }}>
              {dismissLabel}
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  )
}

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
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    try {
      // Read + increment visit counter
      const raw = localStorage.getItem(VISIT_COUNT_KEY)
      const count = raw ? Number.parseInt(raw, 10) : 0
      const nextCount = Number.isNaN(count) ? 1 : count + 1
      localStorage.setItem(VISIT_COUNT_KEY, String(nextCount))

      // Detect client-side state
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent)
      const notificationPermission = typeof Notification !== 'undefined' ? Notification.permission : 'denied'
      const appInstallDismissed = getDismissalState(APP_INSTALL_DISMISSED_KEY)
      const notificationDismissed = getDismissalState(NOTIFICATION_DISMISSED_KEY)

      const available: EngagementCardType[] = []

      if (!tournamentStarted) {
        available.push('pre-tournament-cta')
      }

      const debugInstall = new URLSearchParams(window.location.search).has('debug-install')
      const canInstall = debugInstall || deferredPromptRef.current !== null || (isIos && !isStandalone)
      if (canInstall && !appInstallDismissed) {
        available.push('app-install')
      }

      if (notificationPermission !== 'denied' && notificationPermission !== 'granted' && !notificationDismissed) {
        available.push('notification-opt-in')
      }

      if (debugInstall) {
        setPool(['app-install'])
        setCurrentIndex(0)
      } else {
        setPool(available)
        setCurrentIndex(nextCount % Math.max(available.length, 1))
      }
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
    const gamesCta = predictedGames > 0 ? t('newUser.tracks.matches.ctaKeep') : t('newUser.tracks.matches.cta')
    const gamesEditHref = `${gamesHref}?edit=${EDIT_NEXT_TOKEN}`
    return (
      <>
        <EngagementCard
          avatarBgColor="primary.main"
          avatarIcon={<MenuBookOutlinedIcon fontSize="small" />}
          title={t('newUser.tutorial.title')}
          subtitle={t('newUser.tutorial.subtitle')}
          cta={t('newUser.tutorial.cta')}
          onCtaClick={() => setTutorialOpen(true)}
          secondaryAction={
            <Button
              variant="outlined"
              size="small"
              color="primary"
              component={Link}
              href={gamesEditHref}
              sx={{ flexShrink: 0 }}
            >
              {gamesCta}
            </Button>
          }
        />
        {tutorialOpen && <OnboardingDialogClient initialOpen={true} onClose={() => setTutorialOpen(false)} />}
      </>
    )
  }

  if (currentCard === 'app-install') {
    if (showIosInstallHint) {
      return (
        <EngagementCard
          avatarBgColor="primary.main"
          avatarIcon={<InstallMobileIcon fontSize="small" />}
          title={t('attentionWidget.appInstall.title')}
          subtitle="Tap the share icon and select 'Add to Home Screen'"
          cta="Got it"
          onCtaClick={() => setPool((prev) => prev.filter((c) => c !== 'app-install'))}
          onDismiss={handleDismissAppInstall}
        />
      )
    }
    return (
      <EngagementCard
        avatarBgColor="primary.main"
        avatarIcon={<InstallMobileIcon fontSize="small" />}
        title={t('attentionWidget.appInstall.title')}
        subtitle={t('attentionWidget.appInstall.subtitle')}
        cta={t('attentionWidget.appInstall.cta')}
        onCtaClick={handleAppInstallCta}
        onDismiss={handleDismissAppInstall}
      />
    )
  }

  if (currentCard === 'notification-opt-in') {
    return (
      <EngagementCard
        avatarBgColor="primary.main"
        avatarIcon={<NotificationsNoneIcon fontSize="small" />}
        title={t('attentionWidget.notificationOptIn.title')}
        subtitle={t('attentionWidget.notificationOptIn.subtitle')}
        cta={t('attentionWidget.notificationOptIn.cta')}
        onCtaClick={handleNotificationCta}
        onDismiss={handleDismissNotification}
        dismissLabel={t('attentionWidget.notificationOptIn.dismiss')}
      />
    )
  }

  return null
}

// Browser API type not in standard TypeScript DOM lib
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
}
