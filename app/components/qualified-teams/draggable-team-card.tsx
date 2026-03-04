'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, Typography, Box, Checkbox, FormControlLabel, useTheme, Theme, Chip, Tooltip } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Team } from '../../db/tables-definition';
import { TeamScoringResult } from '../../utils/qualified-teams-scoring';

export interface DraggableTeamCardProps {
  /** Team data */
  readonly team: Team;
  /** Predicted position (1, 2, 3, etc.) */
  readonly position: number;
  /** Whether team is predicted to qualify (for position 3) */
  readonly predictedToQualify: boolean;
  /** Whether tournament is locked (read-only mode) */
  readonly isLocked: boolean;
  /** Whether predictions are currently being saved */
  readonly isSaving: boolean;
  /** Maximum allowed third place qualifiers */
  readonly maxThirdPlace: number;
  /** Current count of third place teams selected */
  readonly currentThirdPlaceCount: number;
  /** Callback when third place qualification is toggled */
  readonly onToggleThirdPlace?: () => void;
  /** Scoring result for this team (if available) */
  readonly result?: TeamScoringResult | null;
  /** Whether the group is complete (results can be shown) */
  readonly isGroupComplete: boolean;
  /** Whether all groups in the tournament are complete */
  readonly allGroupsComplete: boolean;
  /** Whether this team is in pending 3rd place state */
  readonly isPending3rdPlace: boolean;
}

/** Get position suffix (1st, 2nd, 3rd, 4th, etc.) */
function getPositionSuffix(pos: number, t: any): string {
  if (pos === 1) return t('position.first');
  if (pos === 2) return t('position.second');
  if (pos === 3) return t('position.third');
  return t('position.fourth');
}

/** Get background color - now using gray for cleaner design */
function getBackgroundColor(theme: Theme): string {
  // Use consistent gray background for all cards
  return theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50];
}

/** Border color options */
interface BorderColorOptions {
  readonly position: number;
  readonly predictedToQualify: boolean;
  readonly disabled: boolean;
  readonly result?: TeamScoringResult | null;
  readonly isGroupComplete: boolean;
  readonly allGroupsComplete: boolean;
  readonly isPending3rdPlace: boolean;
}

/** Check if team should have no colored border */
function shouldShowNoBorder(options: BorderColorOptions): boolean {
  const { position, disabled, predictedToQualify } = options;
  return position >= 4 || (position === 3 && disabled && !predictedToQualify);
}

/** Get border color for pending states (before results) */
function getPendingBorderColor(theme: Theme, options: BorderColorOptions): string | null {
  const { position, disabled, predictedToQualify, isGroupComplete, allGroupsComplete } = options;

  if (!disabled || !predictedToQualify) {
    return null;
  }

  // Positions 1-2: Pending until their group completes
  if ((position === 1 || position === 2) && !isGroupComplete) {
    return theme.palette.info.main;
  }

  // Position 3: Pending until all groups complete
  if (position === 3 && !allGroupsComplete && !isGroupComplete) {
    return theme.palette.info.main;
  }

  return null;
}

/** Get border color based on result (after results available) */
function getResultBorderColor(theme: Theme, options: BorderColorOptions): string | null {
  const { isGroupComplete, result, predictedToQualify, isPending3rdPlace } = options;

  if (!isGroupComplete || !result || !predictedToQualify) {
    return null;
  }

  if (isPending3rdPlace) {
    return theme.palette.info.main;
  }

  if (result.pointsAwarded > 0) {
    return theme.palette.success.main;
  }

  if (result.pointsAwarded === 0) {
    return theme.palette.error.main;
  }

  return null;
}

/** Get border color for selection mode (before locking) */
function getSelectionBorderColor(theme: Theme, options: BorderColorOptions): string | null {
  const { disabled, predictedToQualify } = options;

  if (disabled) {
    return null;
  }

  if (predictedToQualify) {
    return theme.palette.success.main;
  }

  return null;
}

/** Get border color based on qualification status and result */
function getBorderColor(theme: Theme, options: BorderColorOptions): string {
  // Position 4+ or non-predicted 3rd place: no colored border
  if (shouldShowNoBorder(options)) {
    return 'transparent';
  }

  // Check for pending state BEFORE results
  const pendingColor = getPendingBorderColor(theme, options);
  if (pendingColor) {
    return pendingColor;
  }

  // Check for result-based colors (after results available)
  const resultColor = getResultBorderColor(theme, options);
  if (resultColor) {
    return resultColor;
  }

  // Check for selection mode colors (before locking)
  const selectionColor = getSelectionBorderColor(theme, options);
  if (selectionColor) {
    return selectionColor;
  }

  // Position 3 qualified (locked): green border
  if (options.position === 3 && options.disabled && options.predictedToQualify) {
    return theme.palette.success.main;
  }

  // Default: no border color
  return 'transparent';
}

