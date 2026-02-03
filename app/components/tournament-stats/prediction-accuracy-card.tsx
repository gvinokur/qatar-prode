'use client'

import { Card, CardContent, CardHeader, Grid, Typography, useTheme } from "@mui/material";

type Props = {
  totalPredictionsMade: number
  totalGamesAvailable: number
  completionPercentage: number
  overallCorrect: number
  overallCorrectPercentage: number
  overallExact: number
  overallExactPercentage: number
  overallMissed: number
  overallMissedPercentage: number
  groupCorrect: number
  groupCorrectPercentage: number
  groupExact: number
  groupExactPercentage: number
  playoffCorrect: number
  playoffCorrectPercentage: number
  playoffExact: number
  playoffExactPercentage: number
}

export function PredictionAccuracyCard(props: Props) {
  const theme = useTheme()

  // Handle empty state
  const hasNoPredictions = props.totalPredictionsMade === 0

  if (hasNoPredictions) {
    return (
      <Card>
        <CardHeader
          title='Precisión de Predicciones'
          sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px` }}
        />
        <CardContent>
          <Typography variant='body1' color='text.secondary' align='center'>
            Haz tu primera predicción para ver estadísticas de precisión
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title='Precisión de Predicciones'
        sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px` }}
      />
      <CardContent>
        <Grid container spacing={1}>
          {/* Summary Section */}
          <Grid size={8}>
            <Typography variant='h6' color='primary.light'>
              Predicciones Totales
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='h6' fontWeight={700} align='right'>
              {props.totalPredictionsMade} / {props.totalGamesAvailable}
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light'>
              Completado
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
              Precisión General
            </Typography>
          </Grid>

          {/* Overall Accuracy */}
          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              Resultado Correcto
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.overallCorrect} ({props.overallCorrectPercentage.toFixed(1)}%)
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              Marcador Exacto
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.overallExact} ({props.overallExactPercentage.toFixed(1)}%)
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              Falladas
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
              Por Fase
            </Typography>
          </Grid>

          {/* Group Stage */}
          <Grid size={12} mt={1}>
            <Typography variant='body1' fontWeight={600} color='primary.main'>
              Fase de Grupos
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              Resultado Correcto
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.groupCorrect} ({props.groupCorrectPercentage.toFixed(1)}%)
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              Marcador Exacto
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
              Fase de Playoffs
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              Resultado Correcto
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant='body1' fontWeight={700} align='right'>
              {props.playoffCorrect} ({props.playoffCorrectPercentage.toFixed(1)}%)
            </Typography>
          </Grid>

          <Grid size={8}>
            <Typography variant='body1' color='primary.light' sx={{ pl: 2 }}>
              Marcador Exacto
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
