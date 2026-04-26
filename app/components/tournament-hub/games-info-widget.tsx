import { Box, LinearProgress, Stack, Typography } from '@mui/material'
import {
  AddCircleOutline as AddCircleOutlineIcon,
  Schedule as ScheduleIcon,
  SportsSoccer as SportsSoccerIcon,
} from '@mui/icons-material'
import { getTranslations } from 'next-intl/server'
import { DashboardCard } from './dashboard-card'
import { GamesInfoWidgetCta } from './games-info-widget-cta'
import type { ScoringRulesBySection } from '../../utils/scoring-rules-utils'

interface GamesInfoWidgetProps {
  readonly isLoggedOff: boolean
  readonly scoringRules: ScoringRulesBySection
  readonly gamesHref: string
  readonly predictedGames: number
  readonly totalGames: number
}

export async function GamesInfoWidget({
  isLoggedOff,
  scoringRules,
  gamesHref,
  predictedGames,
  totalGames,
}: GamesInfoWidgetProps) {
  const t = await getTranslations('hub')

  const progressValue = totalGames > 0 ? (predictedGames / totalGames) * 100 : 0
  const ctaText = isLoggedOff
    ? t('gamesWidget.ctaLogin')
    : predictedGames > 0
      ? t('gamesWidget.ctaContinue')
      : t('newUser.tracks.matches.cta')

  return (
    <DashboardCard
      title={t('newUser.tracks.matches.title')}
      icon={<SportsSoccerIcon />}
      count={`${predictedGames}/${totalGames}`}
    >
      <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
        {/* Description */}
        <Typography variant="body2" color="text.secondary">
          {t('newUser.tracks.matches.description', { total: totalGames })}
        </Typography>

        {/* Deadline box */}
        <Box
          sx={{
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
            <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" fontWeight="bold">
              {t('newUser.tracks.deadline.label')}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" display="block">
            {t('gamesWidget.deadlineText')}
          </Typography>
        </Box>

        {/* Scoring rules box */}
        {scoringRules.matches.length > 0 && (
          <Box
            sx={{
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              p: 1,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
              <AddCircleOutlineIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" fontWeight="bold">
                {t('newUser.tracks.scoringLabel')}
              </Typography>
            </Stack>
            {scoringRules.matches.map((rule) => (
              <Typography key={rule} variant="body2" color="text.secondary" display="block">
                • {rule}
              </Typography>
            ))}
          </Box>
        )}

        {/* Progress bar */}
        {totalGames > 0 && (
          <LinearProgress
            variant="determinate"
            value={progressValue}
            color="secondary"
            sx={{ borderRadius: 1, height: 6 }}
          />
        )}

        {/* CTA */}
        <GamesInfoWidgetCta isLoggedOff={isLoggedOff} href={isLoggedOff ? gamesHref : `${gamesHref}?edit=next`} label={ctaText} />
      </Stack>
    </DashboardCard>
  )
}
