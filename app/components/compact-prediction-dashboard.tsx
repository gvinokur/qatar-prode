'use client'

import React, { useContext, useMemo, useState } from 'react';
import { Box, LinearProgress, Typography, IconButton, Popover, Card } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import LockIcon from '@mui/icons-material/Lock';
import { BoostCountBadge } from './boost-badge';
import { TournamentPredictionCompletion, Team } from '../db/tables-definition';
import { UrgencyAccordionGroup } from './urgency-accordion-group';
import { TournamentPredictionAccordion } from './tournament-prediction-accordion';
import { GuessesContext } from './context-providers/guesses-context-provider';
import type { ExtendedGameData } from '../definitions';
import BoostInfoPopover from './boost-info-popover';

interface CompactPredictionDashboardProps {
  readonly totalGames: number;
  readonly predictedGames: number;
  readonly silverUsed: number;
  readonly silverMax: number;
  readonly goldenUsed: number;
  readonly goldenMax: number;
  readonly tournamentPredictions?: TournamentPredictionCompletion;
  readonly tournamentId?: string;
  readonly tournamentStartDate?: Date;
  readonly games?: ExtendedGameData[];
  readonly teamsMap?: Record<string, Team>;
  readonly isPlayoffs?: boolean;
}

type UrgencyLevel = 'urgent' | 'warning' | 'notice' | 'complete' | 'locked';

function getGameUrgencyLevel(
  games: ExtendedGameData[] | undefined,
  gameGuesses: Record<string, any>
): UrgencyLevel {
  if (!games || games.length === 0) return 'complete';

  const ONE_HOUR = 60 * 60 * 1000;
  const now = Date.now();

  let hasUrgent = false;
  let hasWarning = false;
  let hasNotice = false;
  let allClosed = true;
  let allPredicted = true;

  games.forEach(game => {
    const guess = gameGuesses[game.id];
    const isPredicted = guess &&
      guess.home_score != null &&
      guess.away_score != null &&
      typeof guess.home_score === 'number' &&
      typeof guess.away_score === 'number';

    if (!isPredicted) {
      allPredicted = false;
    }

    const deadline = game.game_date.getTime() - ONE_HOUR;
    const timeUntilClose = deadline - now;

    if (timeUntilClose > -ONE_HOUR) {
      allClosed = false;
    }

    if (!isPredicted && timeUntilClose > -ONE_HOUR) {
      if (timeUntilClose < 2 * ONE_HOUR) {
        hasUrgent = true;
      } else if (timeUntilClose < 24 * ONE_HOUR) {
        hasWarning = true;
      } else if (timeUntilClose < 48 * ONE_HOUR) {
        hasNotice = true;
      }
    }
  });

  if (allClosed) return 'locked';
  if (allPredicted) return 'complete';
  if (hasUrgent) return 'urgent';
  if (hasWarning) return 'warning';
  if (hasNotice) return 'notice';
  return 'complete';
}

