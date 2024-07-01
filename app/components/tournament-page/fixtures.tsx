'use client'

import { Card, CardContent, CardHeader, Chip, Grid, Typography, useTheme} from "@mui/material";
import {Fragment} from "react";
import {Team} from "../../db/tables-definition";
import {ExtendedGameData} from "../../definitions";

type FixturesProps = {
  games: ExtendedGameData[]
  teamsMap: {[k:string]: Team}
}

export function Fixtures( { games, teamsMap} : FixturesProps) {
  const theme = useTheme()

  const getGameResultString = (game: ExtendedGameData) => {
    if (game.gameResult && Number.isInteger(game.gameResult.home_score) && Number.isInteger(game.gameResult.away_score)) {
      if(game.game_type === 'group' || game.gameResult.is_draft || game.gameResult.home_score !== game.gameResult.away_score ) {
        return `${game.gameResult.home_score} - ${game.gameResult.away_score}`
      } else {
        return `${game.gameResult.home_score} (${game.gameResult.home_penalty_score}) - (${game.gameResult.away_penalty_score}) ${game.gameResult.away_score}`
      }
    } else {
      return 'TBP'
    }
  }

  return (
    <Card>
      <CardHeader
        title='Resultados y Proximos Partidos'
        sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px`}}
      />
      <CardContent>
        <Grid container spacing={1}>
          {games.map(game => (
            <Fragment key={game.game_number}>
              <Grid item xs={6} textAlign='center'>
                <Typography variant='body1'>
                  {game.game_date.toDateString()}
                </Typography>
              </Grid>
              <Grid item xs={6} textAlign='center'>
                <Typography variant='body1'>
                  {game.group && `Grupo ${game.group.group_letter}`}
                  {game.playoffStage && game.playoffStage.round_name}
                </Typography>
              </Grid>
              <Grid item xs={4} textAlign='center'>
                <Chip variant='filled'
                      label={game.home_team && teamsMap[game.home_team]?.name}
                      sx={{
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        fontWeight: 'bolder',
                        backgroundColor: game.home_team && teamsMap[game.home_team]?.theme?.primary_color,
                        color: game.home_team && teamsMap[game.home_team]?.theme?.secondary_color,
                        width: '100%'
                      }} />
              </Grid>
              <Grid item xs={4} textAlign='center'>
                <Chip variant='outlined'
                      label={getGameResultString(game)}
                />
              </Grid>
              <Grid item xs={4} textAlign='center'>
                <Chip variant='filled'
                      label={game.away_team && teamsMap[game.away_team]?.name}
                      sx={{
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        fontWeight: 'bolder',
                        backgroundColor: game.away_team && teamsMap[game.away_team]?.theme?.primary_color,
                        color: game.away_team && teamsMap[game.away_team]?.theme?.secondary_color,
                        width: '100%'
                      }} />
              </Grid>
              <Grid item xs={12} textAlign='center'>
                <Typography variant='body1'>
                  {game.location}
                </Typography>
              </Grid>
              <Grid item xs={12} sx={{ height: 0, borderBottom: `${theme.palette.primary.contrastText} 1px solid` }}/>
            </Fragment>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}
