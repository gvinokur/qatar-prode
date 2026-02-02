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

// Type aliases for union types (SonarQube S4323)
type BoostType = 'silver' | 'golden' | null;
type FieldType = 'home' | 'away' | 'homePenalty' | 'awayPenalty' | 'boost' | 'save' | 'cancel';

interface GamePredictionEditControlsProps {
  // Game info (readonly per SonarQube)
  readonly gameId: string;
  readonly homeTeamName: string;
  readonly awayTeamName: string;
  readonly homeTeamShortName?: string;
  readonly awayTeamShortName?: string;
  readonly isPlayoffGame: boolean;
  readonly tournamentId?: string;

  // Values (readonly per SonarQube)
  readonly homeScore?: number;
  readonly awayScore?: number;
  readonly homePenaltyWinner?: boolean;
  readonly awayPenaltyWinner?: boolean;
  readonly boostType?: BoostType;
  readonly initialBoostType?: BoostType;

  // Boost counts (readonly, passed from parent to avoid stale data)
  readonly silverUsed: number;
  readonly silverMax: number;
  readonly goldenUsed: number;
  readonly goldenMax: number;

  // Callbacks
  readonly onHomeScoreChange: (_value?: number) => void;
  readonly onAwayScoreChange: (_value?: number) => void;
  readonly onHomePenaltyWinnerChange: (_checked: boolean) => void;
  readonly onAwayPenaltyWinnerChange: (_checked: boolean) => void;
  readonly onBoostTypeChange: (_type: BoostType) => void;

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
  homeTeamShortName,
  awayTeamShortName,
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

  // Helper: Handle arrow key navigation for boost selector (SonarQube S3776)
  const handleArrowKeyNavigation = (e: React.KeyboardEvent) => {
    e.preventDefault();
    const buttons = boostButtonGroupRef?.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
    if (!buttons || buttons.length === 0) return;

    const buttonsArray = Array.from(buttons);
    const currentIndex = buttonsArray.indexOf(document.activeElement as HTMLButtonElement);
    const lastIndex = buttons.length - 1;

    // Calculate next index (S3358 - extract nested ternary)
    let nextIndex: number;
    if (e.key === 'ArrowLeft') {
      nextIndex = currentIndex <= 0 ? lastIndex : currentIndex - 1;
    } else {
      nextIndex = currentIndex >= lastIndex ? 0 : currentIndex + 1;
    }

    buttons[nextIndex].focus();
    buttons[nextIndex].click();
  };

  // Helper: Focus previous field from boost (SonarQube S3776)
  const focusPreviousFromBoost = () => {
    if (isPenaltyShootout && awayPenaltyCheckboxRef?.current) {
      awayPenaltyCheckboxRef.current.focus();
    } else if (awayScoreInputRef?.current) {
      awayScoreInputRef.current.focus();
    }
  };

  // Helper: Handle Shift+Tab navigation (backward) (SonarQube S3776)
  const handleShiftTab = (e: React.KeyboardEvent, field: FieldType) => {
    e.preventDefault();

    switch (field) {
      case 'home':
        if (onShiftTabFromFirstField) onShiftTabFromFirstField();
        break;
      case 'away':
        homeScoreInputRef?.current?.focus();
        break;
      case 'homePenalty':
        awayScoreInputRef?.current?.focus();
        break;
      case 'awayPenalty':
        homePenaltyCheckboxRef?.current?.focus();
        break;
      case 'boost':
        focusPreviousFromBoost();
        break;
      case 'save':
        focusBoostButtonGroup();
        break;
      case 'cancel':
        saveButtonRef?.current?.focus();
        break;
    }
  };

  // Helper: Focus next field from away (SonarQube S3776)
  const focusNextFromAway = () => {
    if (isPenaltyShootout && homePenaltyCheckboxRef?.current) {
      homePenaltyCheckboxRef.current.focus();
    } else {
      focusBoostButtonGroup();
    }
  };

