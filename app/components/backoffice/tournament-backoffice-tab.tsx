'use client'

import {Box, Grid, Typography} from "@mui/material";
import {LoadingButton} from "@mui/lab";
import {useState} from "react";
import {Tournament} from "../../db/tables-definition";

type Props = {
  tournament: Tournament
}

export default function TournamentBackofficeTab({ tournament } : Props) {
  const [loading, setLoading] = useState()

  const calculatePlayoffTeams = async () => {

  }

  const cleanUpGamesAndPlayoffTeams = async () => {

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
          <LoadingButton loading={loading} variant={'contained'}>
            Create Teams
          </LoadingButton>
        </Grid>
      </Grid>
    </Box>
  )
}
