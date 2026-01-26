'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { Box, Chip, useTheme } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { ConfettiEffect, TrophyBounce, SobEffect } from './celebration-effects';
import PointBreakdownTooltip from './point-breakdown-tooltip';
import { BoostType } from '../utils/point-calculator';

interface GameCardPointOverlayProps {
  gameId: string;
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
  gameId,
  points,
  baseScore,
  multiplier,
  boostType,
  scoreDescription,
}: GameCardPointOverlayProps) {
  const theme = useTheme();
  const searchParams = useSearchParams();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Counter animation
  const count = useMotionValue(0);

  useEffect(() => {
    // Check if we should animate
    const forceAnimation = searchParams?.get('forceAnimation') === 'true';
    const storageKey = `pointAnimation_${gameId}`;
    const hasAnimated = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;

    if (forceAnimation || !hasAnimated) {
      setShouldAnimate(true);
      if (!forceAnimation && typeof window !== 'undefined') {
        localStorage.setItem(storageKey, 'true');
      }
    }
  }, [gameId, searchParams]);

  useEffect(() => {
    if (!shouldAnimate) return;

    const controls = animate(count, points, {
      duration: 1.5,
      ease: 'easeOut',
    });

    // Trigger celebration effects briefly
    setShowCelebration(true);
    const timeout = setTimeout(() => setShowCelebration(false), 2500);
    return () => {
      clearTimeout(timeout);
      controls.stop();
    };
  }, [count, points, shouldAnimate]);

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
    if (points === 0) return 'white';
    if (boostType) {
      return boostType === 'golden' ? '#FFD700' : '#C0C0C0';
    }
    return theme.palette.success.main;
  };

  // Format display text
  const formatPointsText = () => {
    const sign = points > 0 ? '+' : '';
    const pointsText = `${sign}${points} ${points === 1 ? 'pt' : 'pts'}`;

    if (points === 0) {
      return (
        <Box display="flex" alignItems="center" gap={0.5}>
          <span>{pointsText}</span>
          <SobEffect show={shouldAnimate && showCelebration} />
        </Box>
      );
    }

    if (boostType && points > 0) {
      return (
        <Box display="flex" alignItems="center" gap={0.5}>
          <span>{pointsText}</span>
          <TrophyBounce show={shouldAnimate && showCelebration} boostType={boostType} />
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
          show={shouldAnimate && showCelebration && points > 0}
          color={boostType === 'golden' ? '#FFD700' : theme.palette.success.main}
        />

        {/* Point display chip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: -10 }}
          animate={
            boostType && shouldAnimate && showCelebration
              ? { scale: [1, 1.05, 1], opacity: 1, y: 0 }
              : { opacity: 1, scale: 1, y: 0 }
          }
          transition={
            boostType && shouldAnimate && showCelebration
              ? {
                  scale: { repeat: 2, duration: 0.5 },
                  opacity: { duration: 0.3 },
                  y: { duration: 0.3 },
                }
              : { duration: 0.3, ease: 'easeOut' }
          }
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
              height: boostType ? 28 : 24,
              backgroundColor: getChipColor(),
              color: getTextColor(),
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              boxShadow: boostType === 'golden'
                ? '0 0 12px rgba(255, 215, 0, 0.6)'
                : boostType === 'silver'
                ? '0 0 12px rgba(192, 192, 192, 0.6)'
                : 'none',
              '&:hover': {
                backgroundColor:
                  points === 0
                    ? theme.palette.error.main
                    : boostType === 'golden'
                    ? 'rgba(255, 215, 0, 0.3)'
                    : boostType === 'silver'
                    ? 'rgba(192, 192, 192, 0.3)'
                    : theme.palette.success.main,
                color: points === 0 ? 'white' : undefined,
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
