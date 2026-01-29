'use client'

import React, { useMemo } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Grid } from './mui-wrappers';
import { UrgencyGameCard } from './urgency-game-card';
import type { ExtendedGameData } from '../definitions';
import type { Team, GameGuessNew } from '../db/tables-definition';

interface UrgencyAccordionProps {
  readonly severity: 'error' | 'warning' | 'info';
  readonly title: string;
  readonly games: ExtendedGameData[];
  readonly teamsMap: Record<string, Team>;
  readonly gameGuesses: Record<string, GameGuessNew>;
  readonly isExpanded: boolean;
  readonly onToggle: (tier: string) => void;
  readonly tierId: string;
  readonly onEditGame: (game: string) => void;
}

export function UrgencyAccordion({
  severity,
  title,
  games,
  teamsMap,
  gameGuesses,
  isExpanded,
  onToggle,
  tierId,
  onEditGame
}: UrgencyAccordionProps) {
  // Check if a game is predicted
  const isPredicted = (game: ExtendedGameData): boolean => {
    const guess = gameGuesses[game.id];
    return !!(
      guess &&
      guess.home_score != null &&
      guess.away_score != null &&
      typeof guess.home_score === 'number' &&
      typeof guess.away_score === 'number'
    );
  };

  // Group games by prediction status
  const { unpredictedGames, predictedGames } = useMemo(() => {
    const unpredicted = games.filter(g => !isPredicted(g));
    const predicted = games.filter(g => isPredicted(g));
    return { unpredictedGames: unpredicted, predictedGames: predicted };
  }, [games, gameGuesses]);

  return (
    <Accordion
      expanded={isExpanded}
      onChange={() => onToggle(tierId)}
      sx={{
        mb: 1,
        border: 1,
        borderColor: 'divider',
        '&:before': { display: 'none' },
        boxShadow: 'none'
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`${tierId}-content`}
        id={`${tierId}-header`}
        sx={{
          '&:hover': {
            bgcolor: 'action.hover'
          }
        }}
      >
        <Alert
          severity={severity}
          icon={false}
          sx={{
            width: '100%',
            py: 0,
            px: 1,
            '& .MuiAlert-message': {
              width: '100%',
              py: 0.5
            }
          }}
        >
          {title}
        </Alert>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 2 }}>
        {/* REQUIEREN ACCIÓN section */}
        {unpredictedGames.length > 0 && (
          <Box sx={{ mb: predictedGames.length > 0 ? 3 : 0 }}>
            <Typography
              variant="subtitle2"
              color="error"
              sx={{
                mb: 1.5,
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '0.75rem'
              }}
            >
              REQUIEREN ACCIÓN ({unpredictedGames.length})
            </Typography>
            <Grid container spacing={1.5}>
              {unpredictedGames.map(game => (
                <Grid key={game.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <UrgencyGameCard
                    game={game}
                    teamsMap={teamsMap}
                    isPredicted={false}
                    onEdit={onEditGame}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* YA PREDICHOS section */}
        {predictedGames.length > 0 && (
          <Box>
            <Typography
              variant="subtitle2"
              color="success.main"
              sx={{
                mb: 1.5,
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '0.75rem'
              }}
            >
              YA PREDICHOS ({predictedGames.length})
            </Typography>
            <Grid container spacing={1.5}>
              {predictedGames.map(game => {
                const guess = gameGuesses[game.id];
                return (
                  <Grid key={game.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <UrgencyGameCard
                      game={game}
                      teamsMap={teamsMap}
                      isPredicted={true}
                      prediction={guess ? {
                        homeScore: guess.home_score!,
                        awayScore: guess.away_score!,
                        boostType: guess.boost_type
                      } : undefined}
                      onEdit={onEditGame}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
