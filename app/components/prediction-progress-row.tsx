import React from 'react';
import { Box, LinearProgress, Typography, IconButton } from '@mui/material';
import { BoostCountBadge } from './boost-badge';
import { getUrgencyIcon, UrgencyLevel } from './urgency-helpers';

interface PredictionProgressRowProps {
  readonly label: string;
  readonly currentValue: number;
  readonly maxValue?: number;
  readonly percentage: number;
  readonly urgencyLevel: UrgencyLevel;
  readonly onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  readonly showBoosts?: boolean;
  readonly silverUsed?: number;
  readonly silverMax?: number;
  readonly goldenUsed?: number;
  readonly goldenMax?: number;
  readonly onBoostClick?: (event: React.MouseEvent<HTMLElement>, type: 'silver' | 'golden') => void;
  readonly marginBottom?: number;
}

/**
 * Reusable progress row component for displaying prediction completion
 * Handles both game predictions (with boosts) and tournament predictions
 */
export function PredictionProgressRow({
  label,
  currentValue,
  maxValue,
  percentage,
  urgencyLevel,
  onClick,
  showBoosts = false,
  silverUsed = 0,
  silverMax = 0,
  goldenUsed = 0,
  goldenMax = 0,
  onBoostClick,
  marginBottom = 1
}: PredictionProgressRowProps) {
  const displayValue = maxValue === undefined
    ? `${currentValue}%`
    : `${currentValue}/${maxValue}`;

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 1.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'action.hover'
        },
        mb: marginBottom
      }}
    >
      <Typography variant="body2" sx={{ minWidth: '140px', fontWeight: 500 }}>
        {label}: {displayValue}
      </Typography>

      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          flexGrow: 1,
          height: 8,
          borderRadius: 4
        }}
      />

      {showBoosts && onBoostClick && (
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
          {silverMax > 0 && (
            <Box onClick={(e) => onBoostClick(e, 'silver')}>
              <BoostCountBadge type="silver" used={silverUsed} max={silverMax} />
            </Box>
          )}
          {goldenMax > 0 && (
            <Box onClick={(e) => onBoostClick(e, 'golden')}>
              <BoostCountBadge type="golden" used={goldenUsed} max={goldenMax} />
            </Box>
          )}
        </Box>
      )}

      <IconButton size="small" sx={{ p: 0.5 }}>
        {getUrgencyIcon(urgencyLevel)}
      </IconButton>
    </Box>
  );
}
