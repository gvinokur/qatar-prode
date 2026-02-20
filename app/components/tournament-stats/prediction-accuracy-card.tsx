'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, Grid, Typography, useTheme } from "@mui/material";

type Props = {
  readonly totalPredictionsMade: number
  readonly totalGamesAvailable: number
  readonly completionPercentage: number
  readonly overallCorrect: number
  readonly overallCorrectPercentage: number
  readonly overallExact: number
  readonly overallExactPercentage: number
  readonly overallMissed: number
  readonly overallMissedPercentage: number
  readonly groupCorrect: number
  readonly groupCorrectPercentage: number
  readonly groupExact: number
  readonly groupExactPercentage: number
  readonly playoffCorrect: number
  readonly playoffCorrectPercentage: number
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
          sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px` }}
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
        sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px` }}
      />
      <CardContent>
        <Grid container spacing={1}>
          {/* Summary Section */}
          <Grid size={8}>
            <Typography variant='h6' color='primary.light'>
              {t('accuracy.totalPredictions')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='h6' fontWeight={700} align='right'>
              {props.totalPredictionsMade} / {props.totalGamesAvailable}
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light'>
              {t('accuracy.completed')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.completionPercentage.toFixed(1)}%
            </Typography>
          </Grid>

          {/* Divider */}
          <Grid
            sx={{ borderTop: `${theme.palette.primary.contrastText} 1px solid` }}
            mt={2}
            size={12}
          >
            <Typography variant='h6' color='primary.light'>
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
              {props.overallCorrect} ({props.overallCorrectPercentage.toFixed(1)}%)
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('accuracy.exactScore')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.overallExact} ({props.overallExactPercentage.toFixed(1)}%)
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('accuracy.missed')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.overallMissed} ({props.overallMissedPercentage.toFixed(1)}%)
            </Typography>
          </Grid>

          {/* Stage Breakdown */}
          <Grid
            sx={{ borderTop: `${theme.palette.primary.contrastText} 1px solid` }}
            mt={2}
            size={12}
          >
            <Typography variant='h6' color='primary.light'>
              {t('accuracy.byPhase')}
            </Typography>
          </Grid>

          {/* Group Stage */}
          <Grid size={12} mt={1}>
            <Typography variant='body1' fontWeight={600} color='primary.main'>
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
            <Typography variant='body1' fontWeight={600} color='primary.main'>
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
