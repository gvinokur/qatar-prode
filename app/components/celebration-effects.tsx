'use client';

import { motion } from 'framer-motion';
import { Box } from '@mui/material';
import { EmojiEvents as TrophyIcon } from '@mui/icons-material';

interface ConfettiEffectProps {
  show: boolean;
  color?: string;
}

/**
 * Confetti animation using framer-motion particles
 * Triggers briefly when points > 0
 */
export function ConfettiEffect({ show, color = '#FFD700' }: ConfettiEffectProps) {
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
            backgroundColor: color,
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
export function TrophyBounce({ show, boostType }: TrophyBounceProps) {
  if (!show) return null;

  const color = boostType === 'golden' ? '#FFD700' : '#C0C0C0';

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
