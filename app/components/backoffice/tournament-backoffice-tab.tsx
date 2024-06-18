'use client'

import {Box, Grid, Typography} from "@mui/material";
import {LoadingButton} from "@mui/lab";
import {useState} from "react";
import {Tournament} from "../../db/tables-definition";
import {calculateAllUsersGroupPositions, generateDbTournamentTeamPlayers} from "../../actions/backoffice-actions";

type Props = {
  tournament: Tournament
}

export default function TournamentBackofficeTab({ tournament } : Props) {
  const [loading, setLoading] = useState<boolean>(false)

  const calculatePlayoffTeams = async () => {

  }

  const cleanUpGamesAndPlayoffTeams = async () => {

  }

  const importPlayers = async () => {
    setLoading(true)
    await generateDbTournamentTeamPlayers(tournament.long_name)
    setLoading(false)
  }

  const calculateGroupPositionForPlayers = async () => {
    setLoading(true)
    await calculateAllUsersGroupPositions(tournament.id)
    setLoading(false)
  }

  return (
    <Box>
      <Grid container spacing={1} xs={12}>
        <Grid item xs={12} md={12} textAlign={'center'} mb={3} mt={1}>
          <Typography variant={'h4'}>Tournament Level Actions</Typography>
        </Grid>
        <Grid item xs={6} md={4} textAlign={'center'}>
          <LoadingButton loading={loading} variant={'contained'} onClick={cleanUpGamesAndPlayoffTeams}>
            Clean Game results
          </LoadingButton>
        </Grid>
        <Grid item xs={6} md={4} textAlign={'center'}>
          <LoadingButton loading={loading} variant={'contained'} onClick={calculatePlayoffTeams}>
            Calculate Playoff Teams
          </LoadingButton>
        </Grid>
        <Grid item xs={6} md={4} textAlign={'center'}>
          <LoadingButton loading={loading} variant={'contained'} onClick={importPlayers}>
            Import Players
          </LoadingButton>
        </Grid>
        <Grid item xs={6} md={4} textAlign={'center'}>
          <LoadingButton loading={loading} variant={'contained'} onClick={calculateGroupPositionForPlayers}>
            Calculate Group Positions for players
          </LoadingButton>
        </Grid>
      </Grid>
    </Box>
  )
}
