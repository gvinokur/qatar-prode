import React from 'react'
import { Paper, Stack, Avatar, Typography, Button } from '@mui/material'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { computePriorityAttention } from '../../utils/priority-attention'
import type { PriorityAttentionState } from '../../utils/priority-attention'
import type { ActionCenterData } from '../../actions/hub-actions'
import { EngagementRotatorWidget } from './engagement-rotator-widget'
import { TutorialDialogButton } from './tutorial-dialog-button'
import type { Locale } from '../../../i18n.config'
import { EDIT_NEXT_TOKEN } from '../../utils/prediction-constants'

interface PriorityAttentionWidgetProps {
  readonly data: ActionCenterData
  readonly gamesHref: string
  readonly qtHref: string
  readonly awardsHref: string
  readonly locale: Locale
  readonly tournamentId: string
}

type CardConfig = {
  title: string
  subtitle: string
  cta: string
  href: string
  avatarBgColor: string
  buttonColor: 'error' | 'warning' | 'success' | 'primary' | 'info'
  avatarIcon: React.ReactNode
  secondaryAction?: React.ReactNode
}

function buildCardConfig(
  state: PriorityAttentionState,
  t: Awaited<ReturnType<typeof getTranslations<'hub'>>>,
  gamesHref: string,
  qtHref: string,
  awardsHref: string
): CardConfig {
  const gamesEditHref = `${gamesHref}?edit=${EDIT_NEXT_TOKEN}`

  switch (state.type) {
    case 'urgent-games':
      return {
        title: t('attentionWidget.urgentGames.title', { count: state.urgentCount ?? state.totalCount }),
        subtitle: t('attentionWidget.urgentGames.subtitle'),
        cta: t('attentionWidget.urgentGames.cta'),
        href: gamesEditHref,
        avatarBgColor: 'error.main',
        buttonColor: 'error',
        avatarIcon: <SportsSoccerIcon fontSize="small" />,
      }
    case 'qt-deadline':
      return {
        title: t('attentionWidget.qtDeadline.title'),
        subtitle: t('attentionWidget.qtDeadline.subtitle', { completed: state.completedCount, total: state.totalCount }),
        cta: t('attentionWidget.qtDeadline.cta'),
        href: qtHref,
        avatarBgColor: 'warning.main',
        buttonColor: 'warning',
        avatarIcon: '⚠️',
      }
    case 'awards-deadline':
      return {
        title: t('attentionWidget.awardsDeadline.title'),
        subtitle: t('attentionWidget.awardsDeadline.subtitle', { completed: state.completedCount, total: state.totalCount }),
        cta: t('attentionWidget.awardsDeadline.cta'),
        href: awardsHref,
        avatarBgColor: 'warning.main',
        buttonColor: 'warning',
        avatarIcon: '⚠️',
      }
    case 'transition-to-qt':
      return {
        title: t('attentionWidget.transitionToQt.title'),
        subtitle: t('attentionWidget.transitionToQt.subtitle'),
        cta: t('attentionWidget.transitionToQt.cta'),
        href: qtHref,
        avatarBgColor: 'success.main',
        buttonColor: 'success',
        avatarIcon: '✅',
      }
    case 'transition-to-awards':
      return {
        title: t('attentionWidget.transitionToAwards.title'),
        subtitle: t('attentionWidget.transitionToAwards.subtitle'),
        cta: t('attentionWidget.transitionToAwards.cta'),
        href: awardsHref,
        avatarBgColor: 'success.main',
        buttonColor: 'success',
        avatarIcon: '✅',
      }
    case 'fallback-games':
      return {
        title: t('attentionWidget.fallbackGames.title'),
        subtitle: t('attentionWidget.fallbackGames.subtitle', { completed: state.completedCount, total: state.totalCount }),
        cta: t('attentionWidget.fallbackGames.cta'),
        href: gamesEditHref,
        avatarBgColor: 'primary.main',
        buttonColor: 'primary',
        avatarIcon: <SportsSoccerIcon fontSize="small" />,
        secondaryAction: <TutorialDialogButton label={t('newUser.tutorial.cta')} />,
      }
    case 'qt-nudge':
      return {
        title: t('attentionWidget.qtNudge.title'),
        subtitle: t('attentionWidget.qtNudge.subtitle', { completed: state.completedCount, total: state.totalCount }),
        cta: t('attentionWidget.qtNudge.cta'),
        href: qtHref,
        avatarBgColor: 'primary.main',
        buttonColor: 'primary',
        avatarIcon: '🏆',
      }
    case 'awards-nudge':
      return {
        title: t('attentionWidget.awardsNudge.title'),
        subtitle: t('attentionWidget.awardsNudge.subtitle', { completed: state.completedCount, total: state.totalCount }),
        cta: t('attentionWidget.awardsNudge.cta'),
        href: awardsHref,
        avatarBgColor: 'primary.main',
        buttonColor: 'primary',
        avatarIcon: '🥇',
      }
  }
}

export async function PriorityAttentionWidget({
  data,
  gamesHref,
  qtHref,
  awardsHref,
}: PriorityAttentionWidgetProps) {
  const state = computePriorityAttention(data)

  if (!state) {
    return (
      <EngagementRotatorWidget
        gamesHref={gamesHref}
        tournamentStarted={data.tournamentHasStarted}
      />
    )
  }

  const t = await getTranslations('hub')
  const card = buildCardConfig(state, t, gamesHref, qtHref, awardsHref)

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack direction="row" alignItems="center" gap={2}>
        <Avatar
          sx={{
            bgcolor: card.avatarBgColor,
            width: 40,
            height: 40,
            fontSize: '1.2rem',
            flexShrink: 0,
          }}
        >
          {card.avatarIcon}
        </Avatar>

        <Stack flexGrow={1} minWidth={0}>
          <Typography variant="body1" fontWeight={600} noWrap>
            {card.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {card.subtitle}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" gap={0.5} flexShrink={0}>
          {card.secondaryAction}
          <Button
            variant="contained"
            size="small"
            color={card.buttonColor}
            component={Link}
            href={card.href}
            sx={{ flexShrink: 0 }}
          >
            {card.cta}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}
