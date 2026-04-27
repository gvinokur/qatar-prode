import React from 'react'
import { Paper, Stack, Avatar, Typography, Button } from '@mui/material'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { computePriorityAttention } from '../../utils/priority-attention'
import type { PriorityAttentionState } from '../../utils/priority-attention'
import type { ActionCenterData } from '../../actions/hub-actions'
import { EngagementRotatorWidget } from './engagement-rotator-widget'
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
        avatarIcon: <AccessTimeIcon fontSize="small" />,
      }
    case 'deadline': {
      const qtIncomplete = state.qtIncomplete ?? false
      const awardsIncomplete = state.awardsIncomplete ?? false
      return {
        title: t('attentionWidget.deadline.title'),
        subtitle: t('attentionWidget.deadline.subtitle'),
        cta: qtIncomplete ? t('attentionWidget.deadline.ctaQt') : t('attentionWidget.deadline.ctaAwards'),
        href: qtIncomplete ? qtHref : awardsHref,
        avatarBgColor: 'warning.main',
        buttonColor: 'warning',
        avatarIcon: <AccessTimeIcon fontSize="small" />,
        secondaryAction:
          qtIncomplete && awardsIncomplete ? (
            <Button
              variant="contained"
              size="small"
              color="warning"
              component={Link}
              href={awardsHref}
              sx={{ flexShrink: 0 }}
            >
              {t('attentionWidget.deadline.ctaAwards')}
            </Button>
          ) : undefined,
      }
    }
    case 'new-actions-qt':
      return {
        title: t('attentionWidget.newActionsQt.title'),
        subtitle: t('attentionWidget.newActionsQt.subtitle'),
        cta: t('attentionWidget.newActionsQt.cta'),
        href: qtHref,
        avatarBgColor: 'success.main',
        buttonColor: 'success',
        avatarIcon: <PlayCircleOutlineIcon fontSize="small" />,
      }
    case 'new-actions-awards':
      return {
        title: t('attentionWidget.newActionsAwards.title'),
        subtitle: t('attentionWidget.newActionsAwards.subtitle'),
        cta: t('attentionWidget.newActionsAwards.cta'),
        href: awardsHref,
        avatarBgColor: 'success.main',
        buttonColor: 'success',
        avatarIcon: <PlayCircleOutlineIcon fontSize="small" />,
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
