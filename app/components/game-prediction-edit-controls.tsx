'use client'

import React, { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Grid,
  FormControlLabel,
  Checkbox,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  Alert,
  CircularProgress,
  Button,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon
} from '@mui/icons-material';

interface GamePredictionEditControlsProps {
  // Game info (readonly per SonarQube)
  readonly gameId: string;
  readonly homeTeamName: string;
  readonly awayTeamName: string;
  readonly isPlayoffGame: boolean;
  readonly tournamentId?: string;

  // Values (readonly per SonarQube)
  readonly homeScore?: number;
  readonly awayScore?: number;
  readonly homePenaltyWinner?: boolean;
  readonly awayPenaltyWinner?: boolean;
  readonly boostType?: 'silver' | 'golden' | null;
  readonly initialBoostType?: 'silver' | 'golden' | null;

  // Boost counts (readonly, passed from parent to avoid stale data)
  readonly silverUsed: number;
  readonly silverMax: number;
  readonly goldenUsed: number;
  readonly goldenMax: number;

  // Callbacks
  readonly onHomeScoreChange: (value?: number) => void;
  readonly onAwayScoreChange: (value?: number) => void;
  readonly onHomePenaltyWinnerChange: (checked: boolean) => void;
  readonly onAwayPenaltyWinnerChange: (checked: boolean) => void;
  readonly onBoostTypeChange: (type: 'silver' | 'golden' | null) => void;

  // State (readonly per SonarQube)
  readonly loading?: boolean;
  readonly error?: string | null;

  // Layout (readonly per SonarQube)
  readonly layout?: 'vertical' | 'horizontal';
  readonly compact?: boolean;

  // Refs for keyboard navigation (readonly per SonarQube)
  readonly homeScoreInputRef?: React.RefObject<HTMLInputElement>;
  readonly awayScoreInputRef?: React.RefObject<HTMLInputElement>;
  readonly boostButtonGroupRef?: React.RefObject<HTMLDivElement>;

  // Keyboard callbacks (readonly per SonarQube)
  readonly onTabFromLastField?: () => void; // Auto-advance to next card
  readonly onEscapePressed?: () => void; // Exit edit mode

  // Retry callback for network errors
  readonly retryCallback?: () => void;
}

