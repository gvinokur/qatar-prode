'use client'

import { useState } from 'react'
import { Box, Button, Divider, IconButton, Stack, Typography } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import WatchLaterIcon from '@mui/icons-material/WatchLater'
import SportsScoreIcon from '@mui/icons-material/SportsScore'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { BoostBadge } from '../boost-badge'
import type { RecentResultsData, RecentGameResultItem } from '../../actions/hub-actions'

const VISIBLE_COUNT = 5

interface RecentResultsWidgetProps {
  readonly data: RecentResultsData
  readonly statsHref: string
}

interface VerticalNavProps {
  readonly current: number
  readonly total: number
  readonly onUp: () => void
  readonly onDown: () => void
}

function VerticalNav({ current, total, onUp, onDown }: VerticalNavProps) {
  return (
    <Stack sx={{ justifyContent: 'center', gap: 1, ml: 0.5 }}>
      <IconButton
        size="small"
        disabled={current === 0}
        onClick={onUp}
        aria-label="previous"
        sx={{ border: '1px solid', borderColor: 'divider', '&.Mui-disabled': { opacity: 0.3 } }}
      >
        <KeyboardArrowUpIcon fontSize="small" />
      </IconButton>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: current === 0 ? 'primary.main' : 'divider' }} />
        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: current > 0 && current < total - 1 ? 'primary.main' : 'divider' }} />
        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: current === total - 1 ? 'primary.main' : 'divider' }} />
      </Box>
      <IconButton
        size="small"
        disabled={current === total - 1}
        onClick={onDown}
        aria-label="next"
        sx={{ border: '1px solid', borderColor: 'divider', '&.Mui-disabled': { opacity: 0.3 } }}
      >
        <KeyboardArrowDownIcon fontSize="small" />
      </IconButton>
    </Stack>
  )
}

type TranslationFn = (_key: string, _params?: Record<string, unknown>) => string

function buildSubtext(
  item: RecentGameResultItem,
  t: TranslationFn,
  isPending: boolean,
  hasGuess: boolean,
  isCorrect: boolean,
  isExact: boolean,
  hasPenalties: boolean,
  homeWins: boolean,
): string {
  const statusText = item.gameStatus === 'about_to_start' ? t('aboutToStart') : t('matchInProgress')
  const predictionText = hasGuess
    ? t('pendingWithPrediction', { home: item.userHomeGuess!, away: item.userAwayGuess! })
    : t('noPredictionShort')

  if (isPending) return `${statusText} • ${predictionText}`
  if (!hasGuess) return t('youDidntPredict')
  if (isExact) return t('exactResult')
  if (isCorrect) {
    if (hasPenalties) {
      return t('correctResultWithPenaltyWinner', {
        home: item.userHomeGuess!,
        away: item.userAwayGuess!,
        team: homeWins ? item.homeTeamName : item.awayTeamName,
      })
    }
    return t('correctResultWithGuess', { home: item.userHomeGuess!, away: item.userAwayGuess! })
  }
  if (hasPenalties && (item.userHomePenaltyWinner || item.userAwayPenaltyWinner)) {
    return t('yourGuessWithPenaltyPrediction', {
      home: item.userHomeGuess!,
      away: item.userAwayGuess!,
      team: item.userHomePenaltyWinner ? item.homeTeamName : item.awayTeamName,
    })
  }
  return t('yourGuess', { home: item.userHomeGuess!, away: item.userAwayGuess! })
}

function buildScoreContent(
  item: RecentGameResultItem,
  hasPenalties: boolean,
  homeWins: boolean,
): React.ReactNode {
  if (item.gameStatus === 'finished' && hasPenalties) {
    return (
      <>
        <Box component="span" fontWeight={homeWins ? 700 : 400}>{item.homeTeamName}</Box>
        {' '}{item.homeScore} ({item.homePenaltyScore})–({item.awayPenaltyScore}) {item.awayScore}{' '}
        <Box component="span" fontWeight={homeWins ? 400 : 700}>{item.awayTeamName}</Box>
      </>
    )
  }
  if (item.gameStatus === 'finished') {
    return <>{item.homeTeamName} {item.homeScore}–{item.awayScore} {item.awayTeamName}</>
  }
  return <>{item.homeTeamName} vs {item.awayTeamName}</>
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

  const hasPenalties = item.homePenaltyScore != null && item.awayPenaltyScore != null
  const homeWins = hasPenalties && item.homePenaltyScore! > item.awayPenaltyScore!

  const subtext = buildSubtext(item, t as TranslationFn, isPending, hasGuess, isCorrect, isExact, hasPenalties, homeWins)
  const scoreContent = buildScoreContent(item, hasPenalties, homeWins)

  let scoreDisplay: string
  let statusIcon
  if (isPending) {
    scoreDisplay = '-- pts'
    statusIcon = <WatchLaterIcon sx={{ color: 'warning.main', fontSize: 'small', mt: 0.3, flexShrink: 0 }} />
  } else if (isCorrect) {
    scoreDisplay = `+${item.finalPoints} pts`
    statusIcon = <CheckCircleOutlineIcon color="success" fontSize="small" sx={{ mt: 0.3, flexShrink: 0 }} />
  } else {
    scoreDisplay = '0 pts'
    statusIcon = <CancelOutlinedIcon color="error" fontSize="small" sx={{ mt: 0.3, flexShrink: 0 }} />
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        {statusIcon}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" noWrap>
              {scoreContent}
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
  const needsNav = recentGames.length > VISIBLE_COUNT

  const [startIndex, setStartIndex] = useState(0)
  const maxIndex = Math.max(0, recentGames.length - VISIBLE_COUNT)
  const visibleGames = recentGames.slice(startIndex, startIndex + VISIBLE_COUNT)

  const handleUp = () => setStartIndex((prev) => Math.max(0, prev - 1))
  const handleDown = () => setStartIndex((prev) => Math.min(maxIndex, prev + 1))

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
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {visibleGames.map((item, idx) => (
                  <Box key={item.gameId}>
                    {idx > 0 && <Divider sx={{ mb: 1 }} />}
                    <GameItem item={item} />
                  </Box>
                ))}
              </Box>
            </Box>
            {needsNav && (
              <VerticalNav
                current={startIndex}
                total={maxIndex + 1}
                onUp={handleUp}
                onDown={handleDown}
              />
            )}
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
