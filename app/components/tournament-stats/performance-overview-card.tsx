'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, Grid, Typography, useTheme } from "@mui/material";

type Props = {
  readonly totalPoints: number
  readonly groupStagePoints: number
  readonly groupGamePoints: number
  readonly groupBoostBonus: number
  readonly groupQualifiedTeamsPoints: number
  readonly groupQualifiedTeamsCorrect: number
  readonly groupQualifiedTeamsExact: number
  readonly playoffStagePoints: number
  readonly playoffGamePoints: number
  readonly playoffBoostBonus: number
  readonly honorRollPoints: number
  readonly individualAwardsPoints: number
}

export function PerformanceOverviewCard(props: Props) {
  const theme = useTheme()
  const t = useTranslations('stats')

  // Handle empty state
  const hasAnyPoints = props.totalPoints > 0

  if (!hasAnyPoints) {
    return (
      <Card>
        <CardHeader
          title={t('performance.title')}
          sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px` }}
        />
        <CardContent>
          <Typography variant='body1' color='text.secondary' align='center'>
            {t('performance.emptyState')}
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title={t('performance.title')}
        sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px` }}
      />
      <CardContent>
        <Grid container spacing={1}>
          {/* Total Points - Prominent display */}
          <Grid size={8}>
            <Typography variant='h6' color='primary.light'>
              {t('performance.totalPoints')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='h4' fontWeight={700} align='right'>
              {props.totalPoints}
            </Typography>
          </Grid>

          {/* Divider */}
          <Grid
            sx={{ borderTop: `${theme.palette.primary.contrastText} 1px solid` }}
            mt={2}
            size={12}
          >
            <Typography variant='h6' color='primary.light'>
              {t('performance.breakdown')}
            </Typography>
          </Grid>

          {/* Group Stage Section */}
          <Grid size={12} mt={1}>
            <Typography variant='body1' fontWeight={600} color='primary.main'>
              {t('performance.groupStage.title')}
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('performance.groupStage.gamePoints')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.groupGamePoints}
            </Typography>
          </Grid>

          {props.groupBoostBonus > 0 && (
            <>
              <Grid size={8}>
                <Typography variant='body2' color='primary.light' sx={{ pl: 4 }}>
                  {t('performance.groupStage.boostBonus')}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body2' fontWeight={700} color='success.main' align='right'>
                  +{props.groupBoostBonus}
                </Typography>
              </Grid>
            </>
          )}

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('performance.groupStage.qualifiedCorrect')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.groupQualifiedTeamsCorrect} ({props.groupQualifiedTeamsExact})
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('performance.groupStage.qualifiedPoints')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.groupQualifiedTeamsPoints}
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' fontWeight={600} sx={{ pl: 2 }}>
              {t('performance.groupStage.total')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.groupStagePoints}
            </Typography>
          </Grid>

          {/* Playoff Stage Section */}
          <Grid size={12} mt={2}>
            <Typography variant='body1' fontWeight={600} color='primary.main'>
              {t('performance.playoffStage.title')}
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('performance.playoffStage.gamePoints')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.playoffGamePoints}
            </Typography>
          </Grid>

          {props.playoffBoostBonus > 0 && (
            <>
              <Grid size={8}>
                <Typography variant='body2' color='primary.light' sx={{ pl: 4 }}>
                  {t('performance.playoffStage.boostBonus')}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body2' fontWeight={700} color='success.main' align='right'>
                  +{props.playoffBoostBonus}
                </Typography>
              </Grid>
            </>
          )}

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('performance.playoffStage.finalPredictions')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.honorRollPoints}
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('performance.playoffStage.individualAwards')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.individualAwardsPoints}
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' fontWeight={600} sx={{ pl: 2 }}>
              {t('performance.playoffStage.total')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.playoffStagePoints}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
