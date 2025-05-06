'use client'

import {Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, Snackbar, Typography} from "@mui/material";
import {useState} from "react";
import {Tournament} from "../../db/tables-definition";
import {
  calculateAllUsersGroupPositions, calculateAndStoreQualifiedTeamsPoints, calculateGameScores,
  generateDbTournamentTeamPlayers,
  recalculateAllPlayoffFirstRoundGameGuesses
} from "../../actions/backoffice-actions";
import {DebugObject} from "../debug";
import {deactivateTournament} from "../../actions/tournament-actions";

type Props = {
  tournament: Tournament
}

export default function TournamentBackofficeTab({ tournament } : Props) {
  const [loading, setLoading] = useState<boolean>(false)
  const [actionResults, setActionResults] = useState<{} | null>(null)
  const [openDeactivateDialog, setOpenDeactivateDialog] = useState(false);
  const [deactivateSuccess, setDeactivateSuccess] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

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

  const handleDeactivateDialogOpen = () => {
    setOpenDeactivateDialog(true);
  };

  const handleDeactivateDialogClose = () => {
    setOpenDeactivateDialog(false);
  };

  const handleDeactivateTournament = async () => {
    setLoading(true);
    setDeactivateError(null);

    try {
      await deactivateTournament(tournament.id);
      setDeactivateSuccess(true);
      handleDeactivateDialogClose();
    } catch (error: any) {
      setDeactivateError(error.message || 'Error deactivating tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setDeactivateSuccess(false);
  };

  return (
    <Box>
      <Grid container spacing={4} columnSpacing={8} justifyContent={'center'} size={12}>
        <Grid
          textAlign={'center'}
          mt={1}
          size={{
            xs: 12,
            md: 12
          }}>
          <Typography variant={'h4'}>Tournament Level Actions</Typography>
        </Grid>
        <Grid
          textAlign={'center'}
          size={{
            xs: 6,
            md: 3,
            lg: 2
          }}>
          <Button loading={loading} variant={'contained'} size={'large'} fullWidth={true} sx={{height: '100%'}} onClick={cleanUpGamesAndPlayoffTeams}>
            Clean Game results
          </Button>
        </Grid>
        <Grid
          textAlign={'center'}
          size={{
            xs: 6,
            md: 3,
            lg: 2
          }}>
          <Button loading={loading} variant={'contained'} size={'large'} fullWidth={true} sx={{height: '100%'}} onClick={calculatePlayoffTeams}>
            Calculate Playoff Teams
          </Button>
        </Grid>
        <Grid
          textAlign={'center'}
          size={{
            xs: 6,
            md: 3,
            lg: 2
          }}>
          <Button loading={loading} variant={'contained'} size={'large'} fullWidth={true} sx={{height: '100%'}} onClick={importPlayers}>
            Import Players
          </Button>
        </Grid>
        <Grid
          textAlign={'center'}
          size={{
            xs: 6,
            md: 3,
            lg: 2
          }}>
          <Button loading={loading} variant={'contained'} size={'large'} fullWidth={true} sx={{height: '100%'}} onClick={calculateGroupPositionForPlayers}>
            Calculate Group Positions for players
          </Button>
        </Grid>
        <Grid
          textAlign={'center'}
          size={{
            xs: 6,
            md: 3,
            lg: 2
          }}>
          <Button loading={loading} variant={'contained'} size={'large'} fullWidth={true} sx={{height: '100%'}} onClick={calculateFirstPlayoffStageTeams}>
            Calculate First Playoff Stage teams
          </Button>
        </Grid>
        <Grid
          textAlign={'center'}
          size={{
            xs: 6,
            md: 3,
            lg: 2
          }}>
          <Button loading={loading} variant={'contained'} size={'large'} fullWidth={true} sx={{height: '100%'}} onClick={calculateGameScoresForTournament}>
            Calculate Game Scores
          </Button>
        </Grid>
        <Grid
          textAlign={'center'}
          size={{
            xs: 6,
            md: 3,
            lg: 2
          }}>
          <Button loading={loading} variant={'contained'} size={'large'} fullWidth={true} sx={{height: '100%'}} onClick={calculateQualifiedScoresForTournament}>
            Calculate Qualified Team Scores
          </Button>
        </Grid>
              <Grid
                textAlign={'center'}
                size={{
                  xs: 6,
                  md: 3,
                  lg: 2
                }}>
          <Button
            loading={loading}
            variant={'outlined'}
            size={'large'}
            fullWidth={true}
            sx={{height: '100%'}}
            onClick={handleDeactivateDialogOpen}
            disabled={!tournament.is_active}
          >
            {tournament.is_active ? 'Deactivate Tournament' : 'Tournament Inactive'}
          </Button>
        </Grid>
      </Grid>
      {actionResults && (
        <>
          <Grid size={12}>
            <DebugObject object={actionResults}/>
          </Grid>
          <Grid mt={2} size={12}>
            <Button variant={'contained'} onClick={() => setActionResults(null)}>Clear Results</Button>
          </Grid>
        </>
      )}
      {/* Deactivation Confirmation Dialog */}
      <Dialog
        open={openDeactivateDialog}
        onClose={handleDeactivateDialogClose}
      >
        <DialogTitle>Deactivate Tournament</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to deactivate this tournament?
            Once deactivated, users will no longer be able to see or interact with {tournament.long_name}.
          </DialogContentText>
          {deactivateError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deactivateError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeactivateDialogClose}>Cancel</Button>
          <Button
            loading={loading}
            onClick={handleDeactivateTournament}
            color="error"
          >
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>
      {/* Success Snackbar */}
      <Snackbar
        open={deactivateSuccess}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Tournament successfully deactivated
        </Alert>
      </Snackbar>
    </Box>
  );
}
