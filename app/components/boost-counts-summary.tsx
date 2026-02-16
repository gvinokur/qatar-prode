'use client'

import { useContext } from 'react';
import { Box, Chip, Paper, Typography, useTheme, alpha } from '@mui/material';
import { EmojiEvents as TrophyIcon, Star as StarIcon } from '@mui/icons-material';
import { GuessesContext } from './context-providers/guesses-context-provider';

interface BoostCountsSummaryProps {
  tournamentId: string;
}

export default function BoostCountsSummary({ tournamentId: _tournamentId }: BoostCountsSummaryProps) {
  const theme = useTheme();
  const { boostCounts } = useContext(GuessesContext);

  // Don't render if boosts are disabled for this tournament
  if (boostCounts.silver.max === 0 && boostCounts.golden.max === 0) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary" fontWeight="medium">
          Boosts Available:
        </Typography>
        {boostCounts.silver.max > 0 && (
          <Chip
            icon={<StarIcon />}
            label={`Silver: ${boostCounts.silver.max - boostCounts.silver.used} / ${boostCounts.silver.max}`}
            size="small"
            sx={{
              backgroundColor: boostCounts.silver.used >= boostCounts.silver.max ? alpha(theme.palette.accent.silver.main, 0.1) : alpha(theme.palette.accent.silver.main, 0.2),
              color: theme.palette.accent.silver.main,
              fontWeight: 'bold',
              '& .MuiChip-icon': {
                color: theme.palette.accent.silver.main
              }
            }}
          />
        )}
        {boostCounts.golden.max > 0 && (
          <Chip
            icon={<TrophyIcon />}
            label={`Golden: ${boostCounts.golden.max - boostCounts.golden.used} / ${boostCounts.golden.max}`}
            size="small"
            sx={{
              backgroundColor: boostCounts.golden.used >= boostCounts.golden.max ? alpha(theme.palette.accent.gold.main, 0.1) : alpha(theme.palette.accent.gold.main, 0.2),
              color: theme.palette.accent.gold.main,
              fontWeight: 'bold',
              '& .MuiChip-icon': {
                color: theme.palette.accent.gold.main
              }
            }}
          />
        )}
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          Select boosts when editing your predictions
        </Typography>
      </Box>
    </Paper>
  );
}
