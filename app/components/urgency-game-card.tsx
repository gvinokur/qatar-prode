'use client'

import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  useTheme
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import type { ExtendedGameData } from '../definitions';
import type { Team } from '../db/tables-definition';
import GameCountdownDisplay from './game-countdown-display';
import { BoostBadge } from './boost-badge';
import { getThemeLogoUrl } from '../utils/theme-utils';
import { getTeamDescription } from '../utils/playoffs-rule-helper';

interface UrgencyGameCardProps {
  readonly game: ExtendedGameData;
  readonly teamsMap: Record<string, Team>;
  readonly isPredicted: boolean;
  readonly prediction?: {
    homeScore: number;
    awayScore: number;
    boostType?: 'silver' | 'golden' | null;
  };
  readonly onEdit: (game: string) => void;
  readonly disabled?: boolean;
}

export function UrgencyGameCard({
  game,
  teamsMap,
  isPredicted,
  prediction,
  onEdit,
  disabled = false
}: UrgencyGameCardProps) {
  const theme = useTheme();

  // Get team info
  const homeTeam = game.home_team ? teamsMap[game.home_team] : null;
  const awayTeam = game.away_team ? teamsMap[game.away_team] : null;

  // Get team names (fallback to descriptions for playoff games without determined teams)
  const homeTeamName = homeTeam?.short_name || getTeamDescription(game.home_team_rule);
  const awayTeamName = awayTeam?.short_name || getTeamDescription(game.away_team_rule);

  // Get team logos
  const homeLogoUrl = homeTeam ? getThemeLogoUrl(homeTeam.theme) : null;
  const awayLogoUrl = awayTeam ? getThemeLogoUrl(awayTeam.theme) : null;

  // Border color based on boost
  const getBoostBorderColor = () => {
    if (!prediction?.boostType) return theme.palette.divider;
    if (prediction.boostType === 'silver') return theme.palette.info.main;
    if (prediction.boostType === 'golden') return theme.palette.warning.main;
    return theme.palette.divider;
  };

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: getBoostBorderColor(),
        borderWidth: prediction?.boostType ? 2 : 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, flexGrow: 1 }}>
        {/* Row 1: Teams + Edit button */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexGrow: 1, minWidth: 0 }}>
            {/* Home team */}
            {homeLogoUrl && (
              <Box
                component="img"
                src={homeLogoUrl}
                alt={homeTeamName}
                sx={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }}
              />
            )}
            <Typography variant="body2" sx={{ fontWeight: 500, flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {homeTeamName}
            </Typography>

            {/* vs or - */}
            <Typography variant="body2" color="text.secondary" sx={{ mx: 0.5, flexShrink: 0 }}>
              vs
            </Typography>

            {/* Away team */}
            <Typography variant="body2" sx={{ fontWeight: 500, flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {awayTeamName}
            </Typography>
            {awayLogoUrl && (
              <Box
                component="img"
                src={awayLogoUrl}
                alt={awayTeamName}
                sx={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }}
              />
            )}
          </Box>

          {/* Edit button - top right */}
          {!disabled && (
            <IconButton
              size="small"
              onClick={() => onEdit(game.id)}
              aria-label={`Editar predicción: ${homeTeamName} vs ${awayTeamName}`}
              sx={{ ml: 0.5, flexShrink: 0 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Row 2: Score + Boost OR "vs" */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          {isPredicted && prediction ? (
            <>
              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                {prediction.homeScore} - {prediction.awayScore}
              </Typography>
              {prediction.boostType && (
                <BoostBadge type={prediction.boostType} size="small" />
              )}
            </>
          ) : (
            <Typography variant="caption" color="text.secondary">
              Sin predecir
            </Typography>
          )}
        </Box>

        {/* Row 3: Countdown */}
        <Box>
          <GameCountdownDisplay
            gameDate={game.game_date}
            gameTimezone={game.game_local_timezone}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
