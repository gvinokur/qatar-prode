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
function TeamChip({ teamName }: { teamName: string }) {
  return (
    <Chip
      icon={<CheckCircleIcon />}
      label={teamName}
      color="success"
      variant="outlined"
      sx={{ m: 0.5 }}
    />
  );
}

/** Progress indicator component */
function ProgressIndicator({ count, max }: { count: number; max: number }) {
  const percentage = (count / max) * 100;
  const isComplete = count === max;
  const isOverLimit = count > max;

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Selected: {count} of {max}
        </Typography>
        <Typography
          variant="body2"
          fontWeight="bold"
          color={isOverLimit ? 'error' : isComplete ? 'success.main' : 'text.secondary'}
        >
          {percentage.toFixed(0)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(percentage, 100)}
        color={isOverLimit ? 'error' : isComplete ? 'success' : 'primary'}
        sx={{ height: 8, borderRadius: 1 }}
      />
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
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
          Third Place Qualifiers
        </Typography>

        <ProgressIndicator count={count} max={maxThirdPlace} />

        {isOverLimit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            You have selected {count} teams, but only {maxThirdPlace} can qualify. Please deselect{' '}
            {count - maxThirdPlace} team{count - maxThirdPlace > 1 ? 's' : ''}.
          </Alert>
        )}

        {count === 0 ? (
          <Alert severity="info">
            No third place teams selected yet. Select teams from position 3 in each group to predict which will
            qualify.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1 }}>
            {selectedThirdPlace.map(({ team }) => (
              <TeamChip key={team.id} teamName={team.name} />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
