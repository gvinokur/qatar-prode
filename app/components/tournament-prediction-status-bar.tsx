'use client'

import React from 'react';
import { Box, Card, Typography, LinearProgress, Alert, Chip } from '@mui/material';
import Link from 'next/link';
import { TournamentPredictionCompletion } from '../db/tables-definition';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import LockIcon from '@mui/icons-material/Lock';

interface TournamentPredictionStatusBarProps {
  readonly completion: TournamentPredictionCompletion;
  readonly tournamentId: string;
}

interface CategoryStatusProps {
  readonly title: string;
  readonly completed: number;
  readonly total: number;
  readonly link: string;
  readonly isLocked: boolean;
}

function CategoryStatus({ title, completed, total, link, isLocked }: CategoryStatusProps) {
  const isComplete = completed === total;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 0.5,
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
        {isComplete ? (
          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
        ) : isLocked ? (
          <LockIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
        ) : (
          <WarningIcon sx={{ color: 'warning.main', fontSize: 20 }} />
        )}
        <Typography
          variant="body2"
          sx={{
            color: isComplete ? 'success.main' : isLocked ? 'text.disabled' : 'text.primary',
            fontWeight: isComplete ? 600 : 400,
          }}
        >
          {title}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography
          variant="body2"
          sx={{
            color: isComplete ? 'success.main' : 'text.secondary',
            fontWeight: 500,
            minWidth: '60px',
            textAlign: 'right',
          }}
        >
          {completed}/{total} ({percentage}%)
        </Typography>
        {!isComplete && !isLocked && (
          <Link href={link} style={{ textDecoration: 'none' }}>
            <Chip
              label="Completar"
              size="small"
              clickable
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            />
          </Link>
        )}
      </Box>
    </Box>
  );
}

export function TournamentPredictionStatusBar({
  completion,
  tournamentId,
}: TournamentPredictionStatusBarProps) {
  const { finalStandings, awards, qualifiers, overallCompleted, overallTotal, overallPercentage, isPredictionLocked } = completion;

  return (
    <Card
      variant="outlined"
      sx={{
        p: 2,
        mb: 2,
      }}
    >
      {/* Overall Progress Section */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ minWidth: '200px' }}>
            Predicciones Torneo: {overallCompleted}/{overallTotal} ({overallPercentage}%)
          </Typography>
          {isPredictionLocked && (
            <Chip
              icon={<LockIcon />}
              label="Cerrado"
              size="small"
              sx={{
                bgcolor: 'grey.300',
                color: 'text.secondary',
              }}
            />
          )}
        </Box>
        <LinearProgress
          variant="determinate"
          value={overallPercentage}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              bgcolor: overallPercentage === 100 ? 'success.main' : 'primary.main',
            },
          }}
        />
      </Box>

      {/* Category Details Section */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <CategoryStatus
          title="Podio"
          completed={finalStandings.completed}
          total={finalStandings.total}
          link={`/tournaments/${tournamentId}/awards`}
          isLocked={isPredictionLocked}
        />
        <CategoryStatus
          title="Premios Individuales"
          completed={awards.completed}
          total={awards.total}
          link={`/tournaments/${tournamentId}/awards`}
          isLocked={isPredictionLocked}
        />
        {qualifiers.total > 0 && (
          <CategoryStatus
            title="Clasificados"
            completed={qualifiers.completed}
            total={qualifiers.total}
            link={`/tournaments/${tournamentId}/playoffs`}
            isLocked={isPredictionLocked}
          />
        )}
      </Box>

      {/* Alert for incomplete predictions */}
      {overallPercentage < 100 && !isPredictionLocked && (
        <Alert severity="warning" sx={{ mt: 2, py: 0.5 }}>
          Completa tus predicciones de torneo antes del cierre (5 días después del inicio)
        </Alert>
      )}
    </Card>
  );
}