  // Helper: Handle Tab navigation (forward) (SonarQube S3776, S1871)
  const handleForwardTab = (e: React.KeyboardEvent, field: FieldType) => {
    e.preventDefault();

    switch (field) {
      case 'home':
        awayScoreInputRef?.current?.focus();
        break;
      case 'away':
        focusNextFromAway();
        break;
      case 'homePenalty':
        awayPenaltyCheckboxRef?.current?.focus();
        break;
      case 'awayPenalty':
        focusBoostButtonGroup();
        break;
      case 'boost':
      case 'cancel': // S1871 - same action for both
        saveButtonRef?.current?.focus();
        break;
      case 'save':
        if (onSaveAndAdvance) onSaveAndAdvance();
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: FieldType) => {
    // Enter key ALWAYS saves
    if (e.key === 'Enter' && onSave) {
      e.preventDefault();
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
      handleArrowKeyNavigation(e);
      return;
    }

    // Tab key navigation
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        handleShiftTab(e, field);
      } else {
        handleForwardTab(e, field);
      }
    }
  };

  // Helper: Handle save action (SonarQube S6660 - avoid duplicate save logic)
  const performSave = () => {
    if (onSave) {
      onSave();
    } else if (onSaveAndAdvance) {
      onSaveAndAdvance();
    } else if (onEscapePressed) {
      onEscapePressed();
    }
  };

  // Helper: Navigate from away field (SonarQube S3776)
  const navigateFromAway = (hasBoostSection: boolean) => {
    if (isPenaltyShootout && homePenaltyCheckboxRef?.current) {
      homePenaltyCheckboxRef.current.focus();
      setCurrentField('homePenalty');
    } else if (hasBoostSection && boostButtonGroupRef?.current) {
      focusBoostButtonGroup();
      setCurrentField('boost');
    } else {
      performSave();
    }
  };

  // Helper: Navigate from penalty field (SonarQube S3776)
  const navigateFromPenalty = (hasBoostSection: boolean) => {
    if (hasBoostSection && boostButtonGroupRef?.current) {
      focusBoostButtonGroup();
      setCurrentField('boost');
    } else {
      performSave();
    }
  };

  // Helper: Handle mobile next button click (SonarQube S3776)
  const handleMobileNextClick = () => {
    const hasBoostSection = tournamentId && (silverMax > 0 || goldenMax > 0);

    switch (currentField) {
      case 'home':
        awayScoreInputRef?.current?.focus();
        setCurrentField('away');
        break;
      case 'away':
        navigateFromAway(hasBoostSection);
        break;
      case 'homePenalty':
        awayPenaltyCheckboxRef?.current?.focus();
        setCurrentField('awayPenalty');
        break;
      case 'awayPenalty':
        navigateFromPenalty(hasBoostSection);
        break;
      default:
        performSave();
        break;
    }
  };

  // Helper: Get mobile button label (SonarQube S3358 - extract nested ternary)
  const getMobileButtonLabel = () => {
    if (currentField === 'boost') return 'Guardar';
    const hasBoostSection = tournamentId && (silverMax > 0 || goldenMax > 0);
    const isLastFieldBeforeSave = (currentField === 'away' || currentField === 'awayPenalty') && !hasBoostSection;
    return isLastFieldBeforeSave ? 'Guardar' : 'Siguiente';
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
                  Reintentar
                </Typography>
              </Box>
            ) : undefined
          }
        >
          {error}
        </Alert>
      )}


      {/* Scores */}
      <Box sx={{ mb: compact ? 1.5 : 3 }}>
        {layout === 'horizontal' ? (
          // Horizontal layout: each team on its own row
          <Box>
            {/* Home team row */}
            <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Grid size={7}>
                <Typography variant={compact ? 'body2' : 'body1'} fontWeight="medium">
                  {homeTeamName}
                </Typography>
              </Grid>
              <Grid size={5}>
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
            </Grid>

            {/* Away team row */}
            <Grid container spacing={1} alignItems="center">
              <Grid size={7}>
                <Typography variant={compact ? 'body2' : 'body1'} fontWeight="medium">
                  {awayTeamName}
                </Typography>
              </Grid>
              <Grid size={5}>
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

            {/* Penalty shootout selector - single line below scores */}
            {compact && isPenaltyShootout && (
              <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                  Ganador Penales
                </Typography>
                <Typography variant="caption" sx={{ flexShrink: 0 }}>
                  -
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" fontWeight="medium">
                    {homeTeamShortName || homeTeamName.substring(0, 3).toUpperCase()}
                  </Typography>
                  <Checkbox
                    checked={homePenaltyWinner}
                    onChange={handleHomePenaltyWinnerChange}
                    onKeyDown={(e) => handleKeyDown(e, 'homePenalty')}
                    onFocus={() => setCurrentField('homePenalty')}
                    disabled={loading}
                    size="small"
                    sx={{ p: 0.5 }}
                    slotProps={{
                      input: {
                        ref: homePenaltyCheckboxRef,
                        'aria-label': `${homeTeamName} penalty winner`
                      }
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" fontWeight="medium">
                    {awayTeamShortName || awayTeamName.substring(0, 3).toUpperCase()}
                  </Typography>
                  <Checkbox
                    checked={awayPenaltyWinner}
                    onChange={handleAwayPenaltyWinnerChange}
                    onKeyDown={(e) => handleKeyDown(e, 'awayPenalty')}
                    onFocus={() => setCurrentField('awayPenalty')}
                    disabled={loading}
                    size="small"
                    sx={{ p: 0.5 }}
                    slotProps={{
                      input: {
                        ref: awayPenaltyCheckboxRef,
                        'aria-label': `${awayTeamName} penalty winner`
                      }
                    }}
                  />
                </Box>
              </Box>
            )}
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
                    slotProps={{
                      input: {
                        'aria-label': `${homeTeamName} penalty winner`
                      }
                    }}
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
                    slotProps={{
                      input: {
                        'aria-label': `${awayTeamName} penalty winner`
                      }
                    }}
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
                  Ninguno
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
                  Aplicar Boost
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
                  Ninguno
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
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleMobileNextClick}
            disabled={loading}
            sx={{ minHeight: '44px' }}
            fullWidth
          >
            {getMobileButtonLabel()}
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
            Cancelar
          </Button>
          <Button
            ref={saveButtonRef}
            variant="contained"
            onClick={onSave}
            onKeyDown={(e) => handleKeyDown(e, 'save')}
            onFocus={() => setCurrentField('save')}
            disabled={loading}
            size={compact ? 'small' : 'medium'}
            fullWidth
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
