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
  Alert,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Chip
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { getBoostCountsAction } from '../actions/game-boost-actions';

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

  const [homeScore, setHomeScore] = useState<number | undefined>();
  const [awayScore, setAwayScore] = useState<number | undefined>();
  const [homePenaltyWinner, setHomePenaltyWinner] = useState(false);
  const [awayPenaltyWinner, setAwayPenaltyWinner] = useState(false);
  const [homePenaltyScore, setHomePenaltyScore] = useState<number | undefined>();
  const [awayPenaltyScore, setAwayPenaltyScore] = useState<number | undefined>();
  const [gameDate, setGameDate] = useState<Date | null>(null);
  const [boostType, setBoostType] = useState<'silver' | 'golden' | null>(null);
  const [boostCounts, setBoostCounts] = useState<{ silver: { used: number; max: number }; golden: { used: number; max: number } } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPenaltyShootout = homeScore !== undefined && awayScore !== undefined && homeScore === awayScore && isPlayoffGame;

  // Calculate effective boost counts based on current selection
  const getEffectiveBoostCounts = () => {
    if (!boostCounts || !props.isGameGuess) return null;

    const initialBoost = props.initialBoostType;
    const currentBoost = boostType;

    let silverUsed = boostCounts.silver.used;
    let goldenUsed = boostCounts.golden.used;

    // If initial boost was set, free it up first
    if (initialBoost === 'silver') silverUsed--;
    if (initialBoost === 'golden') goldenUsed--;

    // Then apply current selection
    if (currentBoost === 'silver') silverUsed++;
    if (currentBoost === 'golden') goldenUsed++;

    return {
      silver: { used: silverUsed, max: boostCounts.silver.max },
      golden: { used: goldenUsed, max: boostCounts.golden.max }
    };
  };

  const effectiveBoostCounts = getEffectiveBoostCounts();

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
  }, [open, props]);

  // Fetch boost counts when dialog opens for game guesses
  useEffect(() => {
    const fetchBoostCounts = async () => {
      if (open && props.isGameGuess && props.tournamentId) {
        try {
          const counts = await getBoostCountsAction(props.tournamentId);
          setBoostCounts(counts);
        } catch (error) {
          console.error('Error fetching boost counts:', error);
        }
      }
    };
    fetchBoostCounts();
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

        {/* Scores */}
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

        {/* Penalty information for playoff games */}
        {isPlayoffGame && isPenaltyShootout && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              {props.isGameGuess ? 'Ganador de la tanda de penales' : 'Penalty Shootout Scores'}
            </Typography>

            {props.isGameGuess ? (
              // Penalty winner checkboxes for game guesses
              (<Box>
                <Grid container spacing={2}>
                  <Grid size={6}>
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

                  <Grid size={6}>
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
              </Box>)
            ) : (
              // Penalty score inputs for game results
              (<Grid container spacing={2} alignItems="center">
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
              </Grid>)
            )}
          </Box>
        )}

        {/* Boost Selection (only for game guesses) */}
        {props.isGameGuess && props.tournamentId && effectiveBoostCounts && (effectiveBoostCounts.silver.max > 0 || effectiveBoostCounts.golden.max > 0) && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2">
                Apply Boost
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {effectiveBoostCounts.silver.max > 0 && (
                  <Chip
                    icon={<StarIcon sx={{ fontSize: 14 }} />}
                    label={`${effectiveBoostCounts.silver.max - effectiveBoostCounts.silver.used}/${effectiveBoostCounts.silver.max}`}
                    size="small"
                    sx={{
                      height: '22px',
                      color: '#C0C0C0',
                      borderColor: '#C0C0C0',
                      '& .MuiChip-icon': { color: '#C0C0C0' }
                    }}
                  />
                )}
                {effectiveBoostCounts.golden.max > 0 && (
                  <Chip
                    icon={<TrophyIcon sx={{ fontSize: 14 }} />}
                    label={`${effectiveBoostCounts.golden.max - effectiveBoostCounts.golden.used}/${effectiveBoostCounts.golden.max}`}
                    size="small"
                    sx={{
                      height: '22px',
                      color: '#FFD700',
                      borderColor: '#FFD700',
                      '& .MuiChip-icon': { color: '#FFD700' }
                    }}
                  />
                )}
              </Box>
            </Box>
            <ToggleButtonGroup
              value={boostType || ''}
              exclusive
              onChange={(_, newValue) => setBoostType(newValue === '' ? null : newValue as 'silver' | 'golden')}
              fullWidth
              disabled={loading}
              size="small"
            >
              <ToggleButton value="">
                None
              </ToggleButton>
              {effectiveBoostCounts.silver.max > 0 && (
                <ToggleButton
                  value="silver"
                  disabled={boostType !== 'silver' && effectiveBoostCounts.silver.used >= effectiveBoostCounts.silver.max}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(192, 192, 192, 0.2)',
                      color: '#C0C0C0',
                      '&:hover': {
                        backgroundColor: 'rgba(192, 192, 192, 0.3)',
                      }
                    }
                  }}
                >
                  <StarIcon sx={{ mr: 0.5, fontSize: 16 }} />
                  2x
                </ToggleButton>
              )}
              {effectiveBoostCounts.golden.max > 0 && (
                <ToggleButton
                  value="golden"
                  disabled={boostType !== 'golden' && effectiveBoostCounts.golden.used >= effectiveBoostCounts.golden.max}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255, 215, 0, 0.2)',
                      color: '#FFD700',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 215, 0, 0.3)',
                      }
                    }
                  }}
                >
                  <TrophyIcon sx={{ mr: 0.5, fontSize: 16 }} />
                  3x
                </ToggleButton>
              )}
            </ToggleButtonGroup>
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
