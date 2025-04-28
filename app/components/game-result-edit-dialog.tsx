'use client'

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert
} from '@mui/material';
import { ExtendedGameData } from '../definitions';
import {GameGuess, GameGuessNew} from '../db/tables-definition';
import {calculateTeamNamesForPlayoffGame} from "../utils/playoff-teams-calculator";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

interface SharedProps {
  open: boolean;
  onClose: () => void;
  gameId: string;
  gameNumber: number;
  isPlayoffGame: boolean;
  homeTeamName: string;
  awayTeamName: string;
}

interface GameGuessEditProps extends SharedProps {
  isGameGuess: true;
  initialHomeScore?: number;
  initialAwayScore?: number;
  initialHomePenaltyWinner?: boolean;
  initialAwayPenaltyWinner?: boolean;
  onGameGuessSave: (gameId: string, homeScore?: number, awayScore?: number, homePenaltyWinner?: boolean, awayPenaltyWinner?: boolean) => Promise<void>;
}

interface GameResultEditProps extends SharedProps {
  isGameGuess: false;
  initialHomeScore?: number;
  initialAwayScore?: number;
  initialHomePenaltyScore?: number;
  initialAwayPenaltyScore?: number;
  initialGameDate: Date;
  onGameResultSave: (gameId: string, homeScore?: number | null, awayScore?: number | null, homePenaltyScore?: number, awayPenaltyScore?: number, gameDate?: Date) => Promise<void>;
}

type GameResultEditDialogProps = GameGuessEditProps | GameResultEditProps;

