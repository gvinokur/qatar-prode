'use client';

import { motion } from 'framer-motion';
import { Box, useTheme } from '@mui/material';
import { EmojiEvents as TrophyIcon, SentimentVeryDissatisfied as SobIcon, CheckCircle as CheckIcon } from '@mui/icons-material';

interface ConfettiEffectProps {
  show: boolean;
  color?: string;
}

/**
 * Confetti animation using framer-motion particles
 * Triggers briefly when points > 0
 */
export function ConfettiEffect({ show, color }: Readonly<ConfettiEffectProps>) {
  const theme = useTheme();
  const confettiColor = color ?? theme.palette.accent.gold.main;

  if (!show) return null;

  const particles = Array.from({ length: 12 }, (_, i) => i);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {particles.map((i) => (
        <motion.div
          key={i}
          initial={{
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0,
          }}
          animate={{
            opacity: 0,
            scale: 0.3,
            x: Math.cos((i * 2 * Math.PI) / particles.length) * 60,
            y: Math.sin((i * 2 * Math.PI) / particles.length) * 60,
          }}
          transition={{
            duration: 0.8,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: confettiColor,
          }}
        />
      ))}
    </Box>
  );
}

interface TrophyBounceProps {
  show: boolean;
  boostType: 'silver' | 'golden';
}

/**
 * Trophy bounce animation for boosted scores
 */
export function TrophyBounce({ show, boostType }: Readonly<TrophyBounceProps>) {
  const theme = useTheme();

  if (!show) return null;

  const color = boostType === 'golden' ? theme.palette.accent.gold.main : theme.palette.accent.silver.main;

  return (
    <motion.div
      initial={{ scale: 1, y: 0 }}
      animate={{
        scale: [1, 1.3, 1],
        y: [0, -8, 0],
      }}
      transition={{
        duration: 0.6,
        ease: 'easeInOut',
        times: [0, 0.5, 1],
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <TrophyIcon
        sx={{
          fontSize: 16,
          color,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
        }}
      />
    </motion.div>
  );
}

interface SobEffectProps {
  show: boolean;
  color?: string;
}

/**
 * Sob emoji animation for zero-point scores
 * Shows a wobble/shake effect with sad face
 */
export function SobEffect({ show, color = 'white' }: Readonly<SobEffectProps>) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ rotate: 0 }}
      animate={{
        rotate: [-5, 5, -5, 5, 0],
      }}
      transition={{
        duration: 0.8,
        ease: 'easeInOut',
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <SobIcon
        sx={{
          fontSize: 16,
          color,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
        }}
      />
    </motion.div>
  );
}

interface CheckEffectProps {
  show: boolean;
  color?: string;
}

/**
 * Check animation for regular win scores
 * Shows a bounce effect with checkmark icon
 */
export function CheckEffect({ show, color = 'white' }: Readonly<CheckEffectProps>) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ scale: 1, y: 0 }}
      animate={{
        scale: [1, 1.3, 1],
        y: [0, -8, 0],
      }}
      transition={{
        duration: 0.6,
        ease: 'easeInOut',
        times: [0, 0.5, 1],
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <CheckIcon
        sx={{
          fontSize: 16,
          color,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
        }}
      />
    </motion.div>
  );
}