function getTournamentUrgencyLevel(
  tournamentPredictions: TournamentPredictionCompletion | undefined,
  tournamentStartDate: Date | undefined
): UrgencyLevel {
  if (!tournamentPredictions) return 'complete';

  if (tournamentPredictions.isPredictionLocked) return 'locked';
  if (tournamentPredictions.overallPercentage === 100) return 'complete';

  if (!tournamentStartDate) return 'complete';

  const lockTime = new Date(tournamentStartDate.getTime() + 5 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const hoursUntilLock = (lockTime.getTime() - now.getTime()) / (60 * 60 * 1000);

  if (hoursUntilLock < 0) return 'locked';
  if (hoursUntilLock < 2) return 'urgent';
  if (hoursUntilLock < 24) return 'warning';
  if (hoursUntilLock < 48) return 'notice';
  return 'complete';
}

function getUrgencyIcon(level: UrgencyLevel) {
  switch (level) {
    case 'urgent':
      return <ErrorIcon sx={{ color: 'error.main', fontSize: '1.25rem' }} />;
    case 'warning':
      return <WarningIcon sx={{ color: 'warning.main', fontSize: '1.25rem' }} />;
    case 'notice':
      return <InfoIcon sx={{ color: 'info.main', fontSize: '1.25rem' }} />;
    case 'complete':
      return <CheckCircleIcon sx={{ color: 'success.main', fontSize: '1.25rem' }} />;
    case 'locked':
      return <LockIcon sx={{ color: 'action.disabled', fontSize: '1.25rem' }} />;
  }
}

export function CompactPredictionDashboard({
  totalGames,
  predictedGames,
  silverUsed,
  silverMax,
  goldenUsed,
  goldenMax,
  tournamentPredictions,
  tournamentId,
  tournamentStartDate,
  games,
  teamsMap,
  isPlayoffs = false
}: CompactPredictionDashboardProps) {
  const { gameGuesses } = useContext(GuessesContext);
  const [gamePopoverAnchor, setGamePopoverAnchor] = useState<HTMLElement | null>(null);
  const [tournamentPopoverAnchor, setTournamentPopoverAnchor] = useState<HTMLElement | null>(null);
  const [boostAnchorEl, setBoostAnchorEl] = useState<HTMLElement | null>(null);
  const [activeBoostType, setActiveBoostType] = useState<'silver' | 'golden' | null>(null);

  const gamePercentage = totalGames > 0 ? Math.round((predictedGames / totalGames) * 100) : 0;
  const showBoosts = silverMax > 0 || goldenMax > 0;

  const gameUrgencyLevel = useMemo(
    () => getGameUrgencyLevel(games, gameGuesses),
    [games, gameGuesses]
  );

  const tournamentUrgencyLevel = useMemo(
    () => getTournamentUrgencyLevel(tournamentPredictions, tournamentStartDate),
    [tournamentPredictions, tournamentStartDate]
  );

  const handleBoostClick = (event: React.MouseEvent<HTMLElement>, type: 'silver' | 'golden') => {
    event.stopPropagation();
    setBoostAnchorEl(event.currentTarget);
    setActiveBoostType(type);
  };

  const handleBoostClose = () => {
    setBoostAnchorEl(null);
    setActiveBoostType(null);
  };

  const boostPopoverOpen = Boolean(boostAnchorEl);

  return (
    <Box sx={{ mb: 2 }}>
      {/* Game Predictions Row */}
      <Box
        onClick={(e) => setGamePopoverAnchor(e.currentTarget)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 1.5,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover'
          },
          mb: 1
        }}
      >
        <Typography variant="body2" sx={{ minWidth: '140px', fontWeight: 500 }}>
          Partidos: {predictedGames}/{totalGames}
        </Typography>

        <LinearProgress
          variant="determinate"
          value={gamePercentage}
          sx={{
            flexGrow: 1,
            height: 8,
            borderRadius: 4
          }}
        />

        {showBoosts && (
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
            {silverMax > 0 && (
              <Box onClick={(e) => handleBoostClick(e, 'silver')}>
                <BoostCountBadge type="silver" used={silverUsed} max={silverMax} />
              </Box>
            )}
            {goldenMax > 0 && (
              <Box onClick={(e) => handleBoostClick(e, 'golden')}>
                <BoostCountBadge type="golden" used={goldenUsed} max={goldenMax} />
              </Box>
            )}
          </Box>
        )}

        <IconButton size="small" sx={{ p: 0.5 }}>
          {getUrgencyIcon(gameUrgencyLevel)}
        </IconButton>
      </Box>

      {/* Tournament Predictions Row */}
      {tournamentPredictions && tournamentId && (
        <Box
          onClick={(e) => setTournamentPopoverAnchor(e.currentTarget)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <Typography variant="body2" sx={{ minWidth: '140px', fontWeight: 500 }}>
            Torneo: {tournamentPredictions.overallPercentage}%
          </Typography>

          <LinearProgress
            variant="determinate"
            value={tournamentPredictions.overallPercentage}
            sx={{
              flexGrow: 1,
              height: 8,
              borderRadius: 4
            }}
          />

          <IconButton size="small" sx={{ p: 0.5 }}>
            {getUrgencyIcon(tournamentUrgencyLevel)}
          </IconButton>
        </Box>
      )}

      {/* Game Details Popover */}
      <Popover
        open={Boolean(gamePopoverAnchor)}
        anchorEl={gamePopoverAnchor}
        onClose={() => setGamePopoverAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Card sx={{ maxWidth: 600, maxHeight: '80vh', overflow: 'auto', p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Predicciones de Partidos
          </Typography>
          {games && teamsMap && tournamentId !== undefined && (
            <UrgencyAccordionGroup
              games={games}
              teamsMap={teamsMap}
              gameGuesses={gameGuesses}
              tournamentId={tournamentId}
              isPlayoffs={isPlayoffs}
              silverMax={silverMax}
              goldenMax={goldenMax}
            />
          )}
        </Card>
      </Popover>

      {/* Tournament Details Popover */}
      <Popover
        open={Boolean(tournamentPopoverAnchor)}
        anchorEl={tournamentPopoverAnchor}
        onClose={() => setTournamentPopoverAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Card sx={{ maxWidth: 600, maxHeight: '80vh', overflow: 'auto', p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Predicciones de Torneo
          </Typography>
          {tournamentPredictions && tournamentId && (
            <TournamentPredictionAccordion
              tournamentPredictions={tournamentPredictions}
              tournamentId={tournamentId}
              isExpanded={true}
              onToggle={() => {}}
            />
          )}
        </Card>
      </Popover>

      {/* Boost Information Popover */}
      {activeBoostType && (
        <BoostInfoPopover
          open={boostPopoverOpen}
          anchorEl={boostAnchorEl}
          onClose={handleBoostClose}
          boostType={activeBoostType}
          used={activeBoostType === 'silver' ? silverUsed : goldenUsed}
          max={activeBoostType === 'silver' ? silverMax : goldenMax}
          tournamentId={tournamentId}
        />
      )}
    </Box>
  );
}
