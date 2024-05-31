'use client'

import {Card, CardContent, CardHeader, Grid, Typography, useTheme} from "@mui/material";

type Props = {

}

export function UserTournamentStatistics({} : Props) {
  const theme = useTheme()

  const groupScoreData = {
    correctPredictions: 0,
    exactPredictions: 0,
    totalPoints:0,
    qualifiers: 0
  }

  const playoffScoreData = {
    correctPredictions: 0,
    exactPredictions: 0,
    totalPoints: 0
  }

  const honorRollScoreData = {
    points: 0
  }

  return (
    <Card>
      <CardHeader
        title='Mis Estadisticas'
        sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px`}}
      />
      <CardContent>
        <Grid container spacing={1}>
          <Grid item xs={12}><Typography variant={'h6'} color={'primary.light'}>Fase de Grupos</Typography></Grid>
          <Grid item xs={8}><Typography variant={'body1'} color={'primary.light'}>Aciertos (Exactos)</Typography></Grid>
          <Grid item xs={4}><Typography variant={'body1'} fontWeight={700}>
            {groupScoreData.correctPredictions} ({groupScoreData.exactPredictions})
          </Typography></Grid>
          <Grid item xs={8}><Typography variant={'body1'} color={'primary.light'}>Puntos por Partidos</Typography></Grid>
          <Grid item xs={4}><Typography variant={'body1'} fontWeight={700}>
            {groupScoreData.totalPoints}
          </Typography></Grid>
          <Grid item xs={8}><Typography variant={'body1'} color={'primary.light'}>Puntos por Clasificados</Typography></Grid>
          <Grid item xs={4}><Typography variant={'body1'} fontWeight={700}>
            {groupScoreData.qualifiers}
          </Typography></Grid>
          <Grid item xs={12}
                sx={{borderTop: `${theme.palette.primary.contrastText} 1px solid` }} mt={2}>
            <Typography variant={'h6'} color={'primary.light'}>Playoffs</Typography>
          </Grid>
          <Grid item xs={8}><Typography variant={'body1'} color={'primary.light'}>Aciertos (Exactos)</Typography></Grid>
          <Grid item xs={4}><Typography variant={'body1'} fontWeight={700}>
            {playoffScoreData.correctPredictions} ({playoffScoreData.exactPredictions})
          </Typography></Grid>
          <Grid item xs={8}><Typography variant={'body1'} color={'primary.light'}>Puntos por Partidos</Typography></Grid>
          <Grid item xs={4}><Typography variant={'body1'} fontWeight={700}>
            {playoffScoreData.totalPoints}
          </Typography></Grid>
          <Grid item xs={8}><Typography variant={'body1'} color={'primary.light'}>Cuadro de Honor</Typography></Grid>
          <Grid item xs={4}><Typography variant={'body1'} fontWeight={700}>
            {honorRollScoreData.points}
          </Typography></Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
