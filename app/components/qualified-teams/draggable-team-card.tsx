'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, Typography, Box, Checkbox, FormControlLabel, useTheme, Theme, Chip } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { Team } from '../../db/tables-definition';
import { TeamScoringResult } from '../../utils/qualified-teams-scoring';

export interface DraggableTeamCardProps {
  /** Team data */
  readonly team: Team;
  /** Predicted position (1, 2, 3, etc.) */
  readonly position: number;
  /** Whether team is predicted to qualify (for position 3) */
  readonly predictedToQualify: boolean;
  /** Whether drag-and-drop is disabled (tournament locked) */
  readonly disabled: boolean;
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
function getPositionSuffix(pos: number): string {
  if (pos === 1) return 'st';
  if (pos === 2) return 'nd';
  if (pos === 3) return 'rd';
  return 'th';
}

/** Get background color - now using gray for cleaner design */
function getBackgroundColor(theme: Theme): string {
  // Use consistent gray background for all cards
  return theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50];
}

/** Get border color based on qualification status and result */
function getBorderColor(
  theme: Theme,
  position: number,
  predictedToQualify: boolean,
  disabled: boolean,
  result?: TeamScoringResult | null,
  isGroupComplete?: boolean,
  allGroupsComplete?: boolean,
  isPending3rdPlace?: boolean
): string {
  // Position 4+ or non-predicted 3rd place: no colored border
  if (position >= 4 || (position === 3 && disabled && !predictedToQualify)) {
    return 'transparent';
  }

  // If locked and predicted to qualify, check for pending state BEFORE results
  if (disabled && predictedToQualify) {
    // Positions 1-2: Pending until their group completes
    if ((position === 1 || position === 2) && !isGroupComplete) {
      return theme.palette.info.main;
    }
    // Position 3: Pending until all groups complete
    if (position === 3 && !allGroupsComplete && !isGroupComplete) {
      return theme.palette.info.main;
    }
  }

  // If group is complete and we have a result AND user predicted to qualify, use result-based colors
  if (isGroupComplete && result && predictedToQualify) {
    if (isPending3rdPlace) {
      // Pending 3rd place: blue
      return theme.palette.info.main;
    }
    if (result.pointsAwarded === 2 || result.pointsAwarded === 1) {
      // Correct predictions (1 or 2 pts): green border
      return theme.palette.success.main;
    }
    if (result.pointsAwarded === 0) {
      // Wrong prediction (0 pts): red border
      return theme.palette.error.main;
    }
  }

  // Default prediction colors (before results available)
  // Positions 1-2-3 in selection mode: yellow border
  if (!disabled && (position === 1 || position === 2 || (position === 3 && predictedToQualify))) {
    return theme.palette.warning.main;
  }

  // Position 3 qualified (locked): green border
  if (position === 3 && disabled && predictedToQualify) {
    return theme.palette.success.main;
  }

  // Default: no border color
  return 'transparent';
}

/** Drag handle component */
function DragHandle({ disabled, attributes, listeners }: { readonly disabled: boolean; readonly attributes: any; readonly listeners: any }) {
  return (
    <Box
      {...attributes}
      {...listeners}
      sx={{
        display: 'flex',
        alignItems: 'center',
        opacity: disabled ? 0.38 : 0.54,
        cursor: disabled ? 'not-allowed' : 'grab',
        '&:active': { cursor: disabled ? 'not-allowed' : 'grabbing' },
      }}
    >
      <DragIndicatorIcon />
    </Box>
  );
}

/** Position badge component */
function PositionBadge({ position }: { readonly position: number }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        minWidth: 48,
        height: 48,
        borderRadius: '50%',
        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[300],
        color: theme.palette.mode === 'dark' ? theme.palette.grey[100] : theme.palette.grey[800],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        border: `2px solid ${theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[400]}`,
      }}
    >
      {position}
      <Typography variant="caption" component="sup" sx={{ fontSize: '0.6rem', ml: 0.25 }}>
        {getPositionSuffix(position)}
      </Typography>
    </Box>
  );
}

