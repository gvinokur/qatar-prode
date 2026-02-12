'use client'

import React, { useContext, useMemo, useState, useRef } from 'react';
import { Box } from '@mui/material';
import { TournamentPredictionCompletion, Team } from '../db/tables-definition';
import { GuessesContext } from './context-providers/guesses-context-provider';
import type { ExtendedGameData } from '../definitions';
import BoostInfoPopover from './boost-info-popover';
import { PredictionProgressRow } from './prediction-progress-row';
import { GameDetailsPopover } from './game-details-popover';
import { TournamentDetailsPopover } from './tournament-details-popover';
import {
  getGameUrgencyLevel,
  getTournamentUrgencyLevel,
  hasUrgentGames as checkUrgentGames
} from './urgency-helpers';

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
  readonly demoMode?: boolean;
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
  isPlayoffs = false,
  demoMode = false
}: CompactPredictionDashboardProps) {
  const { gameGuesses } = useContext(GuessesContext);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [gamePopoverAnchor, setGamePopoverAnchor] = useState<HTMLElement | null>(null);
  const [tournamentPopoverAnchor, setTournamentPopoverAnchor] = useState<HTMLElement | null>(null);
  const [boostAnchorEl, setBoostAnchorEl] = useState<HTMLElement | null>(null);
  const [activeBoostType, setActiveBoostType] = useState<'silver' | 'golden' | null>(null);
  const [dashboardWidth, setDashboardWidth] = useState<number>(600);

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

  // Check if there are no urgent games (within 48 hours)
  const urgentGames = useMemo(
    () => checkUrgentGames(games, gameGuesses),
    [games, gameGuesses]
  );

  // Get dashboard width on mount and resize
  React.useEffect(() => {
    const updateWidth = () => {
      if (dashboardRef.current) {
        setDashboardWidth(dashboardRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <Box ref={dashboardRef} sx={{ mb: 2 }}>
      {/* Game Predictions Row */}
      <PredictionProgressRow
        label="Partidos"
        currentValue={predictedGames}
        maxValue={totalGames}
        percentage={gamePercentage}
        urgencyLevel={gameUrgencyLevel}
        onClick={demoMode ? () => {} : (e) => setGamePopoverAnchor(e.currentTarget)}
        showBoosts={showBoosts}
        silverUsed={silverUsed}
        silverMax={silverMax}
        goldenUsed={goldenUsed}
        goldenMax={goldenMax}
        onBoostClick={demoMode ? undefined : handleBoostClick}
      />

      {/* Tournament Predictions Row */}
      {tournamentPredictions && tournamentId && (
        <PredictionProgressRow
          label="Torneo"
          currentValue={tournamentPredictions.overallPercentage}
          percentage={tournamentPredictions.overallPercentage}
          urgencyLevel={tournamentUrgencyLevel}
          onClick={demoMode ? () => {} : (e) => setTournamentPopoverAnchor(e.currentTarget)}
          marginBottom={0}
        />
      )}

      {/* Game Details Popover */}
      <GameDetailsPopover
        open={Boolean(gamePopoverAnchor)}
        anchorEl={gamePopoverAnchor}
        onClose={() => setGamePopoverAnchor(null)}
        width={dashboardWidth}
        hasUrgentGames={urgentGames}
        games={games}
        teamsMap={teamsMap}
        gameGuesses={gameGuesses}
        tournamentId={tournamentId}
        isPlayoffs={isPlayoffs}
        silverMax={silverMax}
        goldenMax={goldenMax}
      />

      {/* Tournament Details Popover */}
      <TournamentDetailsPopover
        open={Boolean(tournamentPopoverAnchor)}
        anchorEl={tournamentPopoverAnchor}
        onClose={() => setTournamentPopoverAnchor(null)}
        width={dashboardWidth}
        tournamentPredictions={tournamentPredictions}
        tournamentId={tournamentId}
      />

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
