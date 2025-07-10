'use client'

import React, {useState, useEffect, useCallback} from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SportsIcon from '@mui/icons-material/Sports';
import { Game, Team } from "../../db/tables-definition";
import {
  getCompleteTournamentGroups,
  getPlayoffRounds,
  getTeamsMap
} from "../../actions/tournament-actions";
import GameDialog from './internal/game-dialog';
import {getGamesInTournament} from "../../actions/game-actions";
import {ExtendedGameData, ExtendedGroupData} from "../../definitions";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import UTC from "dayjs/plugin/utc";
import {getTeamDescription} from "../../utils/playoffs-rule-helper";

dayjs.extend(UTC);
dayjs.extend(timezone);

interface TournamentGameManagerProps {
  tournamentId: string;
}

const TournamentGameManager: React.FC<TournamentGameManagerProps> = ({ tournamentId }) => {
  const [games, setGames] = useState<ExtendedGameData[]>([]);
  const [teams, setTeams] = useState<{[key: string]: Team}>({});
  const [groups, setGroups] = useState<ExtendedGroupData[]>([]);
  const [playoffStages, setPlayoffStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [nextGameNumber, setNextGameNumber] = useState<number>(0)

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [gamesData, teamsData, groupsData, playoffData] = await Promise.all([
        getGamesInTournament(tournamentId),
        getTeamsMap(tournamentId),
        getCompleteTournamentGroups(tournamentId),
        getPlayoffRounds(tournamentId),
      ]);

      // Sort games by game number
      const sortedGames = gamesData.toSorted((a, b) => (a.game_number || 0) - (b.game_number || 0));

      setGames(sortedGames);
      setTeams(teamsData);
      setGroups(groupsData);
      setPlayoffStages(playoffData);
    } catch {
      console.error('Error loading tournament data');
      setError('Failed to load tournament data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  // Load data when component mounts
  useEffect(() => {
    loadData();
  }, [tournamentId, loadData]);

  const handleOpenCreateDialog = () => {
    setCurrentGame(null);
    setNextGameNumber(games.length + 1);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (game: Game) => {
    setCurrentGame(game);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentGame(null);
  };

  const handleGameSaved = () => {
    loadData();
    handleCloseDialog();
  };

  const handleOpenDeleteConfirm = (game: Game) => {
    setGameToDelete(game);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setGameToDelete(null);
  };

  const handleDeleteGame = async () => {
    if (!gameToDelete) return;

    try {
      // await deleteGame(gameToDelete.id);
      handleCloseDeleteConfirm();
      loadData();
    } catch {
      console.error('Error deleting game');
      setError('Failed to delete game. Please try again.');
    }
  };

  const getGameLocation = (game: Game) => {
    return game.location || 'No location specified';
  };

  const getGameGroupOrPlayoffStage = (game: ExtendedGameData) => {
    if (game.game_type === 'group') {
      return game.group?.group_letter ? `Group ${game.group.group_letter}` : 'Unknown Group';
    }
    return game.playoffStage?.round_name ? game.playoffStage.round_name : 'Unknown Stage';
  };

  const formatGameDate = (date: Date) => {
    return dayjs(date).format('MMM D, YYYY - HH:mm');
  };

  const formatGameDateInLocalTimezone = (date: Date, tz?: string) => {
    if(tz && Intl.supportedValuesOf('timeZone').includes(tz)) {
      return dayjs(date).tz(tz).format('MMM D, YYYY - HH:mm');
    }
    return "No timezone specified";
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Tournament Games</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
          autoFocus={true}
        >
          Add Game
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {games.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <SportsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No games found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            There are no games in this tournament yet.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Add First Game
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="5%">#</TableCell>
                <TableCell width="30%">Teams</TableCell>
                <TableCell width="15%">Date & Time</TableCell>
                <TableCell width="15%">Local Date & Time</TableCell>
                <TableCell width="20%">Location</TableCell>
                <TableCell width="10%">Group/Stage</TableCell>
                <TableCell width="5%" align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {games.map((game) => (
                <TableRow key={game.id} hover>
                  <TableCell>{game.game_number || 'N/A'}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" component={'span'}>
                        {game.home_team && teams[game.home_team]?.name || ''}
                        {game.game_type !== 'group' && game.home_team && ' ( ' || ''}
                        {game.game_type !== 'group' && game.home_team_rule && getTeamDescription(game.home_team_rule) || ''}
                        {game.game_type !== 'group' && game.home_team && ' ) ' || ''}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" component={'span'}>
                        &nbsp;vs&nbsp;
                      </Typography>
                      <Typography variant="body2" component={'span'}>
                        {game.away_team && teams[game.away_team]?.name || ''}
                        {game.game_type !== 'group' && game.home_team && ' ( ' || ''}
                        {game.game_type !== 'group' && game.away_team_rule && getTeamDescription(game.away_team_rule) || ''}
                        {game.game_type !== 'group' && game.home_team && ' ) ' || ''}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{formatGameDate(game.game_date)}</TableCell>
                  <TableCell>{formatGameDateInLocalTimezone(game.game_date, game.game_local_timezone)}</TableCell>
                  <TableCell>{getGameLocation(game)}</TableCell>
                  <TableCell>
                    <Chip
                      label={getGameGroupOrPlayoffStage(game)}
                      size="small"
                      color={game.game_type === 'group' ? "primary" : "secondary"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit Game">
                      <IconButton
                                  onClick={() => handleOpenEditDialog(game)} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Game">
                      <IconButton
                        disabled={!!game.gameResult}
                        onClick={() => handleOpenDeleteConfirm(game)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Game Dialog for Create/Edit */}
      <GameDialog
        open={openDialog}
        onClose={handleCloseDialog}
        game={currentGame}
        nextGameNumber={nextGameNumber}
        tournamentId={tournamentId}
        teams={teams}
        groups={groups}
        playoffStages={playoffStages}
        onSave={handleGameSaved}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleCloseDeleteConfirm}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete game #{gameToDelete?.game_number || 'N/A'}?
          </Typography>
          <Typography color="error" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm}>Cancel</Button>
          <Button onClick={handleDeleteGame} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentGameManager;