/** Drag handle component - visual affordance only, pointer events disabled */
function DragHandle({ disabled }: { readonly disabled: boolean }) {
  return (
    <Box
      sx={{
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        opacity: disabled ? 0.38 : 0.54,
      }}
    >
      <DragIndicatorIcon />
    </Box>
  );
}

/** Position badge component */
function PositionBadge({ position, t }: { readonly position: number; readonly t: any }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        minWidth: 40,
        height: 40,
        borderRadius: '50%',
        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[300],
        color: theme.palette.mode === 'dark' ? theme.palette.grey[100] : theme.palette.grey[800],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        border: `2px solid ${theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[400]}`,
      }}
    >
      {getPositionSuffix(position, t)}
    </Box>
  );
}

/** Team info component */
function TeamInfo({ team }: { readonly team: Team }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {team.name}
      </Typography>
    </Box>
  );
}

/** Third place qualification checkbox */
function ThirdPlaceCheckbox({
  checked,
  disabled,
  onChange,
  disabledReason,
  maxThirdPlace,
  t,
}: {
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly onChange?: () => void;
  readonly disabledReason?: 'limit-reached';
  readonly maxThirdPlace?: number;
  readonly t: any;
}) {
  const tooltipMessage = disabledReason === 'limit-reached' && maxThirdPlace
    ? t('thirdPlace.limitReached', { max: maxThirdPlace })
    : '';

  return (
    <Tooltip title={tooltipMessage} arrow>
      <span>
        <FormControlLabel
          control={<Checkbox checked={checked} onChange={onChange} disabled={disabled} color="primary" />}
          label={
            <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
              {t('position.label')}
            </Typography>
          }
          sx={{ mr: 0, flexShrink: 0 }}
        />
      </span>
    </Tooltip>
  );
}

/** Get position display (1°, 2°, 3°, 4°, etc.) */
function getPositionDisplay(pos: number | null, t: any): string {
  if (pos === null) return '';
  if (pos === 1) return t('position.first');
  if (pos === 2) return t('position.second');
  if (pos === 3) return t('position.third');
  return t('position.fourth');
}

/** Results overlay showing points and qualification status */
function ResultsOverlay({
  result,
  isPending3rdPlace,
  isPendingBeforeResults,
  position,
  t,
}: {
  readonly result?: TeamScoringResult | null;
  readonly isPending3rdPlace: boolean;
  readonly isPendingBeforeResults: boolean;
  readonly position: number;
  readonly t: any;
}) {
  const theme = useTheme();

  // Determine label, explanation text, and chip styling based on result
  let chipLabel: string;
  let explanationText: string;
  let chipBackgroundColor: string;
  let chipTextColor: string;

  if (isPendingBeforeResults) {
    // Pending state before group completion
    chipLabel = t('results.pending');
    chipBackgroundColor = theme.palette.info.light;
    chipTextColor = 'white';

    // Different explanations for positions 1-2 vs position 3
    if (position === 1 || position === 2) {
      explanationText = t('results.waitingGroup');
    } else {
      explanationText = t('results.waitingAll');
    }
  } else if (isPending3rdPlace) {
    // Pending 3rd place playoff
    chipLabel = t('results.pending');
    chipBackgroundColor = theme.palette.info.light;
    chipTextColor = 'white';
    explanationText = t('results.waitingBestThirds');
  } else if (result && result.pointsAwarded > 0) {
    // Correct predictions (1 or 2 pts): green chip like regular game cards
    const pointsKey = result.pointsAwarded === 1 ? 'results.points1' : 'results.points2';
    chipLabel = t(pointsKey);
    chipBackgroundColor = theme.palette.success.light;
    chipTextColor = 'white';

    // Show predicted vs actual position
    const predictedPos = getPositionDisplay(result.predictedPosition, t);
    const actualPos = getPositionDisplay(result.actualPosition, t);
    explanationText = t('results.predictedVsActual', {
      predicted: predictedPos,
      actual: actualPos,
    });
  } else {
    // Wrong prediction (0 pts): red
    chipLabel = t('results.points0');
    chipBackgroundColor = theme.palette.error.light;
    chipTextColor = 'white';

    // Show predicted position and that team didn't qualify
    const predictedPos = getPositionDisplay(result?.predictedPosition || null, t);
    explanationText = t('results.didNotQualify', {
      predicted: predictedPos,
    });
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, flexShrink: 0 }}>
      {/* Chip without icon */}
      <Chip
        label={chipLabel}
        size="small"
        sx={{
          fontWeight: 600,
          fontSize: '0.6875rem',
          backgroundColor: chipBackgroundColor,
          color: chipTextColor,
        }}
      />
      {/* Explanation text */}
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.6rem',
          color: 'text.secondary',
          fontStyle: 'italic',
          textAlign: 'right',
          lineHeight: 1.2,
        }}
      >
        {explanationText}
      </Typography>
    </Box>
  );
}

