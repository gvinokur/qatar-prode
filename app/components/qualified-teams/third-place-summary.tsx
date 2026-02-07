'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box, Chip, LinearProgress, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Team, QualifiedTeamPrediction } from '../../db/tables-definition';

export interface ThirdPlaceSummaryProps {
  /** All teams in the tournament */
  readonly teams: Team[];
  /** Predictions for all teams */
  readonly predictions: Map<string, QualifiedTeamPrediction>;
  /** Maximum allowed third place qualifiers */
  readonly maxThirdPlace: number;
  /** Whether third place qualification is enabled */
  readonly allowsThirdPlace: boolean;
}

/** Team chip component */
function TeamChip({ teamName }: { readonly teamName: string }) {
  return (
    <Chip
      icon={<CheckCircleIcon sx={{ fontSize: '1rem' }} />}
      label={teamName}
      color="success"
      variant="outlined"
      size="small"
    />
  );
}

/** Progress indicator component */
function ProgressIndicator({ count, max }: { readonly count: number; readonly max: number }) {
  const percentage = (count / max) * 100;
  const isComplete = count === max;
  const isOverLimit = count > max;

  // Get progress bar color based on state
  const getProgressColor = () => {
    if (isOverLimit) return 'error';
    if (isComplete) return 'success';
    return 'primary';
  };

  // Get text color based on state
  const getTextColor = () => {
    if (isOverLimit) return 'error';
    if (isComplete) return 'success.main';
    return 'text.secondary';
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 'fit-content' }}>
        {count} / {max}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={Math.min(percentage, 100)}
        color={getProgressColor()}
        sx={{ flex: 1, height: 6, borderRadius: 1 }}
      />
      <Typography
        variant="body2"
        fontWeight="bold"
        color={getTextColor()}
        sx={{ minWidth: '40px', textAlign: 'right' }}
      >
        {percentage.toFixed(0)}%
      </Typography>
    </Box>
  );
}

/**
 * Summary panel for third place qualifiers
 * Shows selected teams and progress towards max limit
 */
export default function ThirdPlaceSummary({
  teams,
  predictions,
  maxThirdPlace,
  allowsThirdPlace,
}: ThirdPlaceSummaryProps) {
  // Calculate selected third place qualifiers
  const selectedThirdPlace = useMemo(() => {
    const selected: Array<{ team: Team; prediction: QualifiedTeamPrediction }> = [];

    predictions.forEach((prediction, teamId) => {
      if (prediction.predicted_position === 3 && prediction.predicted_to_qualify) {
        const team = teams.find((t) => t.id === teamId);
        if (team) {
          selected.push({ team, prediction });
        }
      }
    });

    return selected;
  }, [teams, predictions]);

  if (!allowsThirdPlace) {
    return null;
  }

  const count = selectedThirdPlace.length;
  const isOverLimit = count > maxThirdPlace;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
            Clasificados en Tercer Lugar
          </Typography>
          <ProgressIndicator count={count} max={maxThirdPlace} />
        </Box>

        {isOverLimit && (
          <Alert severity="error" sx={{ py: 0.5, mb: 1 }}>
            <Typography variant="body2">
              Has seleccionado {count} equipos, pero solo {maxThirdPlace} pueden clasificar. Deselecciona{' '}
              {count - maxThirdPlace} equipo{count - maxThirdPlace > 1 ? 's' : ''}.
            </Typography>
          </Alert>
        )}

        {count === 0 ? (
          <Alert severity="info" sx={{ py: 0.5 }}>
            <Typography variant="body2">
              Aún no has seleccionado equipos de tercer lugar. Selecciona equipos desde la posición 3 en cada grupo para predecir cuáles clasificarán.
            </Typography>
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selectedThirdPlace.map(({ team }) => (
              <TeamChip key={team.id} teamName={team.name} />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
