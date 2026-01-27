'use client';

import { Box, LinearProgress, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { useGameCountdown } from '../hooks/use-game-countdown';
import { getUrgencyColor } from '../utils/countdown-utils';
import { getUserLocalTime, getLocalGameTime } from '../utils/date-utils';
import { useTimezone } from './context-providers/timezone-context-provider';

interface GameCountdownDisplayProps {
  /** The date and time when the game starts */
  gameDate: Date;
  /** Optional timezone for the game (if not provided, uses user's local time) */
  gameTimezone?: string;
  /** Whether to show a progress bar */
  showProgressBar?: boolean;
  /** Compact mode for smaller display */
  compact?: boolean;
}

/**
 * Displays a countdown timer for game prediction deadlines with color-coded urgency
 * and optional progress bar. Includes pulsing animation for urgent states.
 */
export default function GameCountdownDisplay({
  gameDate,
  gameTimezone,
  showProgressBar = false,
  compact = false,
}: GameCountdownDisplayProps) {
  const theme = useTheme();
  const { showLocalTime } = useTimezone();
  const countdown = useGameCountdown(gameDate);

  // Determine if we should show the countdown or the original date format
  const shouldShowCountdown = !countdown.isClosed;

  // Get the color based on urgency level
  const color = getUrgencyColor(theme, countdown.urgency);

  // Pulsing animation for urgent state (respects prefers-reduced-motion)
  const pulsingAnimation = countdown.urgency === 'urgent' ? {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  } : {};

  // Display fallback to original date format when closed
  const displayText = shouldShowCountdown
    ? countdown.display
    : showLocalTime
    ? getUserLocalTime(gameDate)
    : getLocalGameTime(gameDate, gameTimezone);

  return (
    <Box
      display="flex"
      flexDirection={compact ? 'row' : 'column'}
      alignItems={compact ? 'center' : 'flex-start'}
      gap={compact ? 1 : 0.5}
      flex={1}
    >
      <motion.div
        animate={pulsingAnimation}
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <Typography
          variant={compact ? 'body2' : 'body1'}
          sx={{
            color: color,
            fontWeight: countdown.urgency === 'urgent' ? 'bold' : 'normal',
          }}
        >
          {displayText}
        </Typography>
      </motion.div>

      {showProgressBar && shouldShowCountdown && (
        <Box width="100%" minWidth={compact ? 80 : 120}>
          <LinearProgress
            variant="determinate"
            value={countdown.progressPercent}
            sx={{
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.palette.action.hover,
              '& .MuiLinearProgress-bar': {
                backgroundColor: color,
                borderRadius: 2,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}
