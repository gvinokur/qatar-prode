'use client'

import { useState, useEffect } from 'react';
import { Box, Chip, Paper, Typography } from '@mui/material';
import { EmojiEvents as TrophyIcon, Star as StarIcon } from '@mui/icons-material';
import { getBoostCountsAction } from '../actions/game-boost-actions';

interface BoostCountsSummaryProps {
  tournamentId: string;
}

export default function BoostCountsSummary({ tournamentId }: BoostCountsSummaryProps) {
  const [boostCounts, setBoostCounts] = useState<{
    silver: { used: number; max: number };
    golden: { used: number; max: number };
  } | null>(null);

  useEffect(() => {
    const fetchBoostCounts = async () => {
      try {
        const counts = await getBoostCountsAction(tournamentId);
        setBoostCounts(counts);
      } catch (error) {
        console.error('Error fetching boost counts:', error);
      }
    };
    fetchBoostCounts();
  }, [tournamentId]);

  // Don't render if boosts are disabled for this tournament
  if (!boostCounts || (boostCounts.silver.max === 0 && boostCounts.golden.max === 0)) {
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
              backgroundColor: boostCounts.silver.used >= boostCounts.silver.max ? 'rgba(192, 192, 192, 0.1)' : 'rgba(192, 192, 192, 0.2)',
              color: '#C0C0C0',
              fontWeight: 'bold',
              '& .MuiChip-icon': {
                color: '#C0C0C0'
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
              backgroundColor: boostCounts.golden.used >= boostCounts.golden.max ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 215, 0, 0.2)',
              color: '#FFD700',
              fontWeight: 'bold',
              '& .MuiChip-icon': {
                color: '#FFD700'
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
