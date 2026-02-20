'use client'

import { Card, CardContent, CardHeader, Grid, Typography, useTheme } from "@mui/material";
import { useTranslations } from 'next-intl';

type BoostAllocation = {
  groupLetter: string
  count: number
}

type Props = {
  readonly silverBoost: {
    readonly available: number
    readonly used: number
    readonly usedPercentage: number
    readonly scoredGames: number
    readonly successRate: number
    readonly pointsEarned: number
    readonly roi: number
    readonly allocationByGroup: BoostAllocation[]
    readonly allocationPlayoffs: number
  }
  readonly goldenBoost: {
    readonly available: number
    readonly used: number
    readonly usedPercentage: number
    readonly scoredGames: number
    readonly successRate: number
    readonly pointsEarned: number
    readonly roi: number
    readonly allocationByGroup: BoostAllocation[]
    readonly allocationPlayoffs: number
  }
}

export function BoostAnalysisCard(props: Props) {
  const t = useTranslations('stats');
  const theme = useTheme()

  // Check if user has used any boosts
  const hasNoBoosts = props.silverBoost.used === 0 && props.goldenBoost.used === 0

  if (hasNoBoosts) {
    return (
      <Card>
        <CardHeader
          title={t('boosts.title')}
          sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px` }}
        />
        <CardContent>
          <Typography variant='body1' color='text.secondary' align='center'>
            {t('boosts.emptyState.message')}
          </Typography>
          <Typography variant='body2' color='text.secondary' align='center' mt={1}>
            {t('boosts.emptyState.available', { silver: props.silverBoost.available, golden: props.goldenBoost.available })}
          </Typography>
        </CardContent>
      </Card>
    )
  }

  // Format allocation display
  const formatAllocation = (boost: Props['silverBoost'] | Props['goldenBoost']) => {
    const groupParts = boost.allocationByGroup
      .map(g => t('boosts.groupAllocation', { letter: g.groupLetter, count: g.count }))
      .join(', ')
    const playoffPart = boost.allocationPlayoffs > 0 ? t('boosts.playoffsAllocation', { count: boost.allocationPlayoffs }) : ''

    if (groupParts && playoffPart) {
      return `${groupParts}, ${playoffPart}`
    }
    return groupParts || playoffPart || t('boosts.none')
  }

  return (
    <Card>
      <CardHeader
        title={t('boosts.title')}
        sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px` }}
      />
      <CardContent>
        <Grid container spacing={1}>
          {/* Silver Boosts Section */}
          <Grid size={12}>
            <Typography variant='h6' color='primary.light'>
              {t('boosts.silver')}
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('boosts.available')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.silverBoost.available}
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('boosts.used')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.silverBoost.used} ({props.silverBoost.usedPercentage.toFixed(1)}%)
            </Typography>
          </Grid>

          {props.silverBoost.used > 0 && (
            <>
              <Grid size={8}>
                <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
                  {t('boosts.scoredGames')}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body1' fontWeight={700} align='right'>
                  {props.silverBoost.scoredGames} ({props.silverBoost.successRate.toFixed(1)}%)
                </Typography>
              </Grid>

              <Grid size={8}>
                <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
                  {t('boosts.pointsEarned')}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body1' fontWeight={700} color='success.main' align='right'>
                  {props.silverBoost.pointsEarned}
                </Typography>
              </Grid>

              <Grid size={8}>
                <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
                  {t('boosts.roi')}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body1' fontWeight={700} align='right'>
                  {props.silverBoost.roi.toFixed(1)} pts
                </Typography>
              </Grid>
            </>
          )}

          {/* Golden Boosts Section */}
          <Grid
            sx={{ borderTop: `${theme.palette.primary.contrastText} 1px solid` }}
            mt={2}
            size={12}
          >
            <Typography variant='h6' color='primary.light'>
              {t('boosts.golden')}
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('boosts.available')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.goldenBoost.available}
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              {t('boosts.used')}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.goldenBoost.used} ({props.goldenBoost.usedPercentage.toFixed(1)}%)
            </Typography>
          </Grid>

          {props.goldenBoost.used > 0 && (
            <>
              <Grid size={8}>
                <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
                  {t('boosts.scoredGames')}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body1' fontWeight={700} align='right'>
                  {props.goldenBoost.scoredGames} ({props.goldenBoost.successRate.toFixed(1)}%)
                </Typography>
              </Grid>

              <Grid size={8}>
                <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
                  {t('boosts.pointsEarned')}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body1' fontWeight={700} color='success.main' align='right'>
                  {props.goldenBoost.pointsEarned}
                </Typography>
              </Grid>

              <Grid size={8}>
                <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
                  {t('boosts.roi')}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body1' fontWeight={700} align='right'>
                  {props.goldenBoost.roi.toFixed(1)} pts
                </Typography>
              </Grid>
            </>
          )}

          {/* Allocation Summary */}
          {(props.silverBoost.used > 0 || props.goldenBoost.used > 0) && (
            <>
              <Grid
                sx={{ borderTop: `${theme.palette.primary.contrastText} 1px solid` }}
                mt={2}
                size={12}
              >
                <Typography variant='h6' color='primary.light'>
                  {t('boosts.distribution.title')}
                </Typography>
              </Grid>

              {props.silverBoost.used > 0 && (
                <>
                  <Grid size={12} mt={1}>
                    <Typography variant='body2' fontWeight={600} color='primary.main'>
                      {t('boosts.distribution.silverLabel')}
                    </Typography>
                  </Grid>
                  <Grid size={12}>
                    <Typography variant='body2' color='primary.light' sx={{ pl: 2 }}>
                      {formatAllocation(props.silverBoost)}
                    </Typography>
                  </Grid>
                </>
              )}

              {props.goldenBoost.used > 0 && (
                <>
                  <Grid size={12} mt={1}>
                    <Typography variant='body2' fontWeight={600} color='primary.main'>
                      {t('boosts.distribution.goldenLabel')}
                    </Typography>
                  </Grid>
                  <Grid size={12}>
                    <Typography variant='body2' color='primary.light' sx={{ pl: 2 }}>
                      {formatAllocation(props.goldenBoost)}
                    </Typography>
                  </Grid>
                </>
              )}
            </>
          )}
        </Grid>
      </CardContent>
    </Card>
  )
}
