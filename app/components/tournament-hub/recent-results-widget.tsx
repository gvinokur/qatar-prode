'use client'

import { Box, Button, Divider, Typography } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import WatchLaterIcon from '@mui/icons-material/WatchLater'
import SportsScoreIcon from '@mui/icons-material/SportsScore'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { BoostBadge } from '../boost-badge'
import type { RecentResultsData, RecentGameResultItem } from '../../actions/hub-actions'

interface RecentResultsWidgetProps {
  readonly data: RecentResultsData
  readonly statsHref: string
}

function GameItem({ item }: { readonly item: RecentGameResultItem }) {
  const t = useTranslations('hub.recentResults')
  const isPending = item.gameStatus === 'pending' || item.gameStatus === 'about_to_start'
  const hasGuess = item.userHomeGuess !== null
  const isCorrect = item.finalPoints > 0
  const isExact =
    hasGuess &&
    item.gameStatus === 'finished' &&
    item.userHomeGuess === item.homeScore &&
    item.userAwayGuess === item.awayScore

  const statusText = item.gameStatus === 'about_to_start' ? t('aboutToStart') : t('matchInProgress')
  const predictionText = hasGuess
    ? t('pendingWithPrediction', { home: item.userHomeGuess!, away: item.userAwayGuess! })
    : t('noPredictionShort')

  let subtext: string
  if (isPending) {
    subtext = `${statusText} • ${predictionText}`
  } else if (!hasGuess) {
    subtext = t('youDidntPredict')
  } else if (isExact) {
    subtext = t('exactResult')
  } else if (isCorrect) {
    subtext = t('correctResultWithGuess', { home: item.userHomeGuess!, away: item.userAwayGuess! })
  } else {
    subtext = t('yourGuess', { home: item.userHomeGuess!, away: item.userAwayGuess! })
  }

  let scoreDisplay: string
  if (isPending) {
    scoreDisplay = '-- pts'
  } else if (isCorrect) {
    scoreDisplay = `+${item.finalPoints} pts`
  } else {
    scoreDisplay = '0 pts'
  }

  let statusIcon
  if (isPending) {
    statusIcon = <WatchLaterIcon sx={{ color: 'warning.main', fontSize: 'small', mt: 0.3, flexShrink: 0 }} />
  } else if (isCorrect) {
    statusIcon = <CheckCircleOutlineIcon color="success" fontSize="small" sx={{ mt: 0.3, flexShrink: 0 }} />
  } else {
    statusIcon = <CancelOutlinedIcon color="error" fontSize="small" sx={{ mt: 0.3, flexShrink: 0 }} />
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        {statusIcon}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" noWrap>
              {item.homeTeamName}{' '}
              {item.gameStatus === 'finished'
                ? `${item.homeScore}–${item.awayScore}`
                : 'vs'}{' '}
              {item.awayTeamName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
              <Typography
                variant="body2"
                color={isCorrect && !isPending ? 'success.main' : 'text.secondary'}
                fontWeight="medium"
              >
                {scoreDisplay}
              </Typography>
              {item.boostType && item.boostBonus > 0 && (
                <BoostBadge type={item.boostType} />
              )}
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {subtext}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export function RecentResultsWidget({ data, statsHref }: RecentResultsWidgetProps) {
  const t = useTranslations('hub.recentResults')
  const { recentGames } = data
  const hasGames = recentGames.length > 0

  return (
    <>
      {hasGames ? (
        <Box>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ display: 'block', mb: 1, lineHeight: 1.2 }}
          >
            {t('recentGames')}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {recentGames.map((item, idx) => (
              <Box key={item.gameId}>
                {idx > 0 && <Divider sx={{ mb: 1 }} />}
                <GameItem item={item} />
              </Box>
            ))}
          </Box>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <SportsScoreIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary" fontWeight="medium">
            {t('emptyTitle')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('emptySubtitle')}
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 'auto', pt: 1.5, textAlign: 'center' }}>
        <Button
          component={Link}
          href={statsHref}
          variant="text"
          size="small"
          color="primary"
        >
          {t('seeStats')}
        </Button>
      </Box>
    </>
  )
}
