'use client';

import { Box, LinearProgress, Tooltip, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { useGameCountdown } from '../hooks/use-game-countdown';
import { getUrgencyColor } from '../utils/countdown-utils';
import { getCompactUserTime, getCompactGameTime } from '../utils/date-utils';
import { useTimezone } from './context-providers/timezone-context-provider';

interface GameCountdownDisplayProps {
  /** The date and time when the game starts */
  gameDate: Date;
  /** Optional timezone for the game */
  gameTimezone?: string;
  /** Compact mode for smaller display */
  compact?: boolean;
}

/**
 * Displays a countdown timer for game prediction deadlines with color-coded urgency
 * and optional progress bar. Shows both date (Line 1) and countdown state (Line 2).
 * Includes pulsing animation for urgent states.
 */
export default function GameCountdownDisplay({
  gameDate,
  gameTimezone,
  compact = false,
}: GameCountdownDisplayProps) {
  const theme = useTheme();
  const { showLocalTime, toggleTimezone } = useTimezone();
  const countdown = useGameCountdown(gameDate);

  const color = getUrgencyColor(theme, countdown.urgency);

  // Pulsing animation only for urgent state
  const pulsingAnimation = countdown.urgency === 'urgent' ? {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  } : {};

  // Get formatted date based on timezone toggle
  const formattedDate = showLocalTime
    ? getCompactUserTime(gameDate)
    : getCompactGameTime(gameDate, gameTimezone);

  return (
    <Box display="flex" flexDirection="column" gap={0.5} flex={1}>
      {/* Line 1: Date with timezone toggle (ALWAYS) */}
      <Tooltip title={`Click to toggle: ${showLocalTime ? 'Show game timezone' : 'Show your time'}`}>
        <Typography
          variant={compact ? 'body2' : 'body1'}
          color="text.secondary"
          sx={{
            cursor: 'pointer',
            textDecoration: 'underline',
            whiteSpace: 'nowrap'
          }}
          onClick={toggleTimezone}
        >
          {formattedDate}
        </Typography>
      </Tooltip>

      {/* Line 2: State indicator + Progress bar */}
      <Box display="flex" alignItems="center" gap={1}>
        {/* State: "Closed" or "Closes in XXX" */}
        <motion.div animate={pulsingAnimation} style={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            variant={compact ? 'body2' : 'body1'}
            sx={{
              color: color,
              fontWeight: countdown.urgency === 'urgent' ? 'bold' : 'normal',
            }}
          >
            {countdown.display}
          </Typography>
        </motion.div>

        {/* Progress bar - inline on Line 2, only within 48h window */}
        {countdown.shouldShowProgressBar && (
          <Box flex={1} minWidth={60}>
            <LinearProgress
              variant="determinate"
              value={countdown.progressPercent}
              sx={{
                height: 3,
                borderRadius: 1.5,
                backgroundColor: theme.palette.action.hover,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: color,
                  borderRadius: 1.5,
                },
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
