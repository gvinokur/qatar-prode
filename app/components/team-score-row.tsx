'use client'

import { Box, Typography, Grid } from '@mui/material';
import { Theme } from '../db/tables-definition';
import { getThemeLogoUrl } from '../utils/theme-utils';

interface TeamScoreRowProps {
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number | string; // number or '-' for no prediction
  awayScore?: number | string;
  homeTeamTheme?: Theme | null;
  awayTeamTheme?: Theme | null;
  homePenaltyWinner?: boolean;
  awayPenaltyWinner?: boolean;
  onClick?: () => void;
  clickable?: boolean;
}

/**
 * Displays a team score row with team names, logos, and scores.
 * Used for both user predictions and actual results to ensure identical layout.
 */
export function TeamScoreRow({
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  homeTeamTheme,
  awayTeamTheme,
  homePenaltyWinner,
  awayPenaltyWinner,
  onClick,
  clickable = false,
}: Readonly<TeamScoreRowProps>) {
  const homeLogoUrl = homeTeamTheme ? getThemeLogoUrl(homeTeamTheme) : null;
  const awayLogoUrl = awayTeamTheme ? getThemeLogoUrl(awayTeamTheme) : null;

  const hasScores = homeScore !== undefined && awayScore !== undefined;

  return (
    <Grid
      container
      spacing={1}
      sx={clickable ? { cursor: 'pointer' } : {}}
      onClick={onClick}
      width="100%"
    >
      {/* Home team */}
      <Grid display="flex" justifyContent="flex-end" alignItems="center" size={5}>
        <Typography
          variant="body1"
          fontWeight="medium"
          sx={{
            ml: 1,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {homeTeamName}
        </Typography>
        {homeLogoUrl && (
          <Box
            component="img"
            src={homeLogoUrl}
            alt={homeTeamName}
            sx={{ width: 24, height: 24, objectFit: 'contain', ml: 0.75 }}
          />
        )}
        {homePenaltyWinner && '(x)'}
      </Grid>

      {/* Score */}
      <Grid display="flex" justifyContent="center" alignItems="center" size={2}>
        {hasScores ? (
          <Typography variant="body1" fontWeight="bold">
            {homeScore} - {awayScore}
          </Typography>
        ) : (
          <Typography variant="body1" color="text.secondary">
            vs
          </Typography>
        )}
      </Grid>

      {/* Away team */}
      <Grid display="flex" justifyContent="flex-start" alignItems="center" size={5}>
        {awayPenaltyWinner && '(x)'}
        {awayLogoUrl && (
          <Box
            component="img"
            src={awayLogoUrl}
            alt={awayTeamName}
            sx={{ width: 24, height: 24, objectFit: 'contain', mr: 0.75 }}
          />
        )}
        <Typography
          variant="body1"
          fontWeight="medium"
          sx={{
            mr: 1,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {awayTeamName}
        </Typography>
      </Grid>
    </Grid>
  );
}
