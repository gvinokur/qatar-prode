import { Box, LinearProgress, Stack, Typography } from '@mui/material'
import {
  AccountTree as AccountTreeIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material'
import { getTranslations } from 'next-intl/server'
import { DashboardCard } from './dashboard-card'
import { DeadlineBox } from './deadline-box'
import { GamesInfoWidgetCta } from './games-info-widget-cta'
import { computeStatusWidgetSeverity } from '../../utils/urgency-utils'
import type { ScoringRulesBySection } from '../../utils/scoring-rules-utils'

interface QualifiedTeamsWidgetProps {
  readonly isLoggedOff: boolean
  readonly scoringRules: ScoringRulesBySection
  readonly qtHref: string
  readonly qualifiersCompleted: number
  readonly qualifiersTotal: number
  readonly msUntilPredictionLock: number
  readonly lockDateFormatted: string | null
}

const severityColor = {
  normal: 'text.secondary',
  info: 'info.main',
  warning: 'warning.main',
  error: 'error.main',
} as const

export async function QualifiedTeamsWidget({
  isLoggedOff,
  scoringRules,
  qtHref,
  qualifiersCompleted,
  qualifiersTotal,
  msUntilPredictionLock,
  lockDateFormatted,
}: QualifiedTeamsWidgetProps) {
  const t = await getTranslations('hub')
  const severity = computeStatusWidgetSeverity(msUntilPredictionLock)

  const progressValue = qualifiersTotal > 0 ? (qualifiersCompleted / qualifiersTotal) * 100 : 0

  let ctaText: string
  if (isLoggedOff) {
    ctaText = t('gamesWidget.ctaLogin')
  } else if (progressValue === 0) {
    ctaText = t('newUser.tracks.qualifiedTeams.cta')
  } else if (progressValue < 90) {
    ctaText = t('newUser.tracks.qualifiedTeams.ctaKeep')
  } else if (progressValue < 100) {
    ctaText = t('newUser.tracks.qualifiedTeams.ctaFinish')
  } else {
    ctaText = t('newUser.tracks.qualifiedTeams.ctaReview')
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
      title={t('newUser.tracks.qualifiedTeams.title')}
      icon={<AccountTreeIcon />}
      count={`${qualifiersCompleted}/${qualifiersTotal}`}
      urgent={severity === 'error'}
    >
      <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
        {/* Description */}
        <Typography variant="body2" color="text.secondary">
          {t('newUser.tracks.qualifiedTeams.description')}
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
        {scoringRules.qualifiedTeams.length > 0 && (
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
            {scoringRules.qualifiedTeams.map((rule) => (
              <Typography key={rule} variant="body2" color="text.secondary" display="block">
                • {rule}
              </Typography>
            ))}
          </Box>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {/* Progress bar */}
        {qualifiersTotal > 0 && (
          <LinearProgress
            variant="determinate"
            value={progressValue}
            color="secondary"
            sx={{ borderRadius: 1, height: 6 }}
          />
        )}

        {/* CTA */}
        <GamesInfoWidgetCta isLoggedOff={isLoggedOff} href={qtHref} label={ctaText} />
      </Stack>
    </DashboardCard>
  )
}
