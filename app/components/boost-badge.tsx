'use client'

import { Chip } from '@mui/material';
import { EmojiEvents as TrophyIcon, Star as StarIcon } from '@mui/icons-material';

interface BoostBadgeProps {
  type: 'silver' | 'golden';
  showIcon?: boolean;
  size?: 'small' | 'medium';
}

/**
 * Reusable boost badge component matching the styling from GameView cards
 * Silver: ⭐ 2x (gray)
 * Golden: 🏆 3x (gold)
 */
export function BoostBadge({ type, showIcon = true, size = 'small' }: BoostBadgeProps) {
  const isSilver = type === 'silver';
  const multiplier = isSilver ? '2x' : '3x';
  const color = isSilver ? '#C0C0C0' : '#FFD700';
  const backgroundColor = isSilver ? 'rgba(192, 192, 192, 0.2)' : 'rgba(255, 215, 0, 0.2)';
  const Icon = isSilver ? StarIcon : TrophyIcon;

  return (
    <Chip
      icon={showIcon ? <Icon sx={{ fontSize: 14 }} /> : undefined}
      label={multiplier}
      size={size}
      sx={{
        height: '20px',
        backgroundColor,
        color,
        fontWeight: 'bold',
        fontSize: '0.7rem',
        '& .MuiChip-icon': {
          color
        }
      }}
    />
  );
}

interface BoostCountBadgeProps {
  type: 'silver' | 'golden';
  used: number;
  max: number;
}

/**
 * Boost count badge for dashboard: shows "⭐ 2x: 3/5" format
 */
export function BoostCountBadge({ type, used, max }: BoostCountBadgeProps) {
  const isSilver = type === 'silver';
  const multiplier = isSilver ? '2x' : '3x';
  const color = isSilver ? '#C0C0C0' : '#FFD700';
  const backgroundColor = isSilver ? 'rgba(192, 192, 192, 0.2)' : 'rgba(255, 215, 0, 0.2)';
  const Icon = isSilver ? StarIcon : TrophyIcon;

  return (
    <Chip
      icon={<Icon sx={{ fontSize: 14 }} />}
      label={`${multiplier}: ${used}/${max}`}
      size="small"
      sx={{
        height: '24px',
        backgroundColor,
        color,
        fontWeight: 'medium',
        fontSize: '0.75rem',
        '& .MuiChip-icon': {
          color
        }
      }}
    />
  );
}
