'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, Grid, Typography, useTheme } from "@mui/material";

type Props = {
  readonly totalPredictionsMade: number
  readonly totalGamesAvailable: number
  readonly totalGamesPlayed: number
  readonly completionPercentage: number
  readonly overallCorrect: number
  readonly overallCorrectPercentage: number
  readonly overallGoalDifference: number
  readonly overallGoalDifferencePercentage: number
  readonly overallExact: number
  readonly overallExactPercentage: number
  readonly overallMissed: number
  readonly overallMissedPercentage: number
  readonly groupCorrect: number
  readonly groupCorrectPercentage: number
  readonly groupGoalDifference: number
  readonly groupGoalDifferencePercentage: number
  readonly groupExact: number
  readonly groupExactPercentage: number
  readonly playoffCorrect: number
  readonly playoffCorrectPercentage: number
  readonly playoffGoalDifference: number
  readonly playoffGoalDifferencePercentage: number
  readonly playoffExact: number
  readonly playoffExactPercentage: number
}

export function PredictionAccuracyCard(props: Props) {
  const t = useTranslations('stats')
  const theme = useTheme()

  // Handle empty state
  const hasNoPredictions = props.totalPredictionsMade === 0

  if (hasNoPredictions) {
    return (
      <Card>
        <CardHeader
          title={t('accuracy.title')}
          sx={{ borderBottom: `${theme.palette.primary.light} solid 1px` }}
        />
        <CardContent>
          <Typography variant='body1' color='text.secondary' align='center'>
            {t('accuracy.emptyState')}
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title={t('accuracy.title')}
        sx={{ borderBottom: `${theme.palette.primary.light} solid 1px` }}
      />
      <CardContent>
        <Grid container spacing={1}>
          {/* Summary Section */}
          <Grid size={8}>
            <Typography variant='h6' color='secondary.main'>
              {t('accuracy.totalPredictions')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='h6' fontWeight={700} color='secondary.main' align='right'>
              {props.totalPredictionsMade} / {props.totalGamesAvailable}
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='secondary.main'>
              {t('accuracy.completed')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} color='secondary.main' align='right'>
              {props.completionPercentage.toFixed(1)}%
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body2' color='text.secondary'>
              {t('accuracy.gamesPlayed')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body2' color='text.secondary' align='right'>
              {props.totalGamesPlayed} {t('accuracy.finished')}
            </Typography>
          </Grid>

          {/* Divider */}
          <Grid
            sx={{ borderTop: `${theme.palette.primary.contrastText} 1px solid` }}
            mt={2}
            size={12}
          >
            <Typography variant='h6' color='text.secondary'>
              {t('accuracy.overallAccuracy')}
            </Typography>
          </Grid>

          {/* Overall Accuracy */}
          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('accuracy.resultCorrect')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.overallCorrect} / {props.totalGamesPlayed} ({props.overallCorrectPercentage.toFixed(1)}%)
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('accuracy.goalDifference')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.overallGoalDifference} / {props.totalGamesPlayed} ({props.overallGoalDifferencePercentage.toFixed(1)}%)
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('accuracy.exactScore')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.overallExact} / {props.totalGamesPlayed} ({props.overallExactPercentage.toFixed(1)}%)
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('accuracy.missed')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.overallMissed} / {props.totalGamesPlayed} ({props.overallMissedPercentage.toFixed(1)}%)
            </Typography>
          </Grid>

          <Grid size={12} mt={1}>
            <Typography variant='caption' color='text.secondary' fontStyle='italic'>
              {t('accuracy.note')}
            </Typography>
          </Grid>

          {/* Stage Breakdown */}
          <Grid
            sx={{ borderTop: `${theme.palette.primary.contrastText} 1px solid` }}
            mt={2}
            size={12}
          >
            <Typography variant='h6' color='text.secondary'>
              {t('accuracy.byPhase')}
            </Typography>
          </Grid>

          {/* Group Stage */}
          <Grid size={12} mt={1}>
            <Typography variant='body1' fontWeight={600} color='text.secondary'>
              {t('accuracy.groupStage')}
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('accuracy.resultCorrect')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.groupCorrect} ({props.groupCorrectPercentage.toFixed(1)}%)
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('accuracy.goalDifference')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.groupGoalDifference} ({props.groupGoalDifferencePercentage.toFixed(1)}%)
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('accuracy.exactScore')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.groupExact} ({props.groupExactPercentage.toFixed(1)}%)
            </Typography>
          </Grid>

          {/* Playoff Stage */}
          <Grid size={12} mt={2}>
            <Typography variant='body1' fontWeight={600} color='text.secondary'>
              {t('accuracy.playoffStage')}
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('accuracy.resultCorrect')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.playoffCorrect} ({props.playoffCorrectPercentage.toFixed(1)}%)
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('accuracy.goalDifference')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.playoffGoalDifference} ({props.playoffGoalDifferencePercentage.toFixed(1)}%)
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('accuracy.exactScore')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.playoffExact} ({props.playoffExactPercentage.toFixed(1)}%)
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
