'use client'

import { Box, Button, Chip, Divider, Paper, Typography } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import SportsScoreIcon from '@mui/icons-material/SportsScore'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { RecentResultsData, RecentGameResultItem } from '../../actions/hub-actions'

interface RecentResultsWidgetProps {
  readonly data: RecentResultsData
  readonly statsHref: string
}

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
                <Chip
                  label={`⚡ ${t('boostBonus', { bonus: item.boostBonus })}`}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.5 } }}
                />
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

  const {
    recentGames,
    qualifiedTeamsScore,
    qualifiedTeamsCorrect,
    qualifiedTeamsTotalPredicted,
    individualAwardsScore,
    honorRollScore,
  } = data

  const hasGames = recentGames.length > 0
  const hasQT = qualifiedTeamsScore !== null
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
            )}

            {hasQT && (
              <Box>
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
                        +{qualifiedTeamsScore} pts
                      </Typography>
                    </Box>
                    {qualifiedTeamsCorrect !== null && qualifiedTeamsTotalPredicted !== null && (
                      <Typography variant="caption" color="text.secondary">
                        {t('qualifiedSummary', {
                          correct: qualifiedTeamsCorrect,
                          total: qualifiedTeamsTotalPredicted,
                        })}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            )}

            {hasAwards && (
              <Box>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 1, lineHeight: 1.2 }}
                >
                  {t('tournamentAwards')}
                </Typography>
                {individualAwardsScore !== null && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <CheckCircleOutlineIcon color="success" fontSize="small" sx={{ mt: 0.3, flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">{t('individualAwardsLabel')}</Typography>
                        <Typography variant="body2" color="success.main" fontWeight="medium">
                          +{individualAwardsScore} pts
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
                {honorRollScore !== null && honorRollScore > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: individualAwardsScore !== null ? 1 : 0 }}>
                    <CheckCircleOutlineIcon color="success" fontSize="small" sx={{ mt: 0.3, flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Honor Roll</Typography>
                        <Typography variant="body2" color="success.main" fontWeight="medium">
                          +{honorRollScore} pts
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            <Box sx={{ textAlign: 'center', mt: 0.5 }}>
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
        )}
      </Paper>
    </Box>
  )
}
