'use client'

import { Box, Card, Typography, LinearProgress } from '@mui/material';
import { BoostCountBadge } from './boost-badge';

interface ProgressTrackerProps {
  readonly totalGames: number;
  readonly predictedGames: number;
  readonly silverUsed: number;
  readonly silverMax: number;
  readonly goldenUsed: number;
  readonly goldenMax: number;
}

export function ProgressTracker({
  totalGames,
  predictedGames,
  silverUsed,
  silverMax,
  goldenUsed,
  goldenMax
}: ProgressTrackerProps) {
  const percentage = totalGames > 0 ? Math.round((predictedGames / totalGames) * 100) : 0;
  const showBoosts = silverMax > 0 || goldenMax > 0;

  return (
    <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          flexDirection: 'row'
        }}
      >
        {/* Predictions Label + Progress Bar Container */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexGrow: 1,
            minWidth: 0
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            fontWeight="medium"
            sx={{ whiteSpace: 'nowrap' }}
          >
            Predicciones: {predictedGames}/{totalGames} ({percentage}%)
          </Typography>

          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{
              flexGrow: 1,
              minWidth: '30px',
              height: 8,
              borderRadius: 4
            }}
          />
        </Box>

        {/* Boost chips (if enabled) */}
        {showBoosts && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            {silverMax > 0 && (
              <BoostCountBadge type="silver" used={silverUsed} max={silverMax} />
            )}
            {goldenMax > 0 && (
              <BoostCountBadge type="golden" used={goldenUsed} max={goldenMax} />
            )}
          </Box>
        )}
      </Box>
    </Card>
  );
}
