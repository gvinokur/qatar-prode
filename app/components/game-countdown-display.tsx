'use client';

import { Box, LinearProgress, Link, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
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
  /** Optional actions to render on Line 2 (edit button, chips, etc.) */
  actions?: React.ReactNode;
}

/**
 * Displays a countdown timer for game prediction deadlines with color-coded urgency
 * and optional progress bar. Shows date (Line 1, centered with toggle) and countdown state (Line 2 with actions).
 * Includes pulsing animation for urgent states.
 */
export default function GameCountdownDisplay({
  gameDate,
  gameTimezone,
  compact = false,
  actions,
}: Readonly<GameCountdownDisplayProps>) {
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
  // If no gameTimezone, just show date without label
  let currentTime: string;
  if (gameTimezone) {
    if (showLocalTime) {
      currentTime = getCompactUserTime(gameDate);
    } else {
      currentTime = getCompactGameTime(gameDate, gameTimezone);
    }
  } else {
    currentTime = `${dayjs(gameDate).format('D MMM HH:mm')}`;
  }

  const toggleText = showLocalTime ? 'Ver horario local' : 'Ver tu horario';

  return (
    <>
      {/* Line 1: Date centered with toggle link */}
      <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
        <Typography
          variant={compact ? 'body2' : 'body1'}
          color="text.secondary"
          sx={{
            whiteSpace: 'nowrap',
            textAlign: 'center',
            fontWeight: 'bold'
          }}
        >
          {currentTime}
        </Typography>
        {gameTimezone && (
          <Link
            component="button"
            variant={compact ? 'caption' : 'body2'}
            onClick={toggleTimezone}
            sx={{
              textDecoration: 'underline',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {toggleText}
          </Link>
        )}
      </Box>

      {/* Line 2: State indicator + Progress bar + Actions */}
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
        <Box display="flex" alignItems="center" gap={1} flex={1}>
          {/* State: "Cerrado" or "Cierra en XXX" */}
          <motion.div animate={pulsingAnimation} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Typography
              variant={compact ? 'body2' : 'body1'}
              sx={{
                color: color,
                fontWeight: countdown.urgency === 'urgent' ? 'bold' : 'normal',
                whiteSpace: 'nowrap'
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

        {/* Actions from parent (chips, buttons, etc.) */}
        {actions && (
          <Box display="flex" alignItems="center" gap={0.5}>
            {actions}
          </Box>
        )}
      </Box>
    </>
  );
}
