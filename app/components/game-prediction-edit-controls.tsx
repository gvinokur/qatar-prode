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
  alpha,
  Tooltip
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
  readonly homeScoreInputRef?: React.RefObject<HTMLInputElement | null>;
  readonly awayScoreInputRef?: React.RefObject<HTMLInputElement | null>;
  readonly homePenaltyCheckboxRef?: React.RefObject<HTMLInputElement | null>;
  readonly awayPenaltyCheckboxRef?: React.RefObject<HTMLInputElement | null>;
  readonly boostButtonGroupRef?: React.RefObject<HTMLDivElement | null>;
  readonly editButtonRef?: React.RefObject<HTMLButtonElement | null>; // For focus restoration after save

  // Keyboard callbacks (readonly per SonarQube)
  readonly onSaveAndAdvance?: () => Promise<void>; // Save current card and advance to next
  readonly onShiftTabFromFirstField?: () => void; // Go to previous card (no save)
  readonly onEscapePressed?: () => void; // Exit edit mode

  // Save/Cancel callbacks
  readonly onSave?: () => Promise<void>;
  readonly onCancel?: () => void;

  // Retry callback for network errors
  readonly retryCallback?: () => void;

  // Refs for Save/Cancel buttons
  readonly saveButtonRef?: React.RefObject<HTMLButtonElement | null>;
  readonly cancelButtonRef?: React.RefObject<HTMLButtonElement | null>;
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
  onSave,
  onCancel,
  homeScoreInputRef,
  awayScoreInputRef,
  homePenaltyCheckboxRef,
  awayPenaltyCheckboxRef,
  boostButtonGroupRef,
  saveButtonRef,
  cancelButtonRef,
  onSaveAndAdvance,
  onShiftTabFromFirstField,
  onEscapePressed,
  retryCallback
}: GamePredictionEditControlsProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentField, setCurrentField] = useState<'home' | 'away' | 'homePenalty' | 'awayPenalty' | 'boost' | 'save'>('home');
  const [attemptedSave, setAttemptedSave] = useState(false);

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

  // Validate playoff penalty selection (only show after attempted save)
  const hasValidationError = isPenaltyShootout && !homePenaltyWinner && !awayPenaltyWinner;
  const validationErrorMessage = attemptedSave && hasValidationError
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

    // Reset attempted save flag when scores change
    setAttemptedSave(false);
  };

  const handleAwayScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : Number(e.target.value);
    onAwayScoreChange(value);

    // If scores are no longer equal, reset penalty winners
    if (homeScore !== value) {
      onHomePenaltyWinnerChange(false);
      onAwayPenaltyWinnerChange(false);
    }

    // Reset attempted save flag when scores change
    setAttemptedSave(false);
  };

  // Handle penalty winner changes (mutual exclusion)
  const handleHomePenaltyWinnerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    onHomePenaltyWinnerChange(checked);
    if (checked) {
      onAwayPenaltyWinnerChange(false);
      // Clear validation error when a winner is selected
      setAttemptedSave(false);
    }
  };

  const handleAwayPenaltyWinnerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    onAwayPenaltyWinnerChange(checked);
    if (checked) {
      onHomePenaltyWinnerChange(false);
      // Clear validation error when a winner is selected
      setAttemptedSave(false);
    }
  };

  // Handle keyboard navigation
  // Helper function to focus on the selected boost button, or first if none selected
  const focusBoostButtonGroup = () => {
    if (!boostButtonGroupRef?.current) return;

    // Try to find the selected button first
    const selectedButton = boostButtonGroupRef.current.querySelector<HTMLButtonElement>('button.Mui-selected');
    if (selectedButton) {
      selectedButton.focus();
    } else {
      // No selection, focus first button
      boostButtonGroupRef.current.querySelector<HTMLButtonElement>('button')?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: 'home' | 'away' | 'homePenalty' | 'awayPenalty' | 'boost' | 'save' | 'cancel') => {
    // Enter key ALWAYS saves
    if (e.key === 'Enter' && onSave) {
      e.preventDefault();
      setAttemptedSave(true);
      onSave();
      return;
    }

    // Escape key cancels/exits
    if (e.key === 'Escape' && onEscapePressed) {
      e.preventDefault();
      onEscapePressed();
      return;
    }

    // Arrow key navigation for boost selection
    if (field === 'boost' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      const buttons = boostButtonGroupRef?.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
      if (!buttons || buttons.length === 0) return;

      const currentIndex = Array.from(buttons).findIndex(btn => btn === document.activeElement);
      let nextIndex: number;

      if (e.key === 'ArrowLeft') {
        nextIndex = currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1;
      } else {
        nextIndex = currentIndex >= buttons.length - 1 ? 0 : currentIndex + 1;
      }

      buttons[nextIndex].focus();
      buttons[nextIndex].click(); // Select the boost option
      return;
    }

    // Tab key navigation
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift+Tab: Backward navigation
        if (field === 'home' && onShiftTabFromFirstField) {
          // First field - go to previous card (no save)
          e.preventDefault();
          onShiftTabFromFirstField();
        } else if (field === 'away' && homeScoreInputRef?.current) {
          e.preventDefault();
          homeScoreInputRef.current.focus();
        } else if (field === 'homePenalty' && awayScoreInputRef?.current) {
          // Penalty shootout: homePenalty → away
          e.preventDefault();
          awayScoreInputRef.current.focus();
        } else if (field === 'awayPenalty' && homePenaltyCheckboxRef?.current) {
          // Penalty shootout: awayPenalty → homePenalty
          e.preventDefault();
          homePenaltyCheckboxRef.current.focus();
        } else if (field === 'boost') {
          e.preventDefault();
          // boost → awayPenalty (if penalty shootout) OR away
          if (isPenaltyShootout && awayPenaltyCheckboxRef?.current) {
            awayPenaltyCheckboxRef.current.focus();
          } else if (awayScoreInputRef?.current) {
            awayScoreInputRef.current.focus();
          }
        } else if (field === 'save') {
          e.preventDefault();
          focusBoostButtonGroup();
        } else if (field === 'cancel' && saveButtonRef?.current) {
          e.preventDefault();
          saveButtonRef.current.focus();
        }
      } else {
        // Forward Tab: home → away → (penalty if needed) → boost → save → advance
        if (field === 'home' && awayScoreInputRef?.current) {
          e.preventDefault();
          awayScoreInputRef.current.focus();
        } else if (field === 'away') {
          e.preventDefault();
          // away → homePenalty (if penalty shootout) OR boost
          if (isPenaltyShootout && homePenaltyCheckboxRef?.current) {
            homePenaltyCheckboxRef.current.focus();
          } else {
            focusBoostButtonGroup();
          }
        } else if (field === 'homePenalty' && awayPenaltyCheckboxRef?.current) {
          // Penalty shootout: homePenalty → awayPenalty
          e.preventDefault();
          awayPenaltyCheckboxRef.current.focus();
        } else if (field === 'awayPenalty') {
          // Penalty shootout: awayPenalty → boost
          e.preventDefault();
          focusBoostButtonGroup();
        } else if (field === 'boost' && saveButtonRef?.current) {
          // Tab from boost → Save button
          e.preventDefault();
          saveButtonRef.current.focus();
        } else if (field === 'save' && onSaveAndAdvance) {
          // Tab from Save button → save and advance to next card
          e.preventDefault();
          onSaveAndAdvance();
        } else if (field === 'cancel' && saveButtonRef?.current) {
          e.preventDefault();
          saveButtonRef.current.focus();
        }
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
        {layout === 'horizontal' ? (
          // Horizontal layout: each team on its own row
          <Box>
            {/* Header row for compact penalty mode */}
            {compact && isPenaltyShootout && (
              <Grid container spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Grid size={7}></Grid>
                <Grid size={3}></Grid>
                <Grid size={2} sx={{ textAlign: 'center' }}>
                  <Tooltip title="Ganador de la tanda de penales" arrow>
                    <Typography variant="caption" color="text.secondary" sx={{ cursor: 'help', fontSize: '0.65rem' }}>
                      Gan. Pen
                    </Typography>
                  </Tooltip>
                </Grid>
              </Grid>
            )}

            {/* Home team row */}
            <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Grid size={compact && isPenaltyShootout ? 5 : 7}>
                <Typography variant={compact ? 'body2' : 'body1'} fontWeight="medium">
                  {homeTeamName}
                </Typography>
              </Grid>
              <Grid size={compact && isPenaltyShootout ? 5 : 5}>
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
              {compact && isPenaltyShootout && (
                <Grid size={2} sx={{ textAlign: 'center' }}>
                  <Checkbox
                    inputRef={homePenaltyCheckboxRef}
                    checked={homePenaltyWinner}
                    onChange={handleHomePenaltyWinnerChange}
                    onKeyDown={(e) => handleKeyDown(e, 'homePenalty')}
                    onFocus={() => setCurrentField('homePenalty')}
                    disabled={loading}
                    size="small"
                    inputProps={{ 'aria-label': `${homeTeamName} penalty winner` }}
                  />
                </Grid>
              )}
            </Grid>

            {/* Away team row */}
            <Grid container spacing={1} alignItems="center">
              <Grid size={compact && isPenaltyShootout ? 5 : 7}>
                <Typography variant={compact ? 'body2' : 'body1'} fontWeight="medium">
                  {awayTeamName}
                </Typography>
              </Grid>
              <Grid size={compact && isPenaltyShootout ? 5 : 5}>
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
              {compact && isPenaltyShootout && (
                <Grid size={2} sx={{ textAlign: 'center' }}>
                  <Checkbox
                    inputRef={awayPenaltyCheckboxRef}
                    checked={awayPenaltyWinner}
                    onChange={handleAwayPenaltyWinnerChange}
                    onKeyDown={(e) => handleKeyDown(e, 'awayPenalty')}
                    onFocus={() => setCurrentField('awayPenalty')}
                    disabled={loading}
                    size="small"
                    inputProps={{ 'aria-label': `${awayTeamName} penalty winner` }}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        ) : (
          // Vertical layout with "vs" separator
          <Grid container spacing={2} alignItems="center">
            <Grid size={8}>
              <Typography variant={compact ? 'body2' : 'body1'} fontWeight="medium">
                {homeTeamName}
              </Typography>
            </Grid>
            <Grid size={4}>
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
            <Grid size={12} sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">vs</Typography>
            </Grid>
            <Grid size={8}>
              <Typography variant={compact ? 'body2' : 'body1'} fontWeight="medium">
                {awayTeamName}
              </Typography>
            </Grid>
            <Grid size={4}>
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
        )}
      </Box>

      {/* Penalty information for playoff games (non-compact mode only) */}
      {isPenaltyShootout && !compact && (
        <Box sx={{ mt: 3 }}>
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
        <Box sx={{ mt: compact ? 1.5 : 3 }}>
          <Divider sx={{ mb: compact ? 1.5 : 2 }} />
          {compact ? (
            // Compact mode: single line with label, counters, and buttons
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" fontWeight="medium" sx={{ flexShrink: 0 }}>
                Boost
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                {silverMax > 0 && (
                  <Chip
                    icon={<StarIcon sx={{ fontSize: 12 }} />}
                    label={`${effectiveBoostCounts.silver.max - effectiveBoostCounts.silver.used}/${effectiveBoostCounts.silver.max}`}
                    size="small"
                    sx={{
                      height: '20px',
                      fontSize: '0.7rem',
                      color: theme.palette.accent.silver.main,
                      borderColor: theme.palette.accent.silver.main,
                      '& .MuiChip-icon': { color: theme.palette.accent.silver.main }
                    }}
                  />
                )}
                {goldenMax > 0 && (
                  <Chip
                    icon={<TrophyIcon sx={{ fontSize: 12 }} />}
                    label={`${effectiveBoostCounts.golden.max - effectiveBoostCounts.golden.used}/${effectiveBoostCounts.golden.max}`}
                    size="small"
                    sx={{
                      height: '20px',
                      fontSize: '0.7rem',
                      color: theme.palette.accent.gold.main,
                      borderColor: theme.palette.accent.gold.main,
                      '& .MuiChip-icon': { color: theme.palette.accent.gold.main }
                    }}
                  />
                )}
              </Box>
              <ToggleButtonGroup
                ref={boostButtonGroupRef}
                value={boostType || ''}
                exclusive
                onChange={(_, newValue) => onBoostTypeChange(newValue === '' ? null : newValue as 'silver' | 'golden')}
                onKeyDown={(e) => handleKeyDown(e, 'boost')}
                onFocus={() => setCurrentField('boost')}
                disabled={loading}
                size="small"
                aria-label="Boost selection"
                sx={{ flexShrink: 0 }}
              >
                <ToggleButton value="" aria-label="No boost" sx={{ py: 0.5, px: 1, fontSize: '0.75rem' }}>
                  None
                </ToggleButton>
                {silverMax > 0 && (
                  <ToggleButton
                    value="silver"
                    disabled={boostType !== 'silver' && effectiveBoostCounts.silver.used >= effectiveBoostCounts.silver.max}
                    aria-label="Silver boost (2x)"
                    sx={{
                      py: 0.5, px: 1, fontSize: '0.75rem',
                      '&.Mui-selected': {
                        backgroundColor: alpha(theme.palette.accent.silver.main, 0.2),
                        color: theme.palette.accent.silver.main,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.accent.silver.main, 0.3),
                        }
                      }
                    }}
                  >
                    2x
                  </ToggleButton>
                )}
                {goldenMax > 0 && (
                  <ToggleButton
                    value="golden"
                    disabled={boostType !== 'golden' && effectiveBoostCounts.golden.used >= effectiveBoostCounts.golden.max}
                    aria-label="Golden boost (3x)"
                    sx={{
                      py: 0.5, px: 1, fontSize: '0.75rem',
                      '&.Mui-selected': {
                        backgroundColor: alpha(theme.palette.accent.gold.main, 0.2),
                        color: theme.palette.accent.gold.main,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.accent.gold.main, 0.3),
                        }
                      }
                    }}
                  >
                    3x
                  </ToggleButton>
                )}
              </ToggleButtonGroup>
            </Box>
          ) : (
            // Non-compact mode: original layout with label/counters on top, buttons below
            <>
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
            </>
          )}
        </Box>
      )}


      {/* Mobile-specific controls */}
      {isMobile && layout === 'horizontal' && (
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              if (onCancel) {
                onCancel();
              } else if (onEscapePressed) {
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
              // Navigate through fields: home → away → (penalty if needed) → boost → done
              if (currentField === 'home') {
                awayScoreInputRef?.current?.focus();
                setCurrentField('away');
              } else if (currentField === 'away') {
                // away → homePenalty (if penalty shootout) OR boost
                if (isPenaltyShootout && homePenaltyCheckboxRef?.current) {
                  homePenaltyCheckboxRef.current.focus();
                  setCurrentField('homePenalty');
                } else {
                  focusBoostButtonGroup();
                  setCurrentField('boost');
                }
              } else if (currentField === 'homePenalty') {
                awayPenaltyCheckboxRef?.current?.focus();
                setCurrentField('awayPenalty');
              } else if (currentField === 'awayPenalty') {
                focusBoostButtonGroup();
                setCurrentField('boost');
              } else {
                // Last field - save
                setAttemptedSave(true);
                if (onSave) {
                  onSave();
                } else if (onSaveAndAdvance) {
                  onSaveAndAdvance();
                } else if (onEscapePressed) {
                  onEscapePressed();
                }
              }
            }}
            disabled={loading}
            sx={{ minHeight: '44px' }}
            fullWidth
          >
            {currentField === 'boost' ? 'Save' : 'Next'}
          </Button>
        </Box>
      )}

      {/* Desktop Save/Cancel buttons */}
      {!isMobile && onSave && onCancel && (
        <Box sx={{ display: 'flex', gap: 1, mt: compact ? 2 : 3 }}>
          <Button
            ref={cancelButtonRef}
            variant="outlined"
            onClick={onCancel}
            onKeyDown={(e) => handleKeyDown(e, 'cancel')}
            onFocus={() => setCurrentField('save')}
            disabled={loading}
            size={compact ? 'small' : 'medium'}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            ref={saveButtonRef}
            variant="contained"
            onClick={() => {
              setAttemptedSave(true);
              onSave?.();
            }}
            onKeyDown={(e) => handleKeyDown(e, 'save')}
            onFocus={() => setCurrentField('save')}
            disabled={loading}
            size={compact ? 'small' : 'medium'}
            fullWidth
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