export default function GamePredictionEditControls({
  gameId,
  homeTeamName,
  awayTeamName,
  isPlayoffGame,
  tournamentId,
  homeScore,
  awayScore,
  homePenaltyWinner = false,
  awayPenaltyWinner = false,
  boostType = null,
  initialBoostType = null,
  silverUsed,
  silverMax,
  goldenUsed,
  goldenMax,
  onHomeScoreChange,
  onAwayScoreChange,
  onHomePenaltyWinnerChange,
  onAwayPenaltyWinnerChange,
  onBoostTypeChange,
  loading = false,
  error = null,
  layout = 'vertical',
  compact = false,
  homeScoreInputRef,
  awayScoreInputRef,
  boostButtonGroupRef,
  onTabFromLastField,
  onEscapePressed,
  retryCallback
}: GamePredictionEditControlsProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentField, setCurrentField] = useState<'home' | 'away' | 'boost'>('home');

  // Calculate effective boost counts (account for switching types)
  const getEffectiveBoostCounts = () => {
    let effectiveSilverUsed = silverUsed;
    let effectiveGoldenUsed = goldenUsed;

    // If initial boost was set, free it up first
    if (initialBoostType === 'silver') effectiveSilverUsed--;
    if (initialBoostType === 'golden') effectiveGoldenUsed--;

    // Then apply current selection
    if (boostType === 'silver') effectiveSilverUsed++;
    if (boostType === 'golden') effectiveGoldenUsed++;

    return {
      silver: { used: effectiveSilverUsed, max: silverMax },
      golden: { used: effectiveGoldenUsed, max: goldenMax }
    };
  };

  const effectiveBoostCounts = getEffectiveBoostCounts();

  // Check if scores are tied (for playoff penalty shootout)
  const isPenaltyShootout = homeScore !== undefined && awayScore !== undefined && homeScore === awayScore && isPlayoffGame;

  // Validate playoff penalty selection
  const hasValidationError = isPenaltyShootout && !homePenaltyWinner && !awayPenaltyWinner;
  const validationErrorMessage = hasValidationError
    ? 'Please select a penalty shootout winner for tied playoff games'
    : null;

  // Handle score changes
  const handleHomeScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : Number(e.target.value);
    onHomeScoreChange(value);

    // If scores are no longer equal, reset penalty winners
    if (value !== awayScore) {
      onHomePenaltyWinnerChange(false);
      onAwayPenaltyWinnerChange(false);
    }
  };

  const handleAwayScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : Number(e.target.value);
    onAwayScoreChange(value);

    // If scores are no longer equal, reset penalty winners
    if (homeScore !== value) {
      onHomePenaltyWinnerChange(false);
      onAwayPenaltyWinnerChange(false);
    }
  };

  // Handle penalty winner changes (mutual exclusion)
  const handleHomePenaltyWinnerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    onHomePenaltyWinnerChange(checked);
    if (checked) {
      onAwayPenaltyWinnerChange(false);
    }
  };

  const handleAwayPenaltyWinnerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    onAwayPenaltyWinnerChange(checked);
    if (checked) {
      onHomePenaltyWinnerChange(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, field: 'home' | 'away' | 'boost') => {
    if (e.key === 'Escape' && onEscapePressed) {
      onEscapePressed();
      e.preventDefault();
    } else if (e.key === 'Tab' && !e.shiftKey) {
      // Forward tab navigation
      if (field === 'home' && awayScoreInputRef?.current) {
        e.preventDefault();
        awayScoreInputRef.current.focus();
      } else if (field === 'away' && boostButtonGroupRef?.current) {
        e.preventDefault();
        boostButtonGroupRef.current.querySelector<HTMLButtonElement>('button')?.focus();
      } else if (field === 'boost' && onTabFromLastField) {
        e.preventDefault();
        onTabFromLastField();
      }
    }
  };

  // Auto-focus home input when component mounts (for inline editing)
  useEffect(() => {
    if (homeScoreInputRef?.current && layout === 'horizontal') {
      homeScoreInputRef.current.focus();
    }
  }, [homeScoreInputRef, layout]);

  return (
    <Box>
      {/* Error display */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            retryCallback ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {loading && <CircularProgress size={16} />}
                <Typography
                  variant="button"
                  sx={{ cursor: 'pointer', color: 'inherit' }}
                  onClick={retryCallback}
                >
                  Retry
                </Typography>
              </Box>
            ) : undefined
          }
        >
          {error}
        </Alert>
      )}

      {/* Validation error display */}
      {validationErrorMessage && !error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {validationErrorMessage}
        </Alert>
      )}

      {/* Scores */}
      <Box sx={{ mb: compact ? 2 : 3 }}>
        <Grid container spacing={layout === 'horizontal' ? 1 : 2} alignItems="center">
          <Grid size={layout === 'horizontal' ? 5 : 8}>
            <Typography variant={compact ? 'body2' : 'body1'} fontWeight="medium">
              {homeTeamName}
            </Typography>
          </Grid>

          <Grid size={layout === 'horizontal' ? 3 : 4}>
            <TextField
              inputRef={homeScoreInputRef}
              type="number"
              value={homeScore ?? ''}
              onChange={handleHomeScoreChange}
              onKeyDown={(e) => handleKeyDown(e, 'home')}
              onFocus={() => setCurrentField('home')}
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

          <Grid size={layout === 'horizontal' ? 1 : 12} sx={{ textAlign: 'center' }}>
            {layout === 'horizontal' && (
              <Typography variant="body2" color="text.secondary">vs</Typography>
            )}
          </Grid>

          <Grid size={layout === 'horizontal' ? 5 : 8}>
            <Typography variant={compact ? 'body2' : 'body1'} fontWeight="medium">
              {awayTeamName}
            </Typography>
          </Grid>

          <Grid size={layout === 'horizontal' ? 3 : 4}>
            <TextField
              inputRef={awayScoreInputRef}
              type="number"
              value={awayScore ?? ''}
              onChange={handleAwayScoreChange}
              onKeyDown={(e) => handleKeyDown(e, 'away')}
              onFocus={() => setCurrentField('away')}
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
      </Box>

      {/* Penalty information for playoff games */}
      {isPenaltyShootout && (
        <Box sx={{ mt: compact ? 2 : 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Ganador de la tanda de penales
          </Typography>

          <Grid container spacing={2}>
            <Grid size={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={homePenaltyWinner}
                    onChange={handleHomePenaltyWinnerChange}
                    disabled={loading}
                    inputProps={{ 'aria-label': `${homeTeamName} penalty winner` }}
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
                    inputProps={{ 'aria-label': `${awayTeamName} penalty winner` }}
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
      )}

      {/* Boost Selection */}
      {tournamentId && (silverMax > 0 || goldenMax > 0) && (
        <Box sx={{ mt: compact ? 2 : 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2">
              Apply Boost
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {silverMax > 0 && (
                <Chip
                  icon={<StarIcon sx={{ fontSize: 14 }} />}
                  label={`${effectiveBoostCounts.silver.max - effectiveBoostCounts.silver.used}/${effectiveBoostCounts.silver.max}`}
                  size="small"
                  sx={{
                    height: '22px',
                    color: theme.palette.accent.silver.main,
                    borderColor: theme.palette.accent.silver.main,
                    '& .MuiChip-icon': { color: theme.palette.accent.silver.main }
                  }}
                />
              )}
              {goldenMax > 0 && (
                <Chip
                  icon={<TrophyIcon sx={{ fontSize: 14 }} />}
                  label={`${effectiveBoostCounts.golden.max - effectiveBoostCounts.golden.used}/${effectiveBoostCounts.golden.max}`}
                  size="small"
                  sx={{
                    height: '22px',
                    color: theme.palette.accent.gold.main,
                    borderColor: theme.palette.accent.gold.main,
                    '& .MuiChip-icon': { color: theme.palette.accent.gold.main }
                  }}
                />
              )}
            </Box>
          </Box>
          <ToggleButtonGroup
            ref={boostButtonGroupRef}
            value={boostType || ''}
            exclusive
            onChange={(_, newValue) => onBoostTypeChange(newValue === '' ? null : newValue as 'silver' | 'golden')}
            onKeyDown={(e) => handleKeyDown(e, 'boost')}
            onFocus={() => setCurrentField('boost')}
            fullWidth
            disabled={loading}
            size="small"
            aria-label="Boost selection"
          >
            <ToggleButton value="" aria-label="No boost">
              None
            </ToggleButton>
            {silverMax > 0 && (
              <ToggleButton
                value="silver"
                disabled={boostType !== 'silver' && effectiveBoostCounts.silver.used >= effectiveBoostCounts.silver.max}
                aria-label="Silver boost (2x)"
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.accent.silver.main, 0.2),
                    color: theme.palette.accent.silver.main,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.accent.silver.main, 0.3),
                    }
                  }
                }}
              >
                <StarIcon sx={{ mr: 0.5, fontSize: 16 }} />
                2x
              </ToggleButton>
            )}
            {goldenMax > 0 && (
              <ToggleButton
                value="golden"
                disabled={boostType !== 'golden' && effectiveBoostCounts.golden.used >= effectiveBoostCounts.golden.max}
                aria-label="Golden boost (3x)"
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.accent.gold.main, 0.2),
                    color: theme.palette.accent.gold.main,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.accent.gold.main, 0.3),
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

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Mobile-specific controls */}
      {isMobile && layout === 'horizontal' && (
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              if (onEscapePressed) {
                onEscapePressed();
              }
            }}
            disabled={loading}
            sx={{ minHeight: '44px' }}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              // Navigate through fields: home → away → boost → done
              if (currentField === 'home') {
                awayScoreInputRef?.current?.focus();
                setCurrentField('away');
              } else if (currentField === 'away') {
                boostButtonGroupRef?.current?.querySelector<HTMLButtonElement>('button')?.focus();
                setCurrentField('boost');
              } else {
                // Last field - advance to next card or close
                if (onTabFromLastField) {
                  onTabFromLastField();
                } else if (onEscapePressed) {
                  onEscapePressed();
                }
              }
            }}
            disabled={loading}
            sx={{ minHeight: '44px' }}
            fullWidth
          >
            {currentField === 'boost' ? 'Done' : 'Next'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
