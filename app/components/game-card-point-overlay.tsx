'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { Box, Chip, useTheme } from '@mui/material';
import { ConfettiEffect, TrophyBounce } from './celebration-effects';
import PointBreakdownTooltip from './point-breakdown-tooltip';
import { BoostType } from '../utils/point-calculator';

interface GameCardPointOverlayProps {
  points: number;
  baseScore: number;
  multiplier: number;
  boostType: BoostType;
  scoreDescription: string;
}

/**
 * Point display overlay for game cards
 * Shows animated counter and triggers celebration effects
 */
export default function GameCardPointOverlay({
  points,
  baseScore,
  multiplier,
  boostType,
  scoreDescription,
}: GameCardPointOverlayProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Counter animation
  const count = useMotionValue(0);

  useEffect(() => {
    const controls = animate(count, points, {
      duration: 0.8,
      ease: 'easeOut',
    });

    // Trigger celebration effects briefly
    if (points > 0) {
      setShowCelebration(true);
      const timeout = setTimeout(() => setShowCelebration(false), 1000);
      return () => {
        clearTimeout(timeout);
        controls.stop();
      };
    }

    return () => controls.stop();
  }, [count, points]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  // Styling based on score
  const getChipColor = () => {
    if (points === 0) return theme.palette.error.light;
    if (boostType) {
      return boostType === 'golden'
        ? 'rgba(255, 215, 0, 0.2)'
        : 'rgba(192, 192, 192, 0.2)';
    }
    return theme.palette.success.light;
  };

  const getTextColor = () => {
    if (points === 0) return theme.palette.error.main;
    if (boostType) {
      return boostType === 'golden' ? '#FFD700' : '#C0C0C0';
    }
    return theme.palette.success.main;
  };

  // Format display text
  const formatPointsText = () => {
    const sign = points > 0 ? '+' : '';
    const pointsText = `${sign}${points} ${points === 1 ? 'pt' : 'pts'}`;

    if (boostType && points > 0) {
      return (
        <Box display="flex" alignItems="center" gap={0.5}>
          <span>{pointsText}</span>
          <TrophyBounce show={showCelebration} boostType={boostType} />
          <Typography
            component="span"
            variant="caption"
            sx={{
              opacity: 0.8,
              fontSize: '0.65rem',
            }}
          >
            ({baseScore}pt x{multiplier})
          </Typography>
        </Box>
      );
    }

    return pointsText;
  };

  return (
    <>
      <Box sx={{ position: 'relative' }}>
        {/* Confetti effect */}
        <ConfettiEffect
          show={showCelebration && points > 0}
          color={boostType === 'golden' ? '#FFD700' : theme.palette.success.main}
        />

        {/* Point display chip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Chip
            label={
              <motion.span
                style={{
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                }}
              >
                {formatPointsText()}
              </motion.span>
            }
            onClick={handleClick}
            sx={{
              height: 24,
              backgroundColor: getChipColor(),
              color: getTextColor(),
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor:
                  points === 0
                    ? theme.palette.error.main
                    : boostType === 'golden'
                    ? 'rgba(255, 215, 0, 0.3)'
                    : boostType === 'silver'
                    ? 'rgba(192, 192, 192, 0.3)'
                    : theme.palette.success.main,
                transform: 'scale(1.05)',
              },
            }}
          />
        </motion.div>
      </Box>

      {/* Breakdown tooltip */}
      <PointBreakdownTooltip
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        baseScore={baseScore}
        multiplier={multiplier}
        finalScore={points}
        scoreDescription={scoreDescription}
        boostType={boostType}
      />
    </>
  );
}

// Import Typography for the boost text display
import { Typography } from '@mui/material';