export default function GameResultEditDialog(props: GameResultEditDialogProps) {
  const {
    open,
    onClose,
    gameId,
    gameNumber,
    isPlayoffGame,
    homeTeamName,
    awayTeamName
  } = props;

  const [homeScore, setHomeScore] = useState<number | undefined>();
  const [awayScore, setAwayScore] = useState<number | undefined>();
  const [homePenaltyWinner, setHomePenaltyWinner] = useState(false);
  const [awayPenaltyWinner, setAwayPenaltyWinner] = useState(false);
  const [homePenaltyScore, setHomePenaltyScore] = useState<number | undefined>();
  const [awayPenaltyScore, setAwayPenaltyScore] = useState<number | undefined>();
  const [gameDate, setGameDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPenaltyShootout = homeScore !== undefined && awayScore !== undefined && homeScore === awayScore && isPlayoffGame;

  // Initialize form when dialog opens or props change
  useEffect(() => {
    if (open) {
      if (props.isGameGuess) {
        setHomeScore(props.initialHomeScore);
        setAwayScore(props.initialAwayScore);
        setHomePenaltyWinner(props.initialHomePenaltyWinner || false);
        setAwayPenaltyWinner(props.initialAwayPenaltyWinner || false);
      } else {
        setHomeScore(props.initialHomeScore);
        setAwayScore(props.initialAwayScore);
        setHomePenaltyScore(props.initialHomePenaltyScore);
        setAwayPenaltyScore(props.initialAwayPenaltyScore);
        setGameDate(props.initialGameDate);
      }

      setError(null);
    }
  }, [open, props]);

  const handleHomeScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : Number(e.target.value);
    setHomeScore(value);

    // If scores are no longer equal, reset penalty winners/scores
    if (value !== awayScore) {
      if (props.isGameGuess) {
        setHomePenaltyWinner(false);
        setAwayPenaltyWinner(false);
      } else {
        setHomePenaltyScore(undefined);
        setAwayPenaltyScore(undefined);
      }
    }
  };

  const handleAwayScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : Number(e.target.value);
    setAwayScore(value);

    // If scores are no longer equal, reset penalty winners/scores
    if (homeScore !== value) {
      if (props.isGameGuess) {
        setHomePenaltyWinner(false);
        setAwayPenaltyWinner(false);
      } else {
        setHomePenaltyScore(undefined);
        setAwayPenaltyScore(undefined);
      }
    }
  };

  const handleHomePenaltyWinnerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setHomePenaltyWinner(checked);
    if (checked) {
      setAwayPenaltyWinner(false);
    }
  };

  const handleAwayPenaltyWinnerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAwayPenaltyWinner(checked);
    if (checked) {
      setHomePenaltyWinner(false);
    }
  };

  const handleHomePenaltyScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : Number(e.target.value);
    setHomePenaltyScore(value);
  };

  const handleAwayPenaltyScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : Number(e.target.value);
    setAwayPenaltyScore(value);
  };

  const handleGameDateChange = (newDate: dayjs.Dayjs | null) => {
    setGameDate(newDate?.toDate() || null);
  };

  const handleSave = async () => {
    // Validate penalty information if needed
    if (isPenaltyShootout) {
      if (props.isGameGuess && !homePenaltyWinner && !awayPenaltyWinner) {
        setError('Please select a penalty shootout winner');
        return;
      } else if (!props.isGameGuess && (homePenaltyScore === undefined || awayPenaltyScore === undefined)) {
        setError('Please enter both penalty scores');
        return;
      }
    }

    // Validate game date for game results
    if (!props.isGameGuess && !gameDate) {
      setError('Please select a game date');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (props.isGameGuess) {
        // For game guesses
        await props.onGameGuessSave(
          gameId,
          homeScore,
          awayScore,
          homePenaltyWinner,
          awayPenaltyWinner
        );
      } else {
        // For game results
        await props.onGameResultSave(
          gameId,
          homeScore,
          awayScore,
          homePenaltyScore,
          awayPenaltyScore,
          gameDate || undefined
        );
      }
      onClose();
    } catch (err) {
      console.error('Error saving game result:', err);
      setError('Failed to save game result. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {`Edit Result: Game #${gameNumber}`}
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Game Date (only for game results) */}
        {!props.isGameGuess && (
          <Box sx={{ mb: 3 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label="Game Date & Time"
                value={gameDate ? dayjs(gameDate) : null}
                onChange={handleGameDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: "normal",
                    error: !gameDate,
                    helperText: !gameDate ? "Game date is required" : "",
                    disabled: loading
                  }
                }}
              />
            </LocalizationProvider>
          </Box>
        )}

        {/* Scores */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={8}>
              <Typography variant="body1" fontWeight="medium">
                {homeTeamName}
              </Typography>
            </Grid>

            <Grid item xs={4}>
              <TextField
                type="number"
                value={homeScore === undefined ? '' : homeScore}
                onChange={handleHomeScoreChange}
                inputProps={{ min: 0, style: { textAlign: 'center' } }}
                disabled={loading}
                size="small"
                fullWidth
              />
            </Grid>
            <Grid item xs={8}>
              <Typography variant="body1" fontWeight="medium">
                {awayTeamName}
              </Typography>
            </Grid>

            <Grid item xs={4}>
              <TextField
                type="number"
                value={awayScore === undefined ? '' : awayScore}
                onChange={handleAwayScoreChange}
                inputProps={{ min: 0, style: { textAlign: 'center' } }}
                disabled={loading}
                size="small"
                fullWidth
              />
            </Grid>
          </Grid>
        </Box>

        {/* Penalty information for playoff games */}
        {isPlayoffGame && isPenaltyShootout && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              {props.isGameGuess ? 'Ganador de la tanda de penales' : 'Penalty Shootout Scores'}
            </Typography>

            {props.isGameGuess ? (
              // Penalty winner checkboxes for game guesses
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={homePenaltyWinner}
                          onChange={handleHomePenaltyWinnerChange}
                          disabled={loading}
                        />
                      }
                      label={homeTeamName}
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={awayPenaltyWinner}
                          onChange={handleAwayPenaltyWinnerChange}
                          disabled={loading}
                        />
                      }
                      label={awayTeamName}
                    />
                  </Grid>
                </Grid>

                <Typography variant="caption" color="text.secondary">
                  Dado que el pártido terminó empatado, por favor seleccione el ganador de la tanda de penales.
                </Typography>
              </Box>
            ) : (
              // Penalty score inputs for game results
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={8}>
                  <Typography variant="body2">
                    {homeTeamName} (Penalty Score)
                  </Typography>
                </Grid>

                <Grid item xs={4}>
                  <TextField
                    type="number"
                    value={homePenaltyScore === undefined ? '' : homePenaltyScore}
                    onChange={handleHomePenaltyScoreChange}
                    inputProps={{ min: 0, style: { textAlign: 'center' } }}
                    disabled={loading}
                    size="small"
                    fullWidth
                  />
                </Grid>

                <Grid item xs={8}>
                  <Typography variant="body2">
                    {awayTeamName} (Penalty Score)
                  </Typography>
                </Grid>

                <Grid item xs={4}>
                  <TextField
                    type="number"
                    value={awayPenaltyScore === undefined ? '' : awayPenaltyScore}
                    onChange={handleAwayPenaltyScoreChange}
                    inputProps={{ min: 0, style: { textAlign: 'center' } }}
                    disabled={loading}
                    size="small"
                    fullWidth
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Saving...' : 'Save Result'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
