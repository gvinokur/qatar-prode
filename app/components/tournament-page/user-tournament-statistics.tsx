'use client'

import {Card, CardContent, CardHeader, Grid, Typography, useTheme} from "@mui/material";
import {GameStatisticForUser} from "../../../types/definitions";
import {TournamentGuess} from "../../db/tables-definition";

type Props = {
  userGameStatistics?: GameStatisticForUser
  tournamentGuess?: TournamentGuess
}

export function UserTournamentStatistics({userGameStatistics, tournamentGuess} : Props) {
  const theme = useTheme()

  const groupScoreData = {
    correctPredictions: userGameStatistics?.group_correct_guesses || 0,
    exactPredictions: userGameStatistics?.group_exact_guesses || 0,
    totalPoints: userGameStatistics?.group_score || 0,
    boostBonus: userGameStatistics?.group_boost_bonus || 0,
    qualifiers: tournamentGuess?.qualified_teams_score || 0
  }

  const playoffScoreData = {
    correctPredictions: userGameStatistics?.playoff_correct_guesses || 0,
    exactPredictions: userGameStatistics?.playoff_exact_guesses || 0,
    totalPoints: userGameStatistics?.playoff_score || 0,
    boostBonus: userGameStatistics?.playoff_boost_bonus || 0,
  }

  return (
    <Card>
      <CardHeader
        title='Mis Estadisticas'
        sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px`}}
      />
      <CardContent>
        <Grid container spacing={1}>
          <Grid size={12}><Typography variant={'h6'} color={'primary.light'}>Fase de Grupos</Typography></Grid>
          <Grid size={8}><Typography variant={'body1'} color={'primary.light'}>Aciertos (Exactos)</Typography></Grid>
          <Grid size={4}><Typography variant={'body1'} fontWeight={700}>
            {groupScoreData.correctPredictions} ({groupScoreData.exactPredictions})
          </Typography></Grid>
          <Grid size={8}><Typography variant={'body1'} color={'primary.light'}>Puntos por Partidos</Typography></Grid>
          <Grid size={4}><Typography variant={'body1'} fontWeight={700}>
            {groupScoreData.totalPoints}
          </Typography></Grid>
          {groupScoreData.boostBonus > 0 && (
            <>
              <Grid size={8}><Typography variant={'body2'} color={'primary.light'} sx={{ pl: 2 }}>+ Bonus por Boosts</Typography></Grid>
              <Grid size={4}><Typography variant={'body2'} fontWeight={700} color={'success.main'}>
                +{groupScoreData.boostBonus}
              </Typography></Grid>
            </>
          )}
          <Grid size={8}><Typography variant={'body1'} color={'primary.light'}>Puntos por Clasificados</Typography></Grid>
          <Grid size={4}><Typography variant={'body1'} fontWeight={700}>
            {groupScoreData.qualifiers}
          </Typography></Grid>
          <Grid size={8}><Typography variant={'body1'} color={'primary.light'}>Posiciones Grupo</Typography></Grid>
          <Grid size={4}><Typography variant={'body1'} fontWeight={700}>
            {tournamentGuess?.group_position_score || 0}
          </Typography></Grid>
          <Grid
            sx={{borderTop: `${theme.palette.primary.contrastText} 1px solid` }}
            mt={2}
            size={12}>
            <Typography variant={'h6'} color={'primary.light'}>Playoffs</Typography>
          </Grid>
          <Grid size={8}><Typography variant={'body1'} color={'primary.light'}>Aciertos (Exactos)</Typography></Grid>
          <Grid size={4}><Typography variant={'body1'} fontWeight={700}>
            {playoffScoreData.correctPredictions} ({playoffScoreData.exactPredictions})
          </Typography></Grid>
          <Grid size={8}><Typography variant={'body1'} color={'primary.light'}>Puntos por Partidos</Typography></Grid>
          <Grid size={4}><Typography variant={'body1'} fontWeight={700}>
            {playoffScoreData.totalPoints}
          </Typography></Grid>
          {playoffScoreData.boostBonus > 0 && (
            <>
              <Grid size={8}><Typography variant={'body2'} color={'primary.light'} sx={{ pl: 2 }}>+ Bonus por Boosts</Typography></Grid>
              <Grid size={4}><Typography variant={'body2'} fontWeight={700} color={'success.main'}>
                +{playoffScoreData.boostBonus}
              </Typography></Grid>
            </>
          )}
          <Grid
            sx={{borderTop: `${theme.palette.primary.contrastText} 1px solid` }}
            mt={2}
            size={12}>
            <Typography variant={'h6'} color={'primary.light'}>Torneo</Typography>
          </Grid>
          <Grid size={8}><Typography variant={'body1'} color={'primary.light'}>Cuadro de Honor</Typography></Grid>
          <Grid size={4}><Typography variant={'body1'} fontWeight={700}>
            {tournamentGuess?.honor_roll_score || 0}
          </Typography></Grid>
          <Grid size={8}><Typography variant={'body1'} color={'primary.light'}>Premios</Typography></Grid>
          <Grid size={4}><Typography variant={'body1'} fontWeight={700}>
            {tournamentGuess?.individual_awards_score || 0}
          </Typography></Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
