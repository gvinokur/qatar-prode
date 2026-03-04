'use client'

import { Box, Typography, Grid, Chip } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslations } from 'next-intl';
import { Theme } from '../db/tables-definition';
import { getThemeLogoUrl } from '../utils/theme-utils';

interface ActualResultDisplayProps {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  predictionResult: 'exact' | 'correct' | 'incorrect';
  homeTeamTheme?: Theme | null;
  awayTeamTheme?: Theme | null;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
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
}: ActualResultDisplayProps) {
  const t = useTranslations('predictions');

  return (
    <Box sx={{ mt: 1, borderTop: (theme) => `1px solid ${theme.palette.divider}`, pt: 1 }}>
      {/* "Actual Result" label - centered */}
      <Typography variant="body2" align="center" sx={{ mb: 1, fontWeight: 'medium' }}>
        {t('game.actualResult')}
      </Typography>

      {/* Score display with full team names */}
      <Grid container spacing={1} alignItems="center" justifyContent="center">
        {/* Home Team */}
        <Grid size={5} sx={{ textAlign: 'right' }}>
          <Typography variant="body2" fontWeight="medium" noWrap>
            {homeTeamName}
          </Typography>
          {homeTeamTheme && getThemeLogoUrl(homeTeamTheme) && (
            <Box
              component="img"
              src={getThemeLogoUrl(homeTeamTheme)!}
              alt={homeTeamName}
              sx={{ width: 24, height: 24, objectFit: 'contain', mt: 0.5 }}
            />
          )}
        </Grid>

        {/* Score */}
        <Grid size={2} sx={{ textAlign: 'center' }}>
          <Typography variant="body1" fontWeight="bold">
            {homeScore} - {awayScore}
          </Typography>
          {(homePenaltyScore !== null || awayPenaltyScore !== null) && (
            <Typography variant="caption" color="text.secondary">
              ({homePenaltyScore ?? 0} - {awayPenaltyScore ?? 0} pen)
            </Typography>
          )}
        </Grid>

        {/* Away Team */}
        <Grid size={5}>
          <Typography variant="body2" fontWeight="medium" noWrap>
            {awayTeamName}
          </Typography>
          {awayTeamTheme && getThemeLogoUrl(awayTeamTheme) && (
            <Box
              component="img"
              src={getThemeLogoUrl(awayTeamTheme)!}
              alt={awayTeamName}
              sx={{ width: 24, height: 24, objectFit: 'contain', mt: 0.5 }}
            />
          )}
        </Grid>
      </Grid>

      {/* Prediction Result badge */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
        <Chip
          label={getPredictionResultLabel(predictionResult, t)}
          icon={getPredictionResultIcon(predictionResult)}
          color={predictionResult === 'incorrect' ? 'error' : 'success'}
          size="small"
          variant="filled"
        />
      </Box>
    </Box>
  );
}

/**
 * Returns the translated label for a prediction result with points.
 *
 * @param result - The prediction result type
 * @param t - Translation function
 * @returns Translated label string with points (e.g., "✓ Exact (10 points)")
 */
function getPredictionResultLabel(
  result: 'exact' | 'correct' | 'incorrect',
  t: ReturnType<typeof useTranslations>
): string {
  // Points based on result type (matches scoring system)
  const points = result === 'exact' ? 10 : result === 'correct' ? 3 : 0;

  const labels = {
    exact: t('game.predictionResultExact', { points }),
    correct: t('game.predictionResultCorrect', { points }),
    incorrect: t('game.predictionResultIncorrect'),
  };
  return labels[result];
}

/**
 * Returns the appropriate icon for a prediction result.
 *
 * @param result - The prediction result type
 * @returns CheckIcon for exact/correct, CloseIcon for incorrect
 */
function getPredictionResultIcon(result: 'exact' | 'correct' | 'incorrect') {
  return result === 'incorrect' ? <CloseIcon /> : <CheckIcon />;
}
