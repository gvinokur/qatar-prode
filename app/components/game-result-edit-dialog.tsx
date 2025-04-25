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

interface GameResultEditDialogProps {
  open: boolean;
  onClose: () => void;
  game?: ExtendedGameData | null;
  gameGuess?: GameGuessNew | GameGuess | null;
  onGameResultSave: (gameGuess: GameGuess | GameGuessNew, homeScore?: number, awayScore?: number, homePenaltyWinner?: boolean, awayPenaltyWinner?: boolean) => Promise<void>;
  homeTeamName: string;
  awayTeamName: string;
}

export default function GameResultEditDialog({
  open,
  onClose,
  game,
  gameGuess,
  onGameResultSave,
  homeTeamName,
  awayTeamName
}: GameResultEditDialogProps) {
  const [homeScore, setHomeScore] = useState<number>();
  const [awayScore, setAwayScore] = useState<number>();
  const [homePenaltyWinner, setHomePenaltyWinner] = useState(false);
  const [awayPenaltyWinner, setAwayPenaltyWinner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPlayoffGame = !!game?.playoffStage;
  const isPenaltyShootout = homeScore !== null && awayScore !== null && homeScore === awayScore && isPlayoffGame;

  // Initialize form when dialog opens or game changes
  useEffect(() => {
    if (open && game) {
      // If we have a gameGuess, use its values
      if (gameGuess) {
        setHomeScore(gameGuess.home_score);
        setAwayScore(gameGuess.away_score);
        setHomePenaltyWinner(gameGuess.home_penalty_winner || false);
        setAwayPenaltyWinner(gameGuess.away_penalty_winner || false);
      }
      setError(null);
    }
  }, [open, game, gameGuess]);

  const handleHomeScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : Number(e.target.value);
    setHomeScore(value);

    // If scores are no longer equal, reset penalty winners
    if (value !== awayScore) {
      setHomePenaltyWinner(false);
      setAwayPenaltyWinner(false);
    }
  };

  const handleAwayScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : Number(e.target.value);
    setAwayScore(value);

    // If scores are no longer equal, reset penalty winners
    if (homeScore !== value) {
      setHomePenaltyWinner(false);
      setAwayPenaltyWinner(false);
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

  const handleSave = async () => {
    if (!game || !gameGuess) return;

    // Validate scores
    if (homeScore === null || awayScore === null) {
      setError('Please enter both scores');
      return;
    }

    // Validate penalty winner selection if needed
    if (isPenaltyShootout && !homePenaltyWinner && !awayPenaltyWinner) {
      setError('Please select a penalty shootout winner');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onGameResultSave(
        gameGuess,
        homeScore,
        awayScore,
        homePenaltyWinner,
        awayPenaltyWinner
      );
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
        {game ? `Edit Result: Game #${game.game_number}` : 'Edit Game Result'}
        <Typography variant="subtitle1" gutterBottom>
          {game?.game_date ? new Date(game.game_date).toLocaleDateString() : ''}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

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
                value={homeScore === null ? '' : homeScore}
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
                value={awayScore === null ? '' : awayScore}
                onChange={handleAwayScoreChange}
                inputProps={{ min: 0, style: { textAlign: 'center' } }}
                disabled={loading}
                size="small"
                fullWidth
              />
            </Grid>
          </Grid>
        </Box>

        {isPlayoffGame && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Penalty Shootout Winner
            </Typography>

            <Box sx={{ opacity: isPenaltyShootout ? 1 : 0.5, pointerEvents: isPenaltyShootout ? 'auto' : 'none' }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={homePenaltyWinner}
                        onChange={handleHomePenaltyWinnerChange}
                        disabled={!isPenaltyShootout || loading}
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
                        disabled={!isPenaltyShootout || loading}
                      />
                    }
                    label={awayTeamName}
                  />
                </Grid>
              </Grid>

              {isPenaltyShootout && (
                <Typography variant="caption" color="text.secondary">
                  Since the scores are tied, please select the penalty shootout winner.
                </Typography>
              )}
            </Box>
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
