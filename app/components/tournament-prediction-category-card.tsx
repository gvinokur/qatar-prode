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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import LockIcon from '@mui/icons-material/Lock';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface TournamentPredictionCategoryCardProps {
  readonly title: string;
  readonly completed: number;
  readonly total: number;
  readonly link: string;
  readonly isLocked: boolean;
}

export function TournamentPredictionCategoryCard({
  title,
  completed,
  total,
  link,
  isLocked
}: TournamentPredictionCategoryCardProps) {
  const t = useTranslations('predictions');

  // Defensive programming: clamp completed to max of total
  const safeCompleted = Math.min(completed, total);
  const percentage = total > 0 ? Math.round((safeCompleted / total) * 100) : 0;
  const isComplete = safeCompleted === total;

  // Icon logic - 16px icons
  const getCategoryStatusIcon = (): React.ReactElement => {
    if (isLocked) {
      return <LockIcon sx={{ fontSize: 16, color: 'text.disabled' }} />;
    }
    if (isComplete) {
      return <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />;
    }
    return <WarningIcon sx={{ fontSize: 16, color: 'warning.main' }} />;
  };

  // Border color logic
  const getCategoryCardBorderColor = (): string => {
    if (isLocked || isComplete) {
      return 'divider';
    }
    return 'warning.main';
  };

  // Border width logic
  const getCategoryCardBorderWidth = (): number => {
    if (isLocked || isComplete) {
      return 1;
    }
    return 2;
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
              sx={{
                bgcolor: 'grey.700',
                color: 'white',
                height: '20px',
                '& .MuiChip-icon': {
                  color: 'white',
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
