'use client'

import {TournamentBaseData} from "../../../../data/tournaments";
import {Box, Button, Grid, MenuItem, Paper, Select, SelectChangeEvent, Typography, useTheme} from "@mui/material";
import {useState} from "react";

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
        <Grid flexGrow={1} alignSelf={'center'} textAlign={'right'}>
          <Typography variant={'body1'}>
            Torneos Disponibles para crear
          </Typography>
        </Grid>
        <Grid>
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
        <Grid flexGrow={1} alignSelf={'center'}>
          <Button
            loading={creating}
            variant={'contained'}
            size={'large'}
            //TODO: Handle creating of tournament
          >
            Crear
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}
