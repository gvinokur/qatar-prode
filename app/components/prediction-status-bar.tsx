'use client'

import React from 'react';
import { Box, Paper, Typography, LinearProgress, Chip, Alert } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
interface PredictionStatusBarProps {
  totalGames: number;
  predictedGames: number;
  silverUsed: number;
  silverMax: number;
  goldenUsed: number;
  goldenMax: number;
  urgentGames: number; // Closing within 2 hours
  warningGames: number; // Closing within 2-24 hours
  noticeGames: number; // Closing within 24-48 hours
}

export function PredictionStatusBar({
  totalGames,
  predictedGames,
  silverUsed,
  silverMax,
  goldenUsed,
  goldenMax,
  urgentGames,
  warningGames,
  noticeGames
}: PredictionStatusBarProps) {
  const percentage = totalGames > 0 ? Math.round((predictedGames / totalGames) * 100) : 0;

  // Build urgency warnings from counts
  const urgencyWarnings = [];
  if (urgentGames > 0) {
    urgencyWarnings.push({
      level: 'red' as const,
      count: urgentGames,
      message: `🔴 URGENT: ${urgentGames} game${urgentGames > 1 ? 's' : ''} closing within 2 hours`
    });
  }
  if (warningGames > 0) {
    urgencyWarnings.push({
      level: 'orange' as const,
      count: warningGames,
      message: `🟠 ${warningGames} game${warningGames > 1 ? 's' : ''} closing within 24 hours`
    });
  }
  if (noticeGames > 0) {
    urgencyWarnings.push({
      level: 'yellow' as const,
      count: noticeGames,
      message: `🟡 ${noticeGames} game${noticeGames > 1 ? 's' : ''} closing within 2 days`
    });
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: 2
      }}
    >
      {/* Progress Section */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: urgencyWarnings.length > 0 ? 2 : 0, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ minWidth: '140px' }}>
          Predictions: {predictedGames}/{totalGames} ({percentage}%)
        </Typography>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            flexGrow: 1,
            minWidth: '100px',
            height: 8,
            borderRadius: 4
          }}
        />
        {/* Boost chips (if enabled) */}
        {silverMax > 0 && (
          <Chip
            icon={<StarIcon />}
            label={`🥈 ${silverUsed}/${silverMax}`}
            size="small"
            sx={{
              backgroundColor: '#C0C0C0',
              color: '#000',
              fontWeight: 'medium'
            }}
          />
        )}
        {goldenMax > 0 && (
          <Chip
            icon={<EmojiEventsIcon />}
            label={`🥇 ${goldenUsed}/${goldenMax}`}
            size="small"
            sx={{
              backgroundColor: '#FFD700',
              color: '#000',
              fontWeight: 'medium'
            }}
          />
        )}
      </Box>

      {/* Urgency Warnings Section */}
      {urgencyWarnings.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {urgencyWarnings.map((warning, idx) => (
            <Alert
              key={idx}
              severity={warning.level === 'red' ? 'error' : warning.level === 'orange' ? 'warning' : 'info'}
              sx={{
                py: 0.5,
                ...(warning.level === 'yellow' && {
                  backgroundColor: '#fff4e5',
                  color: '#663c00',
                  '& .MuiAlert-icon': {
                    color: '#ffa726'
                  }
                })
              }}
            >
              {warning.message}
            </Alert>
          ))}
        </Box>
      )}
    </Paper>
  );
}