/** Team info component */
function TeamInfo({ team }: { readonly team: Team }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="h6" component="div" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
}: {
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly onChange?: () => void;
}) {
  return (
    <FormControlLabel
      control={<Checkbox checked={checked} onChange={onChange} disabled={disabled} color="primary" />}
      label={
        <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
          Clasifica
        </Typography>
      }
      sx={{ mr: 0, flexShrink: 0 }}
    />
  );
}

/** Results overlay showing points and qualification status */
function ResultsOverlay({
  result,
  isPending3rdPlace,
  isPendingBeforeResults,
}: {
  readonly result?: TeamScoringResult | null;
  readonly isPending3rdPlace: boolean;
  readonly isPendingBeforeResults: boolean;
}) {
  const theme = useTheme();

  // Determine icon, color, label, and chip styling based on result
  let icon: React.ReactNode;
  let chipLabel: string;
  let iconColor: string;
  let chipBackgroundColor: string;
  let chipTextColor: string;

  if (isPendingBeforeResults || isPending3rdPlace) {
    // Pending state (waiting for group/all groups to complete, or 3rd place playoff)
    icon = <HourglassEmptyIcon sx={{ fontSize: '1.25rem' }} />;
    chipLabel = 'Pendiente';
    iconColor = theme.palette.info.main;
    chipBackgroundColor = theme.palette.info.light;
    chipTextColor = 'white';
  } else if (result && result.pointsAwarded > 0) {
    // Correct predictions (1 or 2 pts): green chip like regular game cards
    // Border color already indicates success, chip shows points
    icon = <CheckCircleIcon sx={{ fontSize: '1.25rem' }} />;
    chipLabel = result.pointsAwarded === 1 ? '+1 pt' : '+2 pts';
    iconColor = theme.palette.success.main;
    chipBackgroundColor = theme.palette.success.light;
    chipTextColor = 'white';
  } else {
    // Wrong prediction (0 pts): red
    icon = <CancelIcon sx={{ fontSize: '1.25rem' }} />;
    chipLabel = '+0 pts';
    iconColor = theme.palette.error.main;
    chipBackgroundColor = theme.palette.error.light;
    chipTextColor = 'white';
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
      <Box sx={{ color: iconColor, display: 'flex', alignItems: 'center' }}>
        {icon}
      </Box>
      <Chip
        label={chipLabel}
        size="small"
        sx={{
          fontWeight: 600,
          fontSize: '0.75rem',
          backgroundColor: chipBackgroundColor,
          color: chipTextColor,
        }}
      />
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
  disabled,
  onToggleThirdPlace,
  result,
  isGroupComplete,
  allGroupsComplete,
  isPending3rdPlace,
}: DraggableTeamCardProps) {
  const theme = useTheme();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: team.id,
    disabled,
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
  const borderColor = getBorderColor(theme, position, predictedToQualify, disabled, result, isGroupComplete, allGroupsComplete, isPending3rdPlace);

  // Determine if this team is in a pending state (waiting for results)
  const isPendingBeforeResults = disabled && predictedToQualify && (
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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 1,
        touchAction: disabled ? 'auto' : 'none',
        backgroundColor,
        border: isDragging ? `2px dashed ${theme.palette.primary.main}` : '1px solid',
        borderColor: isDragging ? theme.palette.primary.main : theme.palette.divider,
        borderLeft: borderColor !== 'transparent' ? `4px solid ${borderColor}` : undefined,
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          '&:last-child': { pb: 2 },
        }}
      >
        {!disabled && <DragHandle disabled={disabled} attributes={attributes} listeners={listeners} />}
        <PositionBadge position={position} />
        <TeamInfo team={team} />
        {position === 3 && !disabled && (
          <ThirdPlaceCheckbox
            checked={predictedToQualify}
            disabled={disabled}
            onChange={onToggleThirdPlace}
          />
        )}
        {showResults && <ResultsOverlay result={result} isPending3rdPlace={isPending3rdPlace} isPendingBeforeResults={isPendingBeforeResults} />}
      </CardContent>
    </Card>
  );
}
