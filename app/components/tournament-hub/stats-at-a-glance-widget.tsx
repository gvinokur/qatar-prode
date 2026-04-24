import InsightsIcon from '@mui/icons-material/Insights'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import { Box, Button, Divider, Stack, Typography } from '@mui/material'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getStatsAtAGlanceData } from '../../actions/hub-actions'
import { DashboardCard } from './dashboard-card'
import type { Locale } from '../../../i18n.config'

interface Props {
  readonly tournamentId: string
  readonly locale: Locale
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 120
  const height = 40
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }))
  const pathData = 'M ' + points.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')
  return (
    <Box sx={{ color: 'primary.main', flexShrink: 0 }} data-testid="sparkline">
      <svg width={width} height={height} aria-hidden="true">
        <path
          d={pathData}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  )
}

export async function StatsAtAGlanceWidget({ tournamentId, locale }: Props) {
  const [data, t] = await Promise.all([
    getStatsAtAGlanceData(tournamentId, locale),
    getTranslations({ locale, namespace: 'hub.statsAtAGlance' }),
  ])

  const statsHref = `/${locale}/tournaments/${tournamentId}/stats`

  return (
    <DashboardCard title={t('title')} icon={<InsightsIcon fontSize="small" />}>
      {!data.hasData ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <InsightsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary" fontWeight="medium">
            {t('noData')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('noDataSubtitle')}
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="flex-end" spacing={1}>
              <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1 }}>
                {data.totalPoints}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
                pts
              </Typography>
              {data.momentumPoints > 0 && (
                <Stack
                  direction="row"
                  alignItems="center"
                  sx={{ color: 'success.main', mb: 0.5, ml: 'auto' }}
                >
                  <ArrowDropUpIcon />
                  <Typography variant="body2" fontWeight="bold">
                    {data.momentumPoints} pts
                  </Typography>
                </Stack>
              )}
            </Stack>
            {data.snapshotDateLabel && (
              <Typography variant="caption" color="text.secondary">
                {data.isYesterday
                  ? t('sinceYesterday', { date: data.snapshotDateLabel })
                  : t('since', { date: data.snapshotDateLabel })}
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 1.5 }} />

          <Stack spacing={1.5} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <SportsSoccerIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2">{t('matchesLabel')}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                {data.matchesDelta > 0 && (
                  <Typography variant="caption" color="success.main" fontWeight="bold">
                    +{data.matchesDelta}
                  </Typography>
                )}
                <Typography variant="body2" fontWeight="medium">
                  {data.matchesPoints} pts
                </Typography>
              </Stack>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircleOutlineIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2">{t('qualifiedTeamsLabel')}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                {data.qualifiedTeamsDelta > 0 && (
                  <Typography variant="caption" color="success.main" fontWeight="bold">
                    +{data.qualifiedTeamsDelta}
                  </Typography>
                )}
                <Typography variant="body2" fontWeight="medium">
                  {data.qualifiedTeamsPoints} pts
                </Typography>
              </Stack>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <EmojiEventsIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2">{t('awardsLabel')}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                {data.awardsDelta > 0 && (
                  <Typography variant="caption" color="success.main" fontWeight="bold">
                    +{data.awardsDelta}
                  </Typography>
                )}
                <Typography variant="body2" fontWeight="medium">
                  {data.awardsPoints} pts
                </Typography>
              </Stack>
            </Box>
          </Stack>

          {data.sparklineData.length >= 2 && (
            <Box sx={{ mt: 'auto', mb: 1.5 }}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.5 }}
              >
                {t('trendLabel')}
              </Typography>
              <Sparkline data={data.sparklineData} />
            </Box>
          )}

          <Box sx={{ mt: 'auto', textAlign: 'center' }}>
            <Button
              variant="text"
              size="small"
              fullWidth
              component={Link}
              href={statsHref}
              sx={{ py: 1 }}
            >
              {t('seeAllStats')}
            </Button>
          </Box>
        </>
      )}
    </DashboardCard>
  )
}
