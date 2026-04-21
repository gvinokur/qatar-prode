import React from 'react'
import { Box, Button, LinearProgress, Paper, Stack, Typography } from '@mui/material'
import {
  AccountTree as AccountTreeIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Celebration as CelebrationIcon,
  EmojiEvents as EmojiEventsIcon,
  Schedule as ScheduleIcon,
  SportsSoccer as SportsSoccerIcon,
} from '@mui/icons-material'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { PreTournamentCountdown } from './pre-tournament-hero'
import { TutorialCTACard } from './tutorial-cta-card'
import { getRulesBySection, getConstraintsBySection } from '../../utils/scoring-rules-utils'
import type { ActionCenterData } from '../../actions/hub-actions'
import type { Locale } from '../../../i18n.config'

interface PreTournamentNewUserActionCenterProps {
  readonly data: ActionCenterData
  readonly tournamentId: string
  readonly locale: Locale
}

interface PredictionTrackCardProps {
  readonly title: string
  readonly icon: React.ReactNode
  readonly description: string
  readonly rules: string[]
  readonly scoringLabel: string
  readonly deadline: string | null
  readonly deadlineLabel: string
  readonly progress: number
  readonly completed: number
  readonly total: number
  readonly cta: string
  readonly href: string
  readonly isComplete: boolean
}

function PredictionTrackCard({
  title,
  icon,
  description,
  rules,
  scoringLabel,
  deadline,
  deadlineLabel,
  progress,
  completed,
  total,
  cta,
  href,
  isComplete,
}: PredictionTrackCardProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        {/* Header row: icon + title + progress count */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ color: 'secondary.main', display: 'flex' }}>{icon}</Box>
          <Typography variant="subtitle1" fontWeight="bold" flexGrow={1}>
            {title}
          </Typography>
          {total > 0 && (
            <Typography variant="caption" color="text.secondary">
              {completed}/{total}
            </Typography>
          )}
        </Stack>

        {/* Description */}
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>

        {/* Deadline box */}
        {deadline !== null && (
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
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                {deadlineLabel}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block">
              {deadline}
            </Typography>
          </Box>
        )}

        {/* Scoring rules box */}
        {rules.length > 0 && (
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
                {scoringLabel}
              </Typography>
            </Stack>
            {rules.map((rule) => (
              <Typography key={rule} variant="caption" color="text.secondary" display="block">
                • {rule}
              </Typography>
            ))}
          </Box>
        )}

        {/* Progress bar */}
        <LinearProgress
          variant="determinate"
          value={progress}
          color={isComplete ? 'success' : 'secondary'}
          sx={{ borderRadius: 1, height: 6 }}
        />

        {/* CTA button */}
        <Button
          component={Link}
          href={href}
          variant={isComplete ? 'outlined' : 'contained'}
          color="primary"
          size="small"
          fullWidth
          startIcon={isComplete ? <CelebrationIcon /> : undefined}
        >
          {cta}
        </Button>
      </Stack>
    </Paper>
  )
}