/**
 * Draggable team card component for group qualification predictions
 * Uses dnd-kit for drag-and-drop reordering
 */
export default function DraggableTeamCard({
  team,
  position,
  predictedToQualify,
  isLocked,
  isSaving,
  maxThirdPlace,
  currentThirdPlaceCount,
  onToggleThirdPlace,
  result,
  isGroupComplete,
  allGroupsComplete,
  isPending3rdPlace,
}: DraggableTeamCardProps) {
  const theme = useTheme();
  const t = useTranslations('qualified-teams');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: team.id,
    disabled: isLocked || isSaving,
  });

  // Calculate opacity based on dragging state only
  // Don't reduce opacity for read-only/locked state (better contrast)
  const getOpacity = () => {
    if (isDragging) return 0.5;
    return 1;
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: getOpacity(),
  };

  const backgroundColor = getBackgroundColor(theme);
  const borderColor = getBorderColor(theme, {
    position,
    predictedToQualify,
    disabled: isLocked,
    result,
    isGroupComplete,
    allGroupsComplete,
    isPending3rdPlace,
  });

  // Determine if this team is in a pending state (waiting for results)
  const isPendingBeforeResults = isLocked && predictedToQualify && (
    // Positions 1-2: Pending until their group completes
    ((position === 1 || position === 2) && !isGroupComplete) ||
    // Position 3: Pending until all groups complete (but only if group not complete yet)
    (position === 3 && !allGroupsComplete && !isGroupComplete)
  );

  // Show results overlay when:
  // 1. Locked AND predicted to qualify AND pending (waiting for results)
  // 2. Group is complete AND result exists AND predicted to qualify (showing actual results)
  const showResults = predictedToQualify && (
    isPendingBeforeResults ||
    isPending3rdPlace ||
    (isGroupComplete && result)
  );

  // Determine if checkbox should be disabled due to limit being reached
  // Only disable if this team is NOT already selected and limit is reached
  const cannotAddMore = !predictedToQualify && currentThirdPlaceCount >= maxThirdPlace;

  const isDragDisabled = isLocked || isSaving;
  let cardCursor = 'grab';
  if (isDragDisabled) {
    cardCursor = 'default';
  } else if (isDragging) {
    cardCursor = 'grabbing';
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        mb: 1,
        touchAction: isDragDisabled ? 'auto' : 'none',
        cursor: cardCursor,
        backgroundColor,
        border: isDragging ? `2px dashed ${theme.palette.primary.main}` : '1px solid',
        borderColor: isDragging ? theme.palette.primary.main : theme.palette.divider,
        borderLeft: borderColor === 'transparent' ? undefined : `4px solid ${borderColor}`,
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 1.5,
          '&:last-child': { pb: 1.5 },
        }}
      >
        {!isLocked && <DragHandle disabled={isLocked || isSaving} />}
        <PositionBadge position={position} t={t} />
        <TeamInfo team={team} />
        {position === 3 && !isLocked && (
          <Box component="span" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
            <ThirdPlaceCheckbox
              checked={predictedToQualify}
              disabled={isLocked || isSaving || cannotAddMore}
              onChange={onToggleThirdPlace}
              disabledReason={cannotAddMore ? 'limit-reached' : undefined}
              maxThirdPlace={maxThirdPlace}
              t={t}
            />
          </Box>
        )}
        {showResults && <ResultsOverlay result={result} isPending3rdPlace={isPending3rdPlace} isPendingBeforeResults={isPendingBeforeResults} position={position} t={t} />}
      </CardContent>
    </Card>
  );
}
