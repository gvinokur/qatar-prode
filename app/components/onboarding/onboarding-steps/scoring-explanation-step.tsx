'use client'

import { Box, Typography, Paper, Stack, Chip, Alert, AlertTitle, Divider } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import StarIcon from '@mui/icons-material/Star'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import GroupsIcon from '@mui/icons-material/Groups'
import { useTranslations } from 'next-intl'
import type { Tournament } from '@/app/db/tables-definition'

// Import DEFAULT_SCORING for fallback values
const DEFAULT_SCORING = {
  game_exact_score_points: 2,
  game_correct_outcome_points: 1,
  champion_points: 5,
  runner_up_points: 3,
  third_place_points: 1,
  individual_award_points: 3,
  qualified_team_points: 1,
  exact_position_qualified_points: 2,
}

interface ScoringExplanationStepProps {
  readonly tournament?: Tournament
}

export default function ScoringExplanationStep({ tournament }: ScoringExplanationStepProps) {
  const t = useTranslations('onboarding.steps.scoring')

  // Use tournament-specific values or fall back to defaults
  const points = {
    gameExact: tournament?.game_exact_score_points ?? DEFAULT_SCORING.game_exact_score_points,
    gameOutcome: tournament?.game_correct_outcome_points ?? DEFAULT_SCORING.game_correct_outcome_points,
    champion: tournament?.champion_points ?? DEFAULT_SCORING.champion_points,
    runnerUp: tournament?.runner_up_points ?? DEFAULT_SCORING.runner_up_points,
    thirdPlace: tournament?.third_place_points ?? DEFAULT_SCORING.third_place_points,
    individualAward: tournament?.individual_award_points ?? DEFAULT_SCORING.individual_award_points,
    qualifiedTeam: tournament?.qualified_team_points ?? DEFAULT_SCORING.qualified_team_points,
    exactPosition: tournament?.exact_position_qualified_points ?? DEFAULT_SCORING.exact_position_qualified_points,
  }

  // Calculate total for exact position (qualified + exact position bonus)
  const exactPositionTotal = points.qualifiedTeam + points.exactPosition

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom align="center">
        {t('title')}
      </Typography>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        {t('instructions')}
      </Typography>

      <Stack spacing={2} sx={{ maxWidth: 550, mx: 'auto' }}>
        {/* Game Scoring */}
        <Paper elevation={2} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <SportsSoccerIcon sx={{ color: 'primary.main' }} />
            <Typography variant="subtitle1" fontWeight="bold">
              {t('matchesHeader')}
            </Typography>
          </Box>

          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StarIcon sx={{ fontSize: 20, color: 'gold' }} />
                <Typography variant="body2">{t('exactResult.label')}</Typography>
              </Box>
              <Chip label={t('exactResult.points', { points: points.gameExact })} size="small" color="primary" />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} />
                <Typography variant="body2">{t('correctResult.label')}</Typography>
              </Box>
              <Chip label={t('correctResult.points', { points: points.gameOutcome })} size="small" color="success" />
            </Box>
          </Stack>
        </Paper>

        {/* Tournament Scoring */}
        <Paper elevation={2} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <EmojiEventsIcon sx={{ color: 'warning.main' }} />
            <Typography variant="subtitle1" fontWeight="bold">
              {t('tournamentHeader')}
            </Typography>
          </Box>

          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">{t('championMedal')}</Typography>
              <Chip label={t('exactResult.points', { points: points.champion })} size="small" sx={{ bgcolor: 'gold', color: 'black' }} />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">{t('runnerUpMedal')}</Typography>
              <Chip label={t('exactResult.points', { points: points.runnerUp })} size="small" sx={{ bgcolor: 'silver', color: 'black' }} />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">{t('thirdPlaceMedal')}</Typography>
              <Chip label={t('exactResult.points', { points: points.thirdPlace })} size="small" sx={{ bgcolor: '#CD7F32', color: 'white' }} />
            </Box>
          </Stack>
        </Paper>

        {/* Individual Awards */}
        <Paper elevation={2} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <StarIcon sx={{ color: 'warning.main' }} />
            <Typography variant="subtitle1" fontWeight="bold">
              {t('individualAwardsHeader')}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2">{t('awardPoints.label')}</Typography>
            <Chip label={t('awardPoints.points', { points: points.individualAward })} size="small" color="warning" />
          </Box>

          <Divider sx={{ my: 1 }} />

          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
            <Chip label={t('bestPlayerChip')} size="small" variant="outlined" />
            <Chip label={t('topScorerChip')} size="small" variant="outlined" />
            <Chip label={t('bestGoalkeeperChip')} size="small" variant="outlined" />
            <Chip label={t('youngPlayerChip')} size="small" variant="outlined" />
          </Stack>

          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
            {t('totalPossible', { points: points.individualAward * 4, perAward: points.individualAward })}
          </Typography>
        </Paper>

        {/* Qualifiers */}
        <Paper elevation={2} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <GroupsIcon sx={{ color: 'info.main' }} />
            <Typography variant="subtitle1" fontWeight="bold">
              {t('classificationHeader')}
            </Typography>
          </Box>

          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">{t('exactPosition.label')}</Typography>
              <Chip label={t('exactResult.points', { points: exactPositionTotal })} size="small" color="info" />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">{t('classified.label')}</Typography>
              <Chip label={t('exactResult.points', { points: points.qualifiedTeam })} size="small" color="info" variant="outlined" />
            </Box>
          </Stack>
        </Paper>

        {/* Important Note */}
        <Alert severity="info" variant="outlined">
          {tournament ? (
            <>
              <AlertTitle>{t('importantAlert.tournamentHeader', { tournament: tournament.long_name || tournament.short_name })}</AlertTitle>
              {t('importantAlert.tournamentContext')}
            </>
          ) : (
            <>
              <AlertTitle>{t('importantAlert.title')}</AlertTitle>
              {t('importantAlert.genericContext')}
            </>
          )}
        </Alert>
      </Stack>
    </Box>
  )
}

function SportsSoccerIcon(props: { readonly sx: any }) {
  // Using emoji as fallback since we're using Material-UI icons
  return <Box component="span" sx={{ fontSize: 24, ...props.sx }}>⚽</Box>
}
