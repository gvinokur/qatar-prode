'use client'

import {TournamentBaseData} from "../../../../data/tournaments";
import {Box, Grid, MenuItem, Paper, Select, SelectChangeEvent, Typography, useTheme} from "@mui/material";
import {useState} from "react";
import {LoadingButton} from "@mui/lab";

type Props = {
  tournaments: TournamentBaseData[]
}

export default function TournamentsCreate({tournaments}: Props) {
  const theme = useTheme()
  const [selectedTournament, setSelectedTournament] = useState<string>(tournaments[0].tournament_name)
  const [creating, setCreating] = useState<boolean>(false)

  return (
    <Paper square={false} elevation={1} variant={'outlined'}
      sx={{
        padding:2,
        color: theme.palette.primary.main,
        borderColor: theme.palette.primary.main
      }}
    >
      <Grid container spacing={2}>
        <Grid
          item
          flexGrow={1}
          alignSelf={'center'}
          textAlign={'right'}
        >
          <Typography variant={'body1'}>
            Torneos Disponibles para crear
          </Typography>
        </Grid>
        <Grid item>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={selectedTournament}
            onChange={(e: SelectChangeEvent) => setSelectedTournament(e.target.value)}
          >
            {tournaments.map(tournament => (
              <MenuItem value={tournament.tournament_name} key={tournament.tournament_name}>{tournament.tournament_name}</MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid
          item
          flexGrow={1}
          alignSelf={'center'}
        >
          <LoadingButton
            loading={creating}
            variant={'contained'}
            size={'large'}
            //TODO: Handle creating of tournament
          >
            Crear
          </LoadingButton>
        </Grid>
      </Grid>


    </Paper>
  )
}
