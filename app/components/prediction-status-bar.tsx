'use client'

import React, { useContext, useMemo, useState, useEffect } from 'react';
import { Box, Card, Typography, LinearProgress, Alert } from '@mui/material';
import { BoostCountBadge } from './boost-badge';
import { TournamentPredictionCompletion, Team } from '../db/tables-definition';
import { UrgencyAccordionGroup } from './urgency-accordion-group';
import { TournamentPredictionAccordion } from './tournament-prediction-accordion';
import { GuessesContext } from './context-providers/guesses-context-provider';
import type { ExtendedGameData } from '../definitions';
import BoostInfoPopover from './boost-info-popover';

interface PredictionStatusBarProps {
  readonly totalGames: number;
  readonly predictedGames: number;
  readonly silverUsed: number;
  readonly silverMax: number;
  readonly goldenUsed: number;
  readonly goldenMax: number;

  // Tournament prediction props (optional)
  readonly tournamentPredictions?: TournamentPredictionCompletion;
  readonly tournamentId?: string;
  readonly tournamentStartDate?: Date;

  // New optional props for accordion support
  readonly games?: ExtendedGameData[];
  readonly teamsMap?: Record<string, Team>;
  readonly isPlayoffs?: boolean;
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
export function PredictionStatusBar({
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
}: PredictionStatusBarProps) {
  const percentage = totalGames > 0 ? Math.round((predictedGames / totalGames) * 100) : 0;
  const showBoosts = silverMax > 0 || goldenMax > 0;

  // Get gameGuesses from context for accordion
  const { gameGuesses } = useContext(GuessesContext);

  // Tournament accordion state
  const [tournamentAccordionExpanded, setTournamentAccordionExpanded] = useState(false);

  // Boost badge popover state
  const [boostAnchorEl, setBoostAnchorEl] = useState<HTMLElement | null>(null);
  const [activeBoostType, setActiveBoostType] = useState<'silver' | 'golden' | null>(null);

  const handleBoostClick = (event: React.MouseEvent<HTMLElement>, type: 'silver' | 'golden') => {
    setBoostAnchorEl(event.currentTarget);
    setActiveBoostType(type);
  };

  const handleBoostClose = () => {
    setBoostAnchorEl(null);
    setActiveBoostType(null);
  };

  const boostPopoverOpen = Boolean(boostAnchorEl);

  // Auto-expand tournament accordion on mount if incomplete and unlocked
  useEffect(() => {
    if (tournamentPredictions) {
      // Auto-expand if incomplete AND unlocked
      const shouldExpand =
        !tournamentPredictions.isPredictionLocked &&
        tournamentPredictions.overallPercentage < 100;

      setTournamentAccordionExpanded(shouldExpand);
    }
  }, []); // Only run on mount - INTENTIONAL empty deps array

  // Determine if we should show accordions (all required props provided)
  const showAccordions = games && teamsMap && tournamentId !== undefined;

  // Calculate urgency counts from games array for static alert fallback
  // Only calculate when we don't have accordions but do have games data
  const { urgentGames, warningGames, noticeGames } = useMemo(() => {
    if (!games || showAccordions) {
      return { urgentGames: 0, warningGames: 0, noticeGames: 0 };
    }

    const ONE_HOUR = 60 * 60 * 1000;
    const now = Date.now();
    let urgent = 0;
    let warning = 0;
    let notice = 0;

    games.forEach(game => {
      const guess = gameGuesses[game.id];
      const isPredicted = guess &&
        guess.home_score != null &&
        guess.away_score != null &&
        typeof guess.home_score === 'number' &&
        typeof guess.away_score === 'number';

      if (isPredicted) return;

      const deadline = game.game_date.getTime() - ONE_HOUR;
      const timeUntilClose = deadline - now;

      if (timeUntilClose < 2 * ONE_HOUR && timeUntilClose > -ONE_HOUR) {
        urgent++;
      } else if (timeUntilClose >= 2 * ONE_HOUR && timeUntilClose < 24 * ONE_HOUR) {
        warning++;
      } else if (timeUntilClose >= 24 * ONE_HOUR && timeUntilClose < 48 * ONE_HOUR) {
        notice++;
      }
    });

    return { urgentGames: urgent, warningGames: warning, noticeGames: notice };
  }, [games, gameGuesses, showAccordions]);

  const gameUrgencyWarnings = buildUrgencyWarnings(urgentGames, warningGames, noticeGames);

  // Tournament prediction warnings
  const tournamentUrgencyWarnings = tournamentPredictions && tournamentStartDate
    ? buildTournamentUrgencyWarnings(
        tournamentPredictions.isPredictionLocked,
        tournamentStartDate,
        tournamentPredictions.overallPercentage
      )
    : [];

  const allWarnings = [...gameUrgencyWarnings, ...tournamentUrgencyWarnings];

  // Render urgency warnings section
  const renderUrgencySection = () => {
    if (showAccordions) {
      return (
        <UrgencyAccordionGroup
          games={games}
          teamsMap={teamsMap}
          gameGuesses={gameGuesses}
          tournamentId={tournamentId}
          isPlayoffs={isPlayoffs}
          silverMax={silverMax}
          goldenMax={goldenMax}
        />
      );
    }

    if (allWarnings.length > 0) {
      return (
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
      );
    }

    return null;
  };

  return (
    <Card
      variant="outlined"
      sx={{
        p: 2,
        mb: 2
      }}
    >
      {/* Game Predictions Progress Section */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          mb: allWarnings.length > 0 || tournamentPredictions ? 2 : 0,
          // Single line for all screen sizes
          flexDirection: 'row'
        }}
      >
        {/* Predictions Label + Progress Bar Container */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexGrow: 1,
            minWidth: 0
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            fontWeight="medium"
            sx={{ whiteSpace: 'nowrap' }}
          >
            Predicciones: {predictedGames}/{totalGames}
          </Typography>

          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{
              flexGrow: 1,
              minWidth: '30px',
              height: 8,
              borderRadius: 4
            }}
          />
        </Box>

        {/* Boost chips (if enabled) - no label to save space */}
        {showBoosts && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            {silverMax > 0 && (
              <Box
                onClick={(e) => handleBoostClick(e, 'silver')}
                sx={{ cursor: 'pointer' }}
              >
                <BoostCountBadge type="silver" used={silverUsed} max={silverMax} />
              </Box>
            )}
            {goldenMax > 0 && (
              <Box
                onClick={(e) => handleBoostClick(e, 'golden')}
                sx={{ cursor: 'pointer' }}
              >
                <BoostCountBadge type="golden" used={goldenUsed} max={goldenMax} />
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Tournament Predictions Accordion */}
      {tournamentPredictions && tournamentId && (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <TournamentPredictionAccordion
            tournamentPredictions={tournamentPredictions}
            tournamentId={tournamentId}
            isExpanded={tournamentAccordionExpanded}
            onToggle={() => setTournamentAccordionExpanded(prev => !prev)}
          />
        </Box>
      )}

      {/* Combined Urgency Warnings Section */}
      {renderUrgencySection()}

      {/* Boost information popover */}
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
    </Card>
  );
}
