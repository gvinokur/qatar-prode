'use client'

import React from 'react';
import { Box, Card, Typography, LinearProgress, Alert } from '@mui/material';
import { BoostCountBadge } from './boost-badge';

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
      severity: 'error' as const,
      count: urgentGames,
      message: `${urgentGames} partido${urgentGames > 1 ? 's' : ''} cierra${urgentGames > 1 ? 'n' : ''} en 2 horas`
    });
  }
  if (warningGames > 0) {
    urgencyWarnings.push({
      severity: 'warning' as const,
      count: warningGames,
      message: `${warningGames} partido${warningGames > 1 ? 's' : ''} cierra${warningGames > 1 ? 'n' : ''} en 24 horas`
    });
  }
  if (noticeGames > 0) {
    urgencyWarnings.push({
      severity: 'info' as const,
      count: noticeGames,
      message: `${noticeGames} partido${noticeGames > 1 ? 's' : ''} cierra${noticeGames > 1 ? 'n' : ''} en 2 días`
    });
  }

  const showBoosts = silverMax > 0 || goldenMax > 0;

  return (
    <Card
      variant="outlined"
      sx={{
        p: 2,
        mb: 2
      }}
    >
      {/* Progress Section */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: urgencyWarnings.length > 0 ? 2 : 0, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ minWidth: '160px' }}>
          Predicciones: {predictedGames}/{totalGames} ({percentage}%)
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
        {showBoosts && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ mr: 0.5 }}>
              Multiplicadores:
            </Typography>
            {silverMax > 0 && (
              <BoostCountBadge type="silver" used={silverUsed} max={silverMax} />
            )}
            {goldenMax > 0 && (
              <BoostCountBadge type="golden" used={goldenUsed} max={goldenMax} />
            )}
          </Box>
        )}
      </Box>

      {/* Urgency Warnings Section */}
      {urgencyWarnings.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {urgencyWarnings.map((warning, idx) => (
            <Alert
              key={idx}
              severity={warning.severity}
              sx={{ py: 0.5 }}
            >
              {warning.message}
            </Alert>
          ))}
        </Box>
      )}
    </Card>
  );
}
