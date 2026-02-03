'use client'

import { Card, CardContent, CardHeader, Grid, Typography, useTheme } from "@mui/material";

type BoostAllocation = {
  groupLetter: string
  count: number
}

type Props = {
  silverBoost: {
    available: number
    used: number
    usedPercentage: number
    scoredGames: number
    successRate: number
    pointsEarned: number
    roi: number
    allocationByGroup: BoostAllocation[]
    allocationPlayoffs: number
  }
  goldenBoost: {
    available: number
    used: number
    usedPercentage: number
    scoredGames: number
    successRate: number
    pointsEarned: number
    roi: number
    allocationByGroup: BoostAllocation[]
    allocationPlayoffs: number
  }
}

export function BoostAnalysisCard(props: Props) {
  const theme = useTheme()

  // Check if user has used any boosts
  const hasNoBoosts = props.silverBoost.used === 0 && props.goldenBoost.used === 0

  if (hasNoBoosts) {
    return (
      <Card>
        <CardHeader
          title='Análisis de Boosts'
          sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px` }}
        />
        <CardContent>
          <Typography variant='body1' color='text.secondary' align='center'>
            ¡Usa tus boosts para maximizar puntos!
          </Typography>
          <Typography variant='body2' color='text.secondary' align='center' mt={1}>
            Disponibles: {props.silverBoost.available} Silver, {props.goldenBoost.available} Golden
          </Typography>
        </CardContent>
      </Card>
    )
  }

  // Format allocation display
  const formatAllocation = (boost: Props['silverBoost'] | Props['goldenBoost']) => {
    const groupParts = boost.allocationByGroup
      .map(g => `Grupo ${g.groupLetter} (${g.count})`)
      .join(', ')
    const playoffPart = boost.allocationPlayoffs > 0 ? `Playoffs (${boost.allocationPlayoffs})` : ''

    if (groupParts && playoffPart) {
      return `${groupParts}, ${playoffPart}`
    }
    return groupParts || playoffPart || 'Ninguno'
  }

  return (
    <Card>
      <CardHeader
        title='Análisis de Boosts'
        sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px` }}
      />
      <CardContent>
        <Grid container spacing={1}>
          {/* Silver Boosts Section */}
          <Grid size={12}>
            <Typography variant='h6' color='primary.light'>
              Boosts Silver
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              Disponibles
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.silverBoost.available}
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              Usados
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
                  Partidos Acertados
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body1' fontWeight={700} align='right'>
                  {props.silverBoost.scoredGames} ({props.silverBoost.successRate.toFixed(1)}%)
                </Typography>
              </Grid>

              <Grid size={8}>
                <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
                  Puntos Ganados
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body1' fontWeight={700} color='success.main' align='right'>
                  {props.silverBoost.pointsEarned}
                </Typography>
              </Grid>

              <Grid size={8}>
                <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
                  ROI (Promedio por boost)
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
              Boosts Golden
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              Disponibles
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.goldenBoost.available}
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              Usados
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
                  Partidos Acertados
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body1' fontWeight={700} align='right'>
                  {props.goldenBoost.scoredGames} ({props.goldenBoost.successRate.toFixed(1)}%)
                </Typography>
              </Grid>

              <Grid size={8}>
                <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
                  Puntos Ganados
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body1' fontWeight={700} color='success.main' align='right'>
                  {props.goldenBoost.pointsEarned}
                </Typography>
              </Grid>

              <Grid size={8}>
                <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
                  ROI (Promedio por boost)
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
                  Distribución de Boosts
                </Typography>
              </Grid>

              {props.silverBoost.used > 0 && (
                <>
                  <Grid size={12} mt={1}>
                    <Typography variant='body2' fontWeight={600} color='primary.main'>
                      Silver:
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
                      Golden:
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
