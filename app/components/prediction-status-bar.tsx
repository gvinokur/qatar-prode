'use client'

import React from 'react';
import { Box, Card, Typography, LinearProgress, Alert, Chip, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import WarningIcon from '@mui/icons-material/Warning';
import Link from 'next/link';
import { BoostCountBadge } from './boost-badge';
import { TournamentPredictionCompletion } from '../db/tables-definition';

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

  // Tournament prediction props (optional)
  readonly tournamentPredictions?: TournamentPredictionCompletion;
  readonly tournamentId?: string;
  readonly tournamentStartDate?: Date;
}

type UrgencyWarning = {
  severity: 'error' | 'warning' | 'info';
  count?: number;
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

// Build urgency warnings for tournament predictions
function buildTournamentUrgencyWarnings(
  isPredictionLocked: boolean,
  tournamentStartDate: Date | undefined,
  overallPercentage: number
): UrgencyWarning[] {
  if (isPredictionLocked || overallPercentage === 100 || !tournamentStartDate) {
    return [];
  }

  const lockTime = new Date(tournamentStartDate.getTime() + 5 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const hoursUntilLock = (lockTime.getTime() - now.getTime()) / (60 * 60 * 1000);

  if (hoursUntilLock < 0) {
    return []; // Already locked
  } else if (hoursUntilLock < 2) {
    return [{ severity: 'error', message: 'Predicciones de torneo cierran en 2 horas' }];
  } else if (hoursUntilLock < 24) {
    return [{ severity: 'warning', message: 'Predicciones de torneo cierran en 24 horas' }];
  } else if (hoursUntilLock < 48) {
    return [{ severity: 'info', message: 'Predicciones de torneo cierran en 2 días' }];
  }

  return [];
}

// Category status display component
interface CategoryStatusProps {
  title: string;
  completed: number;
  total: number;
  link?: string;
  isLocked: boolean;
}

function CategoryStatus({ title, completed, total, link, isLocked }: CategoryStatusProps) {
  const isComplete = completed === total;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      py: 0.5,
      px: 1,
      '&:hover': {
        bgcolor: 'action.hover',
        borderRadius: 1
      }
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Status Icon */}
        {isLocked ? (
          <LockIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
        ) : isComplete ? (
          <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
        ) : (
          <WarningIcon sx={{ fontSize: 16, color: 'warning.main' }} />
        )}

        {/* Title */}
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: '140px' }}>
          {title}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Count */}
        <Typography variant="body2" color="text.primary" fontWeight="medium">
          {completed}/{total} ({percentage}%)
        </Typography>

        {/* Action Button */}
        {!isComplete && !isLocked && link && (
          <Button
            component={Link}
            href={link}
            size="small"
            variant="text"
            sx={{ minWidth: 'auto', px: 1, fontSize: '0.75rem' }}
          >
            Completar
          </Button>
        )}

        {/* Lock Chip */}
        {isLocked && (
          <Chip
            icon={<LockIcon />}
            label="Cerrado"
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
    </Box>
  );
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
  noticeGames,
  tournamentPredictions,
  tournamentId,
  tournamentStartDate
}: PredictionStatusBarProps) {
  const percentage = totalGames > 0 ? Math.round((predictedGames / totalGames) * 100) : 0;
  const gameUrgencyWarnings = buildUrgencyWarnings(urgentGames, warningGames, noticeGames);
  const showBoosts = silverMax > 0 || goldenMax > 0;

  // Tournament prediction warnings
  const tournamentUrgencyWarnings = tournamentPredictions && tournamentStartDate
    ? buildTournamentUrgencyWarnings(
        tournamentPredictions.isPredictionLocked,
        tournamentStartDate,
        tournamentPredictions.overallPercentage
      )
    : [];

  const allWarnings = [...gameUrgencyWarnings, ...tournamentUrgencyWarnings];

  return (
    <Card
      variant="outlined"
      sx={{
        p: 2,
        mb: 2
      }}
    >
      {/* Game Predictions Progress Section */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: allWarnings.length > 0 || tournamentPredictions ? 2 : 0, flexWrap: 'wrap' }}>
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

      {/* Tournament Predictions Categories Section */}
      {tournamentPredictions && tournamentId && (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ mb: 1 }}>
            Predicciones de Torneo
          </Typography>

          <CategoryStatus
            title="Podio"
            completed={tournamentPredictions.finalStandings.completed}
            total={tournamentPredictions.finalStandings.total}
            link={`/tournaments/${tournamentId}/awards`}
            isLocked={tournamentPredictions.isPredictionLocked}
          />

          <CategoryStatus
            title="Premios Individuales"
            completed={tournamentPredictions.awards.completed}
            total={tournamentPredictions.awards.total}
            link={`/tournaments/${tournamentId}/awards`}
            isLocked={tournamentPredictions.isPredictionLocked}
          />

          {tournamentPredictions.qualifiers.total > 0 && (
            <CategoryStatus
              title="Clasificados"
              completed={tournamentPredictions.qualifiers.completed}
              total={tournamentPredictions.qualifiers.total}
              link={`/tournaments/${tournamentId}/playoffs`}
              isLocked={tournamentPredictions.isPredictionLocked}
            />
          )}
        </Box>
      )}

      {/* Combined Urgency Warnings Section */}
      {allWarnings.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          {allWarnings.map((warning, index) => (
            <Alert
              key={`${warning.severity}-${index}`}
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
