'use client'

import { Box, Typography, Chip, useTheme, alpha } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useTranslations } from 'next-intl';
import { Theme } from '../db/tables-definition';
import { TeamScoreRow } from './team-score-row';

export type PredictionResult = 'exact' | 'goal_difference' | 'correct' | 'incorrect';

interface ActualResultDisplayProps {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  predictionResult?: PredictionResult; // undefined when user didn't predict
  homeTeamTheme?: Theme | null;
  awayTeamTheme?: Theme | null;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
  points?: number; // Actual points earned (includes boost multiplier)
  boostType?: 'golden' | 'silver' | null;
}

/**
 * Displays the actual result of a game with team names, scores, and prediction result badge.
 *
 * Shows:
 * - "Actual Result" label (centered)
 * - Full team names (no abbreviations)
 * - Actual scores (home - away)
 * - Team logos (if available)
 * - Penalty scores (if applicable)
 * - Prediction result badge (Exact/Correct/Incorrect) with points
 */
export function ActualResultDisplay({
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  predictionResult,
  homeTeamTheme,
  awayTeamTheme,
  homePenaltyScore,
  awayPenaltyScore,
  points,
  boostType,
}: Readonly<ActualResultDisplayProps>) {
  const t = useTranslations('predictions');
  const theme = useTheme();

  // Treat no prediction as incorrect (0 points)
  const effectiveResult = predictionResult || 'incorrect';

  // Points should always come from backend - default to 0 if not provided
  const displayPoints = points ?? 0;

  // Determine badge styling based on boost type
  const getBadgeColor = () => {
    if (effectiveResult === 'incorrect') return 'error';
    // Use boost colors for correct/exact/goal_difference predictions with boosts
    if (boostType) {
      return undefined; // Will use custom sx styling
    }
    return 'success';
  };

  const getBadgeSx = () => {
    if (effectiveResult === 'incorrect' || !boostType) return {};

    const boostColor = boostType === 'golden'
      ? theme.palette.accent.gold.main
      : theme.palette.accent.silver.main;

    return {
      backgroundColor: alpha(boostColor, 0.2),
      color: boostColor,
      '& .MuiChip-icon': {
        color: boostColor,
      },
    };
  };

  const homePenaltyWinner =
    typeof homePenaltyScore === 'number' &&
    typeof awayPenaltyScore === 'number' &&
    homePenaltyScore > awayPenaltyScore

  const awayPenaltyWinner =
    typeof homePenaltyScore === 'number' &&
    typeof awayPenaltyScore === 'number' &&
    awayPenaltyScore > homePenaltyScore

  const homeIsWinner =
    homeScore > awayScore ||
    (homeScore === awayScore && homePenaltyWinner)

  const awayIsWinner =
    awayScore > homeScore ||
    (homeScore === awayScore && awayPenaltyWinner)

  return (
    <Box sx={{ mt: 1, borderTop: (theme) => `1px solid ${theme.palette.divider}`, pt: 1, width: '100%' }}>
      {/* "Actual Result" label - centered */}
      <Typography variant="body1" align="center" sx={{ mb: 1, fontWeight: 'medium' }}>
        {t('game.actualResult')}
      </Typography>

      {/* Score display - uses shared TeamScoreRow component */}
      <TeamScoreRow
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeScore={homeScore}
        awayScore={awayScore}
        homeTeamTheme={homeTeamTheme}
        awayTeamTheme={awayTeamTheme}
        homeIsWinner={homeIsWinner}
        awayIsWinner={awayIsWinner}
      />

      {/* Penalty scores */}
      {(homePenaltyScore !== null || awayPenaltyScore !== null) && (
        <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 0.5 }}>
          ({homePenaltyScore ?? 0} - {awayPenaltyScore ?? 0} pen)
        </Typography>
      )}

      {/* Prediction Result badge - shows incorrect (0 pts) when no prediction */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
        <Chip
          label={getPredictionResultLabel(effectiveResult, displayPoints, t)}
          icon={getPredictionResultIcon(effectiveResult)}
          color={getBadgeColor()}
          size="small"
          variant="filled"
          sx={getBadgeSx()}
        />
      </Box>
    </Box>
  );
}

/**
 * Returns the translated label for a prediction result with points.
 *
 * @param result - The prediction result type
 * @param points - Actual points earned (includes boost multiplier)
 * @param t - Translation function
 * @returns Translated label string with points (e.g., "Exact (30 points)" for golden boost)
 */
function getPredictionResultLabel(
  result: PredictionResult,
  points: number,
  t: ReturnType<typeof useTranslations>
): string {
  const labels: Record<PredictionResult, string> = {
    exact: t('game.predictionResultExact', { points }),
    goal_difference: t('game.predictionResultGoalDifference', { points }),
    correct: t('game.predictionResultCorrect', { points }),
    incorrect: t('game.predictionResultIncorrect'),
  };
  return labels[result];
}

/**
 * Returns the appropriate icon for a prediction result.
 *
 * @param result - The prediction result type
 * @returns CompareArrowsIcon for goal_difference, CheckIcon for exact/correct, CloseIcon for incorrect
 */
function getPredictionResultIcon(result: PredictionResult) {
  if (result === 'incorrect') return <CloseIcon />;
  if (result === 'goal_difference') return <CompareArrowsIcon />;
  return <CheckIcon />;
}
