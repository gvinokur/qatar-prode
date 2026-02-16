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
  CircularProgress,
  Alert
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import GamePredictionEditControls from './game-prediction-edit-controls';

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
  initialBoostType?: 'silver' | 'golden' | null;
  tournamentId?: string;
  onGameGuessSave: (_gameId: string, _homeScore?: number, _awayScore?: number, _homePenaltyWinner?: boolean, _awayPenaltyWinner?: boolean, _boostType?: 'silver' | 'golden' | null) => Promise<void>;
}

interface GameResultEditProps extends SharedProps {
  isGameGuess: false;
  initialHomeScore?: number;
  initialAwayScore?: number;
  initialHomePenaltyScore?: number;
  initialAwayPenaltyScore?: number;
  initialGameDate: Date;
  onGameResultSave: (_gameId: string, _homeScore?: number | null, _awayScore?: number | null, _homePenaltyScore?: number, _awayPenaltyScore?: number, _gameDate?: Date) => Promise<void>;
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

  // Extract tournamentId for game guesses
  const tournamentId = props.isGameGuess ? props.tournamentId : undefined;

  const [homeScore, setHomeScore] = useState<number | undefined>();
  const [awayScore, setAwayScore] = useState<number | undefined>();
  const [homePenaltyWinner, setHomePenaltyWinner] = useState(false);
  const [awayPenaltyWinner, setAwayPenaltyWinner] = useState(false);
  const [homePenaltyScore, setHomePenaltyScore] = useState<number | undefined>();
  const [awayPenaltyScore, setAwayPenaltyScore] = useState<number | undefined>();
  const [gameDate, setGameDate] = useState<Date | null>(null);
  const [boostType, setBoostType] = useState<'silver' | 'golden' | null>(null);
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
        setBoostType(props.initialBoostType || null);
      } else {
        setHomeScore(props.initialHomeScore);
        setAwayScore(props.initialAwayScore);
        setHomePenaltyScore(props.initialHomePenaltyScore);
        setAwayPenaltyScore(props.initialAwayPenaltyScore);
        setGameDate(props.initialGameDate);
      }

      setError(null);
    }
    // Only re-initialize when dialog opens, not when other props change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);


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
          awayPenaltyWinner,
          boostType
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
    } catch {
      console.error('Error saving game result');
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

        {/* Game Guess Edit Controls (shared component) */}
        {props.isGameGuess && (
          <GamePredictionEditControls
            gameId={gameId}
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
            isPlayoffGame={isPlayoffGame}
            tournamentId={tournamentId}
            homeScore={homeScore}
            awayScore={awayScore}
            homePenaltyWinner={homePenaltyWinner}
            awayPenaltyWinner={awayPenaltyWinner}
            boostType={boostType}
            initialBoostType={props.initialBoostType}
            onHomeScoreChange={setHomeScore}
            onAwayScoreChange={setAwayScore}
            onHomePenaltyWinnerChange={setHomePenaltyWinner}
            onAwayPenaltyWinnerChange={setAwayPenaltyWinner}
            onBoostTypeChange={setBoostType}
            loading={loading}
            error={error}
            layout="vertical"
          />
        )}

        {/* Game Results: Scores and Penalty Scores (for non-guesses) */}
        {!props.isGameGuess && (
          <>
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={8}>
                  <Typography variant="body1" fontWeight="medium">
                    {homeTeamName}
                  </Typography>
                </Grid>

                <Grid size={4}>
                  <TextField
                    type="number"
                    value={homeScore ?? ''}
                    onChange={handleHomeScoreChange}
                    slotProps={{ htmlInput: { min: 0, style: { textAlign: 'center' } } }}
                    disabled={loading}
                    size="small"
                    fullWidth
                  />
                </Grid>
                <Grid size={8}>
                  <Typography variant="body1" fontWeight="medium">
                    {awayTeamName}
                  </Typography>
                </Grid>

                <Grid size={4}>
                  <TextField
                    type="number"
                    value={awayScore ?? ''}
                    onChange={handleAwayScoreChange}
                    slotProps={{ htmlInput: { min: 0, style: { textAlign: 'center' } } }}
                    disabled={loading}
                    size="small"
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Penalty scores for playoff games */}
            {isPlayoffGame && isPenaltyShootout && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Penalty Shootout Scores
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={8}>
                    <Typography variant="body2">
                      {homeTeamName} (Penalty Score)
                    </Typography>
                  </Grid>
                  <Grid size={4}>
                    <TextField
                      type="number"
                      value={homePenaltyScore ?? ''}
                      onChange={handleHomePenaltyScoreChange}
                      slotProps={{ htmlInput: { min: 0, style: { textAlign: 'center' } } }}
                      disabled={loading}
                      size="small"
                      fullWidth
                    />
                  </Grid>
                  <Grid size={8}>
                    <Typography variant="body2">
                      {awayTeamName} (Penalty Score)
                    </Typography>
                  </Grid>
                  <Grid size={4}>
                    <TextField
                      type="number"
                      value={awayPenaltyScore ?? ''}
                      onChange={handleAwayPenaltyScoreChange}
                      slotProps={{ htmlInput: { min: 0, style: { textAlign: 'center' } } }}
                      disabled={loading}
                      size="small"
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </>
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
