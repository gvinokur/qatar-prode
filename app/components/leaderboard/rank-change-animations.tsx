'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Box, TableRow, TableCell, useTheme } from '@mui/material';
import { ArrowUpward, ArrowDownward, Remove } from '@mui/icons-material';
import { ReactNode, useEffect, useState } from 'react';
import { ConfettiEffect } from '../celebration-effects';
import { triggerRankUpHaptic } from '../../utils/haptics';

interface RankChangeIndicatorProps {
  rankChange: number;
  size?: 'small' | 'medium';
}

/**
 * Shows rank change indicator with appropriate icon and color
 * Positive = moved up (green), Negative = moved down (red), Zero = no change (gray)
 */
export function RankChangeIndicator({ rankChange, size = 'medium' }: Readonly<RankChangeIndicatorProps>) {
  const theme = useTheme();

  // Determine icon and color based on rank change
  const Icon = rankChange === 0 ? Remove : rankChange > 0 ? ArrowUpward : ArrowDownward;
  const color = rankChange === 0
    ? theme.palette.text.disabled
    : rankChange > 0
      ? theme.palette.success.main
      : theme.palette.error.main;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`rank-change-${rankChange}`}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.3, ease: 'backOut' }}
        style={{ display: 'inline-flex', alignItems: 'center' }}
      >
        <Icon
          sx={{
            fontSize: size === 'small' ? 14 : 16,
            color,
            verticalAlign: 'middle',
          }}
        />
        {rankChange !== 0 && (
          <Box
            component="span"
            sx={{
              fontSize: size === 'small' ? '0.75rem' : '0.875rem',
              color,
              fontWeight: 'bold',
              ml: 0.25,
            }}
          >
            {Math.abs(rankChange)}
          </Box>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

interface AnimatedRankCellProps {
  rank: number;
  rankChange?: number;
  children?: ReactNode;
}

/**
 * Animates rank cell with slide effect when rank changes
 */
export function AnimatedRankCell({ rank, rankChange = 0, children }: Readonly<AnimatedRankCellProps>) {
  return (
    <TableCell>
      <Box display="flex" alignItems="center" gap={1}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`rank-${rank}`}
            initial={{ y: rankChange > 0 ? 10 : rankChange < 0 ? -10 : 0, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: rankChange > 0 ? -10 : rankChange < 0 ? 10 : 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {rank}
          </motion.div>
        </AnimatePresence>
        {rankChange !== 0 && <RankChangeIndicator rankChange={rankChange} size="small" />}
        {children}
      </Box>
    </TableCell>
  );
}

interface AnimatedPointsCounterProps {
  value: number;
  previousValue?: number;
  duration?: number;
}

/**
 * Animates point value changes with counter animation
 */
export function AnimatedPointsCounter({
  value,
  previousValue,
  duration = 0.8,
}: Readonly<AnimatedPointsCounterProps>) {
  const [displayValue, setDisplayValue] = useState(previousValue ?? value);
  const theme = useTheme();

  useEffect(() => {
    if (previousValue === undefined || previousValue === value) {
      setDisplayValue(value);
      return;
    }

    const startValue = previousValue;
    const endValue = value;
    const startTime = Date.now();
    const durationMs = duration * 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Ease out quad
      const easeProgress = 1 - Math.pow(1 - progress, 2);
      const currentValue = Math.round(startValue + (endValue - startValue) * easeProgress);

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, previousValue, duration]);

  const difference = previousValue !== undefined ? value - previousValue : 0;
  const hasIncrease = difference > 0;

  return (
    <Box
      component="span"
      sx={{
        color: hasIncrease ? theme.palette.success.main : 'inherit',
        transition: 'color 0.3s ease',
        fontWeight: hasIncrease ? 'bold' : 'normal',
      }}
    >
      {displayValue}
    </Box>
  );
}

interface RankUpCelebrationProps {
  show: boolean;
  rankChange: number;
}

/**
 * Shows celebration effects for rank improvements
 * Includes confetti animation and green glow
 */
export function RankUpCelebration({ show, rankChange }: Readonly<RankUpCelebrationProps>) {
  const theme = useTheme();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (show && rankChange > 0) {
      setShowConfetti(true);
      triggerRankUpHaptic();

      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [show, rankChange]);

  if (!show || rankChange <= 0) return null;

  return (
    <>
      {/* Green glow effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.15, 0] }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.palette.success.main,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {/* Confetti effect */}
      <ConfettiEffect show={showConfetti} color={theme.palette.success.main} />
    </>
  );
}

interface StaggeredLeaderboardRowProps {
  index: number;
  selected?: boolean;
  rankChange?: number;
  children: ReactNode;
}

/**
 * Wraps TableRow with staggered entrance animation
 * Provides cascade effect when leaderboard loads
 */
export function StaggeredLeaderboardRow({
  index,
  selected,
  rankChange = 0,
  children,
}: Readonly<StaggeredLeaderboardRowProps>) {
  // Limit stagger effect to first 10 rows for performance
  const shouldStagger = index < 10;
  const delay = shouldStagger ? index * 0.05 : 0;

  return (
    <TableRow
      component={motion.tr}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      selected={selected}
      sx={{
        position: 'relative',
      }}
    >
      <RankUpCelebration show={true} rankChange={rankChange} />
      {children}
    </TableRow>
  );
}
