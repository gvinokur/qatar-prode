'use client'

import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Chip
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getCategoryUrgencyLevel, getUrgencyIcon, URGENCY_COLOR_MAP } from './urgency-helpers';

interface TournamentPredictionCategoryCardProps {
  readonly title: string;
  readonly completed: number;
  readonly total: number;
  readonly link: string;
  readonly isLocked: boolean;
  readonly tournamentStartDate?: Date;
}

export function TournamentPredictionCategoryCard({
  title,
  completed,
  total,
  link,
  isLocked,
  tournamentStartDate
}: TournamentPredictionCategoryCardProps) {
  const t = useTranslations('predictions');

  // Defensive programming: clamp completed to max of total
  const safeCompleted = Math.min(completed, total);
  const percentage = total > 0 ? Math.round((safeCompleted / total) * 100) : 0;
  const isComplete = safeCompleted === total;

  // Calculate urgency level
  const urgencyLevel = getCategoryUrgencyLevel(
    safeCompleted,
    total,
    isLocked,
    tournamentStartDate
  );

  // Icon logic - 16px icons with proper colors
  const getCategoryStatusIcon = (): React.ReactElement => {
    const icon = getUrgencyIcon(urgencyLevel);
    // Clone icon with fontSize and explicit color in sx to ensure proper styling
    return React.cloneElement(icon, {
      sx: { fontSize: 16, color: URGENCY_COLOR_MAP[urgencyLevel] }
    });
  };

  // Border color logic
  const getCategoryCardBorderColor = (): string => {
    switch (urgencyLevel) {
      case 'urgent': return 'error.main';
      case 'warning': return 'warning.main';
      case 'notice': return 'info.main';
      case 'complete': return 'divider';
      case 'locked': return 'divider';
    }
  };

  // Border width logic
  const getCategoryCardBorderWidth = (): number => {
    // Thicker border for urgent/warning to draw attention
    return (urgencyLevel === 'urgent' || urgencyLevel === 'warning') ? 2 : 1;
  };

  // ARIA label for accessibility
  const cardAriaLabel = `${title}: ${safeCompleted} ${t('common.of')} ${total} ${t('common.completed', { count: safeCompleted })}`;

  return (
    <Card
      variant="outlined"
      aria-label={cardAriaLabel}
      sx={{
        borderColor: getCategoryCardBorderColor(),
        borderWidth: getCategoryCardBorderWidth()
      }}
    >
      <CardContent
        sx={{
          p: 1.5,
          '&:last-child': { pb: 1.5 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        {/* Left: Icon + Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          {getCategoryStatusIcon()}
          <Typography
            variant="body2"
            color={isLocked ? 'text.disabled' : 'text.secondary'}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {title}
          </Typography>
        </Box>

        {/* Right: Count + Action */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.primary" fontWeight="medium">
            {safeCompleted}/{total} ({percentage}%)
          </Typography>

          {/* Ir button - only for incomplete + unlocked */}
          {!isComplete && !isLocked && (
            <Button
              component={Link}
              href={link}
              size="small"
              variant="outlined"
              aria-label={t('navigation.goTo', { destination: title.toLowerCase() })}
              sx={{ minWidth: 'auto', fontSize: '0.75rem' }}
            >
              {t('navigation.go')}
            </Button>
          )}

          {/* Cerrado chip - only for locked */}
          {isLocked && (
            <Chip
              icon={<LockIcon />}
              label={t('game.closed')}
              size="small"
              color="info"
              sx={{
                height: '20px',
                '& .MuiChip-icon': {
                  fontSize: 14
                }
              }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
