'use client'

import {Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, Snackbar, Typography} from "@mui/material";
import {useState} from "react";
import {Tournament} from "../../db/tables-definition";
import {
  calculateGameScores,
  generateDbTournamentTeamPlayers,
  recalculateAllPlayoffFirstRoundGameGuesses,
  deleteDBTournamentTree
} from "../../actions/backoffice-actions";
import { triggerQualifiedTeamsScoringAction } from "../../actions/qualified-teams-scoring-actions";
import {DebugObject} from "../debug";
import {deactivateTournament} from "../../actions/tournament-actions";
import {useRouter} from "next/navigation";

type Props = {
  tournament: Tournament
}

export default function TournamentBackofficeTab({ tournament } : Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false)
  const [actionResults, setActionResults] = useState<{} | null>(null)
  const [openDeactivateDialog, setOpenDeactivateDialog] = useState(false);
  const [deactivateSuccess, setDeactivateSuccess] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const importPlayers = async () => {
    setLoading(true)
    await generateDbTournamentTeamPlayers(tournament.long_name)
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

  const calculateQualifiedTeamsPredictionScores = async () => {
    setLoading(true);
    const result = await triggerQualifiedTeamsScoringAction(tournament.id);
    setActionResults(result);
    setLoading(false);
  };

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
      // Refresh to update tabs and tournament status
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (error: any) {
      setDeactivateError(error.message || 'Error deactivating tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setDeactivateSuccess(false);
  };

  const handleDeleteDialogOpen = () => {
    setOpenDeleteDialog(true);
  };

  const handleDeleteDialogClose = () => {
    setOpenDeleteDialog(false);
  };

  const handleDeleteTournament = async () => {
    setLoading(true);
    setDeleteError(null);

    try {
      await deleteDBTournamentTree(tournament);
      setDeleteSuccess(true);
      handleDeleteDialogClose();
      // Redirect to backoffice after successful deletion
      setTimeout(() => {
        router.push('/backoffice');
        router.refresh();
      }, 2000);
    } catch (error: any) {
      setDeleteError(error.message || 'Error deleting tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDeleteSnackbar = () => {
    setDeleteSuccess(false);
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
          <Button loading={loading} variant={'contained'} size={'large'} fullWidth={true} sx={{height: '100%'}} onClick={calculateQualifiedTeamsPredictionScores}>
            Calculate Qualified Teams Scores
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
            fullWidth
            sx={{height: '100%'}}
            onClick={handleDeactivateDialogOpen}
            disabled={!tournament.is_active}
          >
            {tournament.is_active ? 'Deactivate Tournament' : 'Tournament Inactive'}
          </Button>
        </Grid>
        {!tournament.is_active && (
          <Grid
            textAlign={'center'}
            size={{
              xs: 6,
              md: 3,
              lg: 2
            }}>
            <Button
              loading={loading}
              variant={'contained'}
              color={'error'}
              size={'large'}
              fullWidth
              sx={{height: '100%'}}
              onClick={handleDeleteDialogOpen}
            >
              Delete Tournament
            </Button>
          </Grid>
        )}
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
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Delete Tournament</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>Warning: This action is permanent and cannot be undone!</strong>
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            Are you sure you want to delete {tournament.long_name}?
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            This will permanently delete:
          </DialogContentText>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>All tournament configuration and settings</li>
            <li>All groups, teams, and playoff structure</li>
            <li>All games and game results</li>
            <li>All user predictions and guesses</li>
            <li>All players, venues, and rules</li>
          </Box>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button
            loading={loading}
            onClick={handleDeleteTournament}
            color="error"
            variant="contained"
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Success Snackbar */}
      <Snackbar
        open={deleteSuccess}
        autoHideDuration={6000}
        onClose={handleCloseDeleteSnackbar}
      >
        <Alert onClose={handleCloseDeleteSnackbar} severity="success" sx={{ width: '100%' }}>
          Tournament successfully deleted. Redirecting...
        </Alert>
      </Snackbar>
    </Box>
  );
}
