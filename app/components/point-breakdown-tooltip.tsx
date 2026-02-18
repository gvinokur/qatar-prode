'use client';

import {
  Box,
  Popover,
  Typography,
  Divider,
  Stack,
  useTheme,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { formatBoostText, BoostType } from '../utils/point-calculator';

interface PointBreakdownTooltipProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  baseScore: number;
  multiplier: number;
  finalScore: number;
  scoreDescription: string;
  boostType: BoostType;
}

/**
 * Detailed point breakdown tooltip/popover
 * Shows base score, boost multiplier, and total
 */
export default function PointBreakdownTooltip({
  anchorEl,
  open,
  onClose,
  baseScore,
  multiplier,
  finalScore,
  scoreDescription,
  boostType,
}: Readonly<PointBreakdownTooltipProps>) {
  const t = useTranslations('predictions');
  const theme = useTheme();

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      sx={{
        '& .MuiPopover-paper': {
          minWidth: 200,
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          {t('pointBreakdown.title')}
        </Typography>

        <Divider sx={{ my: 1 }} />

        <Stack spacing={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {t('pointBreakdown.base')}
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {baseScore} {baseScore === 1 ? t('points.singularFull') : t('points.pluralFull')}
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
                sx={{ ml: 0.5 }}
              >
                ({scoreDescription})
              </Typography>
            </Typography>
          </Box>

          {boostType && (
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {t('pointBreakdown.multiplier')}
              </Typography>
              <Typography
                variant="body2"
                fontWeight="medium"
                sx={{
                  color: boostType === 'golden' ? theme.palette.accent.gold.main : theme.palette.accent.silver.main,
                }}
              >
                {multiplier}x ({formatBoostText(boostType)})
              </Typography>
            </Box>
          )}

          <Divider />

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" fontWeight="bold">
              {t('pointBreakdown.total')}
            </Typography>
            <Typography
              variant="body1"
              fontWeight="bold"
              color="success.main"
              sx={{ fontSize: '1.1rem' }}
            >
              {finalScore} {finalScore === 1 ? t('points.singularFull') : t('points.pluralFull')}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Popover>
  );
}
