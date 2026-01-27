'use client'

import React from 'react';
import { Box, Card, Typography, LinearProgress, Alert } from '@mui/material';
import { BoostCountBadge } from './boost-badge';

interface PredictionStatusBarProps {
  readonly totalGames: number;
  readonly predictedGames: number;
  readonly silverUsed: number;
  readonly silverMax: number;
  readonly goldenUsed: number;
  readonly goldenMax: number;
  readonly urgentGames: number; // Closing within 2 hours
  readonly warningGames: number; // Closing within 2-24 hours
  readonly noticeGames: number; // Closing within 24-48 hours
}

type UrgencyWarning = {
  severity: 'error' | 'warning' | 'info';
  count: number;
  message: string;
};

// Build urgency warnings from game counts
function buildUrgencyWarnings(urgentGames: number, warningGames: number, noticeGames: number): UrgencyWarning[] {
  const warnings: UrgencyWarning[] = [];

  if (urgentGames > 0) {
    const plural = urgentGames > 1;
    warnings.push({
      severity: 'error',
      count: urgentGames,
      message: `${urgentGames} partido${plural ? 's' : ''} cierra${plural ? 'n' : ''} en 2 horas`
    });
  }

  if (warningGames > 0) {
    const plural = warningGames > 1;
    warnings.push({
      severity: 'warning',
      count: warningGames,
      message: `${warningGames} partido${plural ? 's' : ''} cierra${plural ? 'n' : ''} en 24 horas`
    });
  }

  if (noticeGames > 0) {
    const plural = noticeGames > 1;
    warnings.push({
      severity: 'info',
      count: noticeGames,
      message: `${noticeGames} partido${plural ? 's' : ''} cierra${plural ? 'n' : ''} en 2 días`
    });
  }

  return warnings;
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
  const urgencyWarnings = buildUrgencyWarnings(urgentGames, warningGames, noticeGames);
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
          {urgencyWarnings.map((warning) => (
            <Alert
              key={warning.severity}
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
