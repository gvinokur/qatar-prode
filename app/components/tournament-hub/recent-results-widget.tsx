'use client'

import { Box, Button, Divider, Paper, Typography } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import SportsScoreIcon from '@mui/icons-material/SportsScore'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { BoostBadge } from '../boost-badge'
import type { RecentResultsData, RecentGameResultItem, HonorRollPosition, IndividualAwardType } from '../../actions/hub-actions'

interface RecentResultsWidgetProps {
  readonly data: RecentResultsData
  readonly statsHref: string
  readonly resultsHref: string
  readonly qualifiedTeamsHref: string
  readonly awardsHref: string
}

const sectionLinkSx = {
  display: 'block',
  textDecoration: 'none',
  color: 'inherit',
  borderRadius: 1,
  '&:hover': { bgcolor: 'action.hover' },
  p: 0.5,
  m: -0.5,
} as const

function isExactResult(item: RecentGameResultItem): boolean {
  return (
    item.userHomeGuess === item.homeScore &&
    item.userAwayGuess === item.awayScore
  )
}

function GameItem({ item }: { item: RecentGameResultItem }) {
  const t = useTranslations('hub.recentResults')
  const isCorrect = item.finalPoints > 0
  const exact = isExactResult(item)

  const subtext = isCorrect
    ? exact
      ? t('exactResult')
      : t('correctResult')
    : t('yourGuess', { home: item.userHomeGuess ?? '?', away: item.userAwayGuess ?? '?' })

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        {isCorrect ? (
          <CheckCircleOutlineIcon color="success" fontSize="small" sx={{ mt: 0.3, flexShrink: 0 }} />
        ) : (
          <CancelOutlinedIcon color="error" fontSize="small" sx={{ mt: 0.3, flexShrink: 0 }} />
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" noWrap>
              {item.homeTeamName} {item.homeScore}–{item.awayScore} {item.awayTeamName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
              <Typography variant="body2" color={isCorrect ? 'success.main' : 'text.secondary'} fontWeight="medium">
                {isCorrect ? `+${item.finalPoints}` : '0'} pts
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

function AwardItem({ label, score, captionText }: { label: string; score: number; captionText: string | null }) {
  const isCorrect = score > 0
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
      {isCorrect ? (
        <CheckCircleOutlineIcon color="success" fontSize="small" sx={{ mt: 0.3, flexShrink: 0 }} />
      ) : (
        <CancelOutlinedIcon color="error" fontSize="small" sx={{ mt: 0.3, flexShrink: 0 }} />
      )}
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">{label}</Typography>
          <Typography variant="body2" color={isCorrect ? 'success.main' : 'text.secondary'} fontWeight="medium">
            {isCorrect ? `+${score}` : '0'} pts
          </Typography>
        </Box>
        {captionText !== null && (
          <Typography variant="caption" color="text.secondary">
            {captionText}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export function RecentResultsWidget({
  data,
  statsHref,
  resultsHref,
  qualifiedTeamsHref,
  awardsHref,
}: RecentResultsWidgetProps) {
  const t = useTranslations('hub.recentResults')

  const {
    recentGames,
    qualifiedTeamsScore,
    qualifiedTeamsCorrect,
    qualifiedTeamsActualCount,
    individualAwardsScore,
    honorRollScore,
    honorRollCorrect,
    individualAwardsCorrect,
  } = data

  const honorRollPositionLabels: Record<HonorRollPosition, string> = {
    champion: t('honorRollPosition.champion'),
    runnerUp: t('honorRollPosition.runnerUp'),
    thirdPlace: t('honorRollPosition.thirdPlace'),
  }
  const individualAwardLabels: Record<IndividualAwardType, string> = {
    bestPlayer: t('individualAward.bestPlayer'),
    topGoalscorer: t('individualAward.topGoalscorer'),
    bestGoalkeeper: t('individualAward.bestGoalkeeper'),
    bestYoungPlayer: t('individualAward.bestYoungPlayer'),
  }

  const honorRollCaption = honorRollCorrect === null
    ? null
    : honorRollCorrect.length === 0
      ? t('noCorrectPredictions')
      : t('correctItems', { items: honorRollCorrect.map(pos => honorRollPositionLabels[pos]).join(', ') })

  const individualAwardsCaption = individualAwardsCorrect === null
    ? null
    : individualAwardsCorrect.length === 0
      ? t('noCorrectPredictions')
      : t('correctItems', { items: individualAwardsCorrect.map(award => individualAwardLabels[award]).join(', ') })

  const hasGames = recentGames.length > 0
  const hasQT = qualifiedTeamsActualCount > 0
  const hasAwards = individualAwardsScore !== null || honorRollScore !== null
  const isEmpty = !hasGames && !hasQT && !hasAwards

  return (
    <Box>
      <Box sx={{ mb: 1, textAlign: 'center' }}>
        <Typography variant="h6">{t('title')}</Typography>
      </Box>

      <Paper sx={{ p: 2 }}>
        {isEmpty ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <SportsScoreIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
              {t('emptyTitle')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('emptySubtitle')}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {hasGames && (
              <Box component={Link} href={resultsHref} sx={sectionLinkSx}>
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
            )}

            {hasQT && (
              <Box component={Link} href={qualifiedTeamsHref} sx={sectionLinkSx}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 1, lineHeight: 1.2 }}
                >
                  {t('qualifiedTeams')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <CheckCircleOutlineIcon color="success" fontSize="small" sx={{ mt: 0.3, flexShrink: 0 }} />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">{t('qualifiedTeamsLabel')}</Typography>
                      <Typography variant="body2" color="success.main" fontWeight="medium">
                        +{qualifiedTeamsScore ?? 0} pts
                      </Typography>
                    </Box>
                    {qualifiedTeamsCorrect !== null && (
                      <Typography variant="caption" color="text.secondary">
                        {t('qualifiedSummary', {
                          correct: qualifiedTeamsCorrect,
                          total: qualifiedTeamsActualCount,
                        })}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            )}

            {hasAwards && (
              <Box component={Link} href={awardsHref} sx={sectionLinkSx}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 1, lineHeight: 1.2 }}
                >
                  {t('tournamentAwards')}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {individualAwardsScore !== null && (
                    <AwardItem label={t('individualAwardsLabel')} score={individualAwardsScore} captionText={individualAwardsCaption} />
                  )}
                  {honorRollScore !== null && (
                    <AwardItem label={t('honorRollLabel')} score={honorRollScore} captionText={honorRollCaption} />
                  )}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* View stats button — always shown outside the card, matching leaderboard peek pattern */}
      <Box sx={{ mt: 1.5, textAlign: 'center' }}>
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
    </Box>
  )
}