export async function PreTournamentNewUserActionCenter({
  data,
  tournamentId,
  locale,
}: PreTournamentNewUserActionCenterProps) {
  const t = await getTranslations('hub')
  const tRulesRaw = await getTranslations('rules.rules')
  const tConstraintsRaw = await getTranslations('rules.constraints')
  // Wrap with typed adapters so the utils can use plain string keys
  // The key casts widen `string` to next-intl's internal MessageKey union; both are required by TS.
  const tRules = (key: string, params?: Record<string, unknown>) =>
    tRulesRaw(key as Parameters<typeof tRulesRaw>[0], params as Parameters<typeof tRulesRaw>[1]) // NOSONAR
  const tConstraints = (key: string, params?: Record<string, unknown>) =>
    tConstraintsRaw(
      key as Parameters<typeof tConstraintsRaw>[0], // NOSONAR
      params as Parameters<typeof tConstraintsRaw>[1]
    )

  const rulesBySection = getRulesBySection(data.scoringConfig, tRules)

  const gamesUrl = `/${locale}/tournaments/${tournamentId}/games`
  const qualifiedTeamsUrl = `/${locale}/tournaments/${tournamentId}/qualified-teams`
  const awardsUrl = `/${locale}/tournaments/${tournamentId}/awards`

  // Progress: treat total=0 as 100% (nothing to predict = section is complete),
  // consistent with computeIsIncompleteUser's zero-total handling.
  const gamesProgress =
    data.totalGames === 0 ? 100 : Math.round((data.predictedGames / data.totalGames) * 100)
  const awardsProgress =
    data.awardsTotal === 0 ? 100 : Math.round((data.awardsCompleted / data.awardsTotal) * 100)
  const qtProgress =
    data.qualifiersTotal === 0
      ? 100
      : Math.round((data.qualifiersCompleted / data.qualifiersTotal) * 100)

  const matchesComplete = gamesProgress >= 100
  const awardsComplete = awardsProgress >= 100
  const qtComplete = qtProgress >= 100

  const scoringLabel = t('newUser.tracks.scoringLabel')
  const deadlineLabel = t('newUser.tracks.deadline.label')

  // QT/Awards lock 5 days after the first game — compute the formatted date once and pass it to
  // getConstraintsBySection, which embeds it directly into the constraint text from rules.constraints.
  const qtLockDateFormatted = data.firstGameDate
    ? new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(
        new Date(data.firstGameDate.getTime() + 5 * 24 * 60 * 60 * 1000)
      )
    : null

  const constraintsBySection = getConstraintsBySection(tConstraints, qtLockDateFormatted)

  // 4-state CTA: none → keep → finish → review
  // Matches threshold: 30% | QT & Awards threshold: 90%
  let matchesCTA = t('newUser.tracks.matches.cta')
  if (gamesProgress >= 100) matchesCTA = t('newUser.tracks.matches.ctaReview')
  else if (gamesProgress >= 30) matchesCTA = t('newUser.tracks.matches.ctaFinish')
  else if (gamesProgress > 0) matchesCTA = t('newUser.tracks.matches.ctaKeep')

  let qtCTA = t('newUser.tracks.qualifiedTeams.cta')
  if (qtProgress >= 100) qtCTA = t('newUser.tracks.qualifiedTeams.ctaReview')
  else if (qtProgress >= 90) qtCTA = t('newUser.tracks.qualifiedTeams.ctaFinish')
  else if (qtProgress > 0) qtCTA = t('newUser.tracks.qualifiedTeams.ctaKeep')

  let awardsCTA = t('newUser.tracks.awards.cta')
  if (awardsProgress >= 100) awardsCTA = t('newUser.tracks.awards.ctaReview')
  else if (awardsProgress >= 90) awardsCTA = t('newUser.tracks.awards.ctaFinish')
  else if (awardsProgress > 0) awardsCTA = t('newUser.tracks.awards.ctaKeep')

  return (
    <Stack spacing={2}>
      {/* Countdown */}
      {data.firstGameDate !== null && (
        <PreTournamentCountdown
          firstGameDate={data.firstGameDate}
          tournamentName={data.tournamentName}
        />
      )}

      {/* Tutorial CTA */}
      <TutorialCTACard />

      {/* Matches track */}
      <PredictionTrackCard
        title={t('newUser.tracks.matches.title')}
        icon={<SportsSoccerIcon />}
        description={t('newUser.tracks.matches.description', { total: data.totalGames })}
        rules={rulesBySection.matches}
        scoringLabel={scoringLabel}
        deadline={constraintsBySection.matches}
        deadlineLabel={deadlineLabel}
        progress={gamesProgress}
        completed={data.predictedGames}
        total={data.totalGames}
        cta={matchesCTA}
        href={gamesUrl}
        isComplete={matchesComplete}
      />

      {/* Qualified Teams track */}
      <PredictionTrackCard
        title={t('newUser.tracks.qualifiedTeams.title')}
        icon={<AccountTreeIcon />}
        description={t('newUser.tracks.qualifiedTeams.description')}
        rules={rulesBySection.qualifiedTeams}
        scoringLabel={scoringLabel}
        deadline={constraintsBySection.qualifiedTeams}
        deadlineLabel={deadlineLabel}
        progress={qtProgress}
        completed={data.qualifiersCompleted}
        total={data.qualifiersTotal}
        cta={qtCTA}
        href={qualifiedTeamsUrl}
        isComplete={qtComplete}
      />

      {/* Awards track */}
      <PredictionTrackCard
        title={t('newUser.tracks.awards.title')}
        icon={<EmojiEventsIcon />}
        description={t('newUser.tracks.awards.description')}
        rules={rulesBySection.awards}
        scoringLabel={scoringLabel}
        deadline={constraintsBySection.awards}
        deadlineLabel={deadlineLabel}
        progress={awardsProgress}
        completed={data.awardsCompleted}
        total={data.awardsTotal}
        cta={awardsCTA}
        href={awardsUrl}
        isComplete={awardsComplete}
      />
    </Stack>
  )
}
