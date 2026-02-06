'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, Typography, Box, Checkbox, FormControlLabel, useTheme, Theme } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Team } from '../../db/tables-definition';

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
}

/** Get position suffix (1st, 2nd, 3rd, 4th, etc.) */
function getPositionSuffix(pos: number): string {
  if (pos === 1) return 'st';
  if (pos === 2) return 'nd';
  if (pos === 3) return 'rd';
  return 'th';
}

/** Get background color based on qualification status */
function getBackgroundColor(theme: Theme, position: number, predictedToQualify: boolean): string {
  if (position === 1 || position === 2) return theme.palette.success.light;
  if (position === 3) return predictedToQualify ? theme.palette.success.light : theme.palette.warning.light;
  return theme.palette.grey[100];
}

/** Drag handle component */
function DragHandle({ disabled, attributes, listeners }: { disabled: boolean; attributes: any; listeners: any }) {
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
function PositionBadge({ position }: { position: number }) {
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
function TeamInfo({ team }: { team: Team }) {
  return (
    <Box sx={{ flex: 1 }}>
      <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
        {team.name}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.7 }}>
        {team.short_name}
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
  checked: boolean;
  disabled: boolean;
  onChange?: () => void;
}) {
  return (
    <FormControlLabel
      control={<Checkbox checked={checked} onChange={onChange} disabled={disabled} color="primary" />}
      label={
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          Clasifica
        </Typography>
      }
      sx={{ mr: 0 }}
    />
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : disabled ? 0.6 : 1,
  };

  const backgroundColor = getBackgroundColor(theme, position, predictedToQualify);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 1,
        cursor: disabled ? 'default' : 'grab',
        backgroundColor,
        border: isDragging ? `2px dashed ${theme.palette.primary.main}` : '1px solid',
        borderColor: theme.palette.divider,
        '&:active': {
          cursor: disabled ? 'default' : 'grabbing',
        },
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          '&:last-child': { pb: 2 },
          // Ensure good contrast on colored backgrounds
          color: theme.palette.getContrastText(backgroundColor),
        }}
      >
        <DragHandle disabled={disabled} attributes={attributes} listeners={listeners} />
        <PositionBadge position={position} />
        <TeamInfo team={team} />
        {position === 3 && (
          <ThirdPlaceCheckbox
            checked={predictedToQualify}
            disabled={disabled}
            onChange={onToggleThirdPlace}
          />
        )}
      </CardContent>
    </Card>
  );
}
