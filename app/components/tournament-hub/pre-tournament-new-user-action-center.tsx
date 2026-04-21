import React from 'react'
import { Box, Button, LinearProgress, Paper, Stack, Typography } from '@mui/material'
import {
  AccountTree as AccountTreeIcon,
  EmojiEvents as EmojiEventsIcon,
  SportsSoccer as SportsSoccerIcon,
} from '@mui/icons-material'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { PreTournamentCountdown } from './pre-tournament-hero'
import { TutorialCTACard } from './tutorial-cta-card'
import { getRulesBySection } from '../../utils/scoring-rules-utils'
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
          <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
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
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight="bold"
              display="block"
              sx={{ mb: 0.5 }}
            >
              {scoringLabel}
            </Typography>
            {rules.map((rule, i) => (
              <Typography key={i} variant="caption" color="text.secondary" display="block">
                • {rule}
              </Typography>
            ))}
          </Box>
        )}

        {/* Progress bar */}
        <LinearProgress
          variant="determinate"
          value={progress}
          color={isComplete ? 'success' : 'primary'}
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
  // Wrap with a typed adapter so getRulesBySection can use a plain string key
  const tRules = (key: string, params?: Record<string, unknown>) =>
    tRulesRaw(key as Parameters<typeof tRulesRaw>[0], params as Parameters<typeof tRulesRaw>[1])

  const rulesBySection = getRulesBySection(data.scoringConfig, tRules)

  const gamesUrl = `/${locale}/tournaments/${tournamentId}/games`
  const qualifiedTeamsUrl = `/${locale}/tournaments/${tournamentId}/qualified-teams`
  const awardsUrl = `/${locale}/tournaments/${tournamentId}/awards`

  const gamesProgress =
    data.totalGames === 0 ? 0 : Math.round((data.predictedGames / data.totalGames) * 100)
  const awardsProgress =
    data.awardsTotal === 0 ? 0 : Math.round((data.awardsCompleted / data.awardsTotal) * 100)
  const qtProgress =
    data.qualifiersTotal === 0
      ? 0
      : Math.round((data.qualifiersCompleted / data.qualifiersTotal) * 100)

  const matchesComplete = data.totalGames > 0 && data.predictedGames >= data.totalGames
  const awardsComplete = data.awardsTotal > 0 && data.awardsCompleted >= data.awardsTotal
  const qtComplete = data.qualifiersTotal > 0 && data.qualifiersCompleted >= data.qualifiersTotal

  const scoringLabel = t('newUser.tracks.scoringLabel')

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
        progress={gamesProgress}
        completed={data.predictedGames}
        total={data.totalGames}
        cta={matchesComplete ? t('newUser.tracks.matches.ctaReview') : t('newUser.tracks.matches.cta')}
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
        progress={qtProgress}
        completed={data.qualifiersCompleted}
        total={data.qualifiersTotal}
        cta={qtComplete ? t('newUser.tracks.qualifiedTeams.ctaReview') : t('newUser.tracks.qualifiedTeams.cta')}
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
        progress={awardsProgress}
        completed={data.awardsCompleted}
        total={data.awardsTotal}
        cta={awardsComplete ? t('newUser.tracks.awards.ctaReview') : t('newUser.tracks.awards.cta')}
        href={awardsUrl}
        isComplete={awardsComplete}
      />
    </Stack>
  )
}
