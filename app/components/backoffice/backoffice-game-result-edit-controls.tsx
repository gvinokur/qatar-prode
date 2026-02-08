'use client'

import React from 'react';
import {
  Box,
  TextField,
  Typography,
  Grid,
  Button,
  CircularProgress
} from '@mui/material';

interface BackofficeGameResultEditControlsProps {
  // Game info
  readonly homeTeamName: string;
  readonly awayTeamName: string;
  readonly isPlayoffGame: boolean;

  // Values
  readonly homeScore?: number;
  readonly awayScore?: number;
  readonly homePenaltyScore?: number;
  readonly awayPenaltyScore?: number;

  // Callbacks
  readonly onHomeScoreChange: (_value?: number) => void;
  readonly onAwayScoreChange: (_value?: number) => void;
  readonly onHomePenaltyScoreChange: (_value?: number) => void;
  readonly onAwayPenaltyScoreChange: (_value?: number) => void;

  // State
  readonly loading?: boolean;
  readonly error?: string | null;

  // Actions
  readonly onSave?: () => Promise<void>;
  readonly onCancel?: () => void;

  // Refs for focus management
  readonly homeScoreInputRef?: React.RefObject<HTMLInputElement | null>;
  readonly awayScoreInputRef?: React.RefObject<HTMLInputElement | null>;
}

export default function BackofficeGameResultEditControls({
  homeTeamName,
  awayTeamName,
  isPlayoffGame,
  homeScore,
  awayScore,
  homePenaltyScore,
  awayPenaltyScore,
  onHomeScoreChange,
  onAwayScoreChange,
  onHomePenaltyScoreChange,
  onAwayPenaltyScoreChange,
  loading = false,
  error = null,
  onSave,
  onCancel,
  homeScoreInputRef,
  awayScoreInputRef
}: BackofficeGameResultEditControlsProps) {

  // Check if penalty shootout is needed (playoff game with tied scores)
  const isPenaltyShootout = homeScore !== undefined &&
                           awayScore !== undefined &&
                           homeScore === awayScore &&
                           isPlayoffGame;

  const handleHomeScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onHomeScoreChange(value === '' ? undefined : Number.parseInt(value, 10));
  };

  const handleAwayScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onAwayScoreChange(value === '' ? undefined : Number.parseInt(value, 10));
  };

  const handleHomePenaltyScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onHomePenaltyScoreChange(value === '' ? undefined : Number.parseInt(value, 10));
  };

  const handleAwayPenaltyScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onAwayPenaltyScoreChange(value === '' ? undefined : Number.parseInt(value, 10));
  };

  return (
    <Box>
      {/* Error alert */}
      {error && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'error.lighter', borderRadius: 1 }}>
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        </Box>
      )}

      {/* Home team score - horizontal layout */}
      <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Grid size={7}>
          <Typography variant="body1" fontWeight="medium">
            {homeTeamName}
          </Typography>
        </Grid>
        <Grid size={5}>
          <TextField
            inputRef={homeScoreInputRef}
            type="number"
            value={homeScore ?? ''}
            onChange={handleHomeScoreChange}
            slotProps={{
              htmlInput: {
                min: 0,
                style: { textAlign: 'center' },
                'aria-label': `${homeTeamName} score`
              }
            }}
            disabled={loading}
            size="small"
            fullWidth
          />
        </Grid>
      </Grid>

      {/* Away team score - horizontal layout */}
      <Grid container spacing={1} alignItems="center" sx={{ mb: isPenaltyShootout ? 2 : 0 }}>
        <Grid size={7}>
          <Typography variant="body1" fontWeight="medium">
            {awayTeamName}
          </Typography>
        </Grid>
        <Grid size={5}>
          <TextField
            inputRef={awayScoreInputRef}
            type="number"
            value={awayScore ?? ''}
            onChange={handleAwayScoreChange}
            slotProps={{
              htmlInput: {
                min: 0,
                style: { textAlign: 'center' },
                'aria-label': `${awayTeamName} score`
              }
            }}
            disabled={loading}
            size="small"
            fullWidth
          />
        </Grid>
      </Grid>

      {/* Penalty shootout scores (only for playoff games with tied scores) */}
      {isPenaltyShootout && (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom sx={{ mb: 1.5 }}>
            Penalty Shootout Scores
          </Typography>

          {/* Home penalty score */}
          <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Grid size={7}>
              <Typography variant="body2">
                {homeTeamName} (Penalty)
              </Typography>
            </Grid>
            <Grid size={5}>
              <TextField
                type="number"
                value={homePenaltyScore ?? ''}
                onChange={handleHomePenaltyScoreChange}
                slotProps={{
                  htmlInput: {
                    min: 0,
                    max: 10,
                    style: { textAlign: 'center' },
                    'aria-label': `${homeTeamName} penalty score`
                  }
                }}
                disabled={loading}
                size="small"
                fullWidth
              />
            </Grid>
          </Grid>

          {/* Away penalty score */}
          <Grid container spacing={1} alignItems="center">
            <Grid size={7}>
              <Typography variant="body2">
                {awayTeamName} (Penalty)
              </Typography>
            </Grid>
            <Grid size={5}>
              <TextField
                type="number"
                value={awayPenaltyScore ?? ''}
                onChange={handleAwayPenaltyScoreChange}
                slotProps={{
                  htmlInput: {
                    min: 0,
                    max: 10,
                    style: { textAlign: 'center' },
                    'aria-label': `${awayTeamName} penalty score`
                  }
                }}
                disabled={loading}
                size="small"
                fullWidth
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: 'flex-end' }}>
        <Button
          onClick={onCancel}
          disabled={loading}
          size="small"
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={loading}
          size="small"
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          Guardar
        </Button>
      </Box>
    </Box>
  );
}
