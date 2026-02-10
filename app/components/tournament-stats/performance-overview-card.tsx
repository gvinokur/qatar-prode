'use client'

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

  // Handle empty state
  const hasAnyPoints = props.totalPoints > 0

  if (!hasAnyPoints) {
    return (
      <Card>
        <CardHeader
          title='Rendimiento General'
          sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px` }}
        />
        <CardContent>
          <Typography variant='body1' color='text.secondary' align='center'>
            No hay predicciones aún. ¡Comienza a predecir para ver tus estadísticas!
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title='Rendimiento General'
        sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px` }}
      />
      <CardContent>
        <Grid container spacing={1}>
          {/* Total Points - Prominent display */}
          <Grid size={8}>
            <Typography variant='h6' color='primary.light'>
              Puntos Totales en Torneo
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
              Desglose por Fase
            </Typography>
          </Grid>

          {/* Group Stage Section */}
          <Grid size={12} mt={1}>
            <Typography variant='body1' fontWeight={600} color='primary.main'>
              Fase de Grupos
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              Puntos por Partidos
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
                  + Bonus por Boosts
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
              Aciertos Clasificados (Exactos)
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.groupQualifiedTeamsCorrect} ({props.groupQualifiedTeamsExact})
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              Puntos por Clasificados
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.groupQualifiedTeamsPoints}
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' fontWeight={600} sx={{ pl: 2 }}>
              Total Fase de Grupos
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
              Fase de Playoffs
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              Puntos por Partidos
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
                  + Bonus por Boosts
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
              Predicciones Finales
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.honorRollPoints}
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              Premios Individuales
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.individualAwardsPoints}
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' fontWeight={600} sx={{ pl: 2 }}>
              Total Fase de Playoffs
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
