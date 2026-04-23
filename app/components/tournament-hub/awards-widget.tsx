import { Box, LinearProgress, Stack, Typography } from '@mui/material'
import {
  AddCircleOutline as AddCircleOutlineIcon,
  EmojiEvents as EmojiEventsIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material'
import { getTranslations } from 'next-intl/server'
import { DashboardCard } from './dashboard-card'
import { DeadlineBox } from './deadline-box'
import { GamesInfoWidgetCta } from './games-info-widget-cta'
import { computeStatusWidgetSeverity } from '../../utils/urgency-utils'
import type { ScoringRulesBySection } from '../../utils/scoring-rules-utils'

interface AwardsWidgetProps {
  readonly isLoggedOff: boolean
  readonly scoringRules: ScoringRulesBySection
  readonly awardsHref: string
  readonly awardsCompleted: number
  readonly awardsTotal: number
  readonly msUntilPredictionLock: number
  readonly lockDateFormatted: string | null
}

const severityColor = {
  normal: 'text.secondary',
  info: 'info.main',
  warning: 'warning.main',
  error: 'error.main',
} as const

export async function AwardsWidget({
  isLoggedOff,
  scoringRules,
  awardsHref,
  awardsCompleted,
  awardsTotal,
  msUntilPredictionLock,
  lockDateFormatted,
}: AwardsWidgetProps) {
  const t = await getTranslations('hub')
  const severity = computeStatusWidgetSeverity(msUntilPredictionLock)

  const progressValue = awardsTotal > 0 ? (awardsCompleted / awardsTotal) * 100 : 0

  let ctaText: string
  if (isLoggedOff) {
    ctaText = t('gamesWidget.ctaLogin')
  } else if (progressValue === 0) {
    ctaText = t('newUser.tracks.awards.cta')
  } else if (progressValue < 90) {
    ctaText = t('newUser.tracks.awards.ctaKeep')
  } else if (progressValue < 100) {
    ctaText = t('newUser.tracks.awards.ctaFinish')
  } else {
    ctaText = t('newUser.tracks.awards.ctaReview')
  }

  const deadlineMessage =
    severity === 'error'
      ? t('statusWidget.deadlineError')
      : severity === 'warning'
        ? t('statusWidget.deadlineWarning')
        : severity === 'info'
          ? t('statusWidget.deadlineInfo')
          : t('statusWidget.deadlineNormal')
  const iconColor = severityColor[severity]

  return (
    <DashboardCard
      title={t('newUser.tracks.awards.title')}
      icon={<EmojiEventsIcon />}
      count={`${awardsCompleted}/${awardsTotal}`}
      urgent={severity === 'error'}
    >
      <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
        {/* Description */}
        <Typography variant="body2" color="text.secondary">
          {t('newUser.tracks.awards.description')}
        </Typography>

        {/* Deadline box */}
        <DeadlineBox severity={severity}>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
            <ScheduleIcon sx={{ fontSize: 14, color: iconColor }} />
            <Typography variant="caption" fontWeight="bold" color={iconColor}>
              {t('statusWidget.deadlineLabel')}
            </Typography>
            {lockDateFormatted && (
              <Typography variant="caption" color={iconColor}>
                {lockDateFormatted}
              </Typography>
            )}
          </Stack>
          <Typography variant="caption" color={iconColor} display="block">
            {deadlineMessage}
          </Typography>
        </DeadlineBox>

        {/* Scoring rules box */}
        {scoringRules.awards.length > 0 && (
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
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                {t('newUser.tracks.scoringLabel')}
              </Typography>
            </Stack>
            {scoringRules.awards.map((rule) => (
              <Typography key={rule} variant="caption" color="text.secondary" display="block">
                • {rule}
              </Typography>
            ))}
          </Box>
        )}

        {/* Progress bar */}
        {awardsTotal > 0 && (
          <LinearProgress
            variant="determinate"
            value={progressValue}
            color="secondary"
            sx={{ borderRadius: 1, height: 6 }}
          />
        )}

        {/* CTA */}
        <GamesInfoWidgetCta isLoggedOff={isLoggedOff} href={awardsHref} label={ctaText} />
      </Stack>
    </DashboardCard>
  )
}
