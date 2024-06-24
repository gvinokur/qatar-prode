'use client'

import {Alert, Box, Button, Grid, Snackbar, Typography} from "@mui/material";
import {LoadingButton} from "@mui/lab";
import {useState} from "react";
import {Tournament} from "../../db/tables-definition";
import {
  calculateAllUsersGroupPositions, calculateAndStoreQualifiedTeamsPoints, calculateGameScores,
  generateDbTournamentTeamPlayers,
  recalculateAllPlayoffFirstRoundGameGuesses
} from "../../actions/backoffice-actions";
import {DebugObject} from "../debug";

type Props = {
  tournament: Tournament
}

export default function TournamentBackofficeTab({ tournament } : Props) {
  const [loading, setLoading] = useState<boolean>(false)
  const [actionResults, setActionResults] = useState<{} | null>(null)

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
    const result = await calculateAllUsersGroupPositions(tournament.id)
    setActionResults(result)
    setLoading(false)
  }

  const calculateFirstPlayoffStageTeams = async () => {
    setLoading(true)
    const result = await recalculateAllPlayoffFirstRoundGameGuesses(tournament.id)
    setActionResults(result)
    setLoading(false)
  }

  const calculateGameScoresForTournament = async () => {
    setLoading(true)
    const results = await calculateGameScores(false, false)
    setActionResults(results)
    setLoading(false)
  }

  const calculateQualifiedScoresForTournament = async () => {
    setLoading(true)
    const results = await calculateAndStoreQualifiedTeamsPoints(tournament.id)
    setActionResults(results)
    setLoading(false)
  }

  return (
    <Box>
      <Grid container spacing={4} xs={12} columnSpacing={8} justifyContent={'center'}>
        <Grid item xs={12} md={12} textAlign={'center'} mt={1}>
          <Typography variant={'h4'}>Tournament Level Actions</Typography>
        </Grid>
        <Grid item xs={6} md={3} lg={2} textAlign={'center'}>
          <LoadingButton loading={loading} variant={'contained'} size={'large'} fullWidth={true} sx={{height: '100%'}} onClick={cleanUpGamesAndPlayoffTeams}>
            Clean Game results
          </LoadingButton>
        </Grid>
        <Grid item xs={6} md={3} lg={2} textAlign={'center'}>
          <LoadingButton loading={loading} variant={'contained'} size={'large'} fullWidth={true} sx={{height: '100%'}} onClick={calculatePlayoffTeams}>
            Calculate Playoff Teams
          </LoadingButton>
        </Grid>
        <Grid item xs={6} md={3} lg={2} textAlign={'center'}>
          <LoadingButton loading={loading} variant={'contained'} size={'large'} fullWidth={true} sx={{height: '100%'}} onClick={importPlayers}>
            Import Players
          </LoadingButton>
        </Grid>
        <Grid item xs={6} md={3} lg={2} textAlign={'center'}>
          <LoadingButton loading={loading} variant={'contained'} size={'large'} fullWidth={true} sx={{height: '100%'}} onClick={calculateGroupPositionForPlayers}>
            Calculate Group Positions for players
          </LoadingButton>
        </Grid>
        <Grid item xs={6} md={3} lg={2} textAlign={'center'}>
          <LoadingButton loading={loading} variant={'contained'} size={'large'} fullWidth={true} sx={{height: '100%'}} onClick={calculateFirstPlayoffStageTeams}>
            Calculate First Playoff Stage teams
          </LoadingButton>
        </Grid>
        <Grid item xs={6} md={3} lg={2} textAlign={'center'}>
          <LoadingButton loading={loading} variant={'contained'} size={'large'} fullWidth={true} sx={{height: '100%'}} onClick={calculateGameScoresForTournament}>
            Calculate Game Scores
          </LoadingButton>
        </Grid>
        <Grid item xs={6} md={3} lg={2} textAlign={'center'}>
          <LoadingButton loading={loading} variant={'contained'} size={'large'} fullWidth={true} sx={{height: '100%'}} onClick={calculateQualifiedScoresForTournament}>
            Calculate Qualified Team Scores
          </LoadingButton>
        </Grid>
      </Grid>
      {actionResults && (
        <>
          <Grid item xs={12}>
            <DebugObject object={actionResults}/>
          </Grid>
          <Grid item xs={12} mt={2}>
            <Button variant={'contained'} onClick={() => setActionResults(null)}>Clear Results</Button>
          </Grid>
        </>
      )}
    </Box>
  )
}
