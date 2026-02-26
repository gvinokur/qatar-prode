'use client'

import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Box } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Team } from '../db/tables-definition';
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
  readonly tournamentId?: string;
  readonly tournamentStartDate?: Date;
  readonly urgentGames?: ExtendedGameData[];
  readonly urgentGameGuesses?: Record<string, { home_score: number | null; away_score: number | null }>;
  readonly teamsMap?: Record<string, Team>;
  readonly silverBoostsUsed: number;
  readonly silverBoostsMax: number;
  readonly goldenBoostsUsed: number;
  readonly goldenBoostsMax: number;
  // Tournament predictions - flattened
  readonly finalStandingsCompleted?: number;
  readonly finalStandingsTotal?: number;
  readonly awardsCompleted?: number;
  readonly awardsTotal?: number;
  readonly qualifiersCompleted?: number;
  readonly qualifiersTotal?: number;
  readonly overallPercentage?: number;
  readonly isPredictionLocked?: boolean;
  readonly demoMode?: boolean;
}

export function CompactPredictionDashboard({
  totalGames,
  predictedGames,
  tournamentId,
  tournamentStartDate,
  urgentGames,
  urgentGameGuesses,
  teamsMap,
  silverBoostsUsed,
  silverBoostsMax,
  goldenBoostsUsed,
  goldenBoostsMax,
  finalStandingsCompleted,
  finalStandingsTotal,
  awardsCompleted,
  awardsTotal,
  qualifiersCompleted,
  qualifiersTotal,
  overallPercentage,
  isPredictionLocked,
  demoMode = false
}: CompactPredictionDashboardProps) {
  const t = useTranslations('predictions');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [gamePopoverAnchor, setGamePopoverAnchor] = useState<HTMLElement | null>(null);
  const [tournamentPopoverAnchor, setTournamentPopoverAnchor] = useState<HTMLElement | null>(null);
  const [boostAnchorEl, setBoostAnchorEl] = useState<HTMLElement | null>(null);
  const [activeBoostType, setActiveBoostType] = useState<'silver' | 'golden' | null>(null);
  const [dashboardWidth, setDashboardWidth] = useState<number>(600);

  const gamePercentage = totalGames > 0 ? Math.round((predictedGames / totalGames) * 100) : 0;
  const showBoosts = silverBoostsMax > 0 || goldenBoostsMax > 0;

  // Calculate tournament predictions completion from individual props (supports override pattern)
  const tournamentCompleted = useMemo(() => {
    if (
      finalStandingsCompleted === undefined ||
      awardsCompleted === undefined ||
      qualifiersCompleted === undefined
    ) {
      return undefined;
    }
    return finalStandingsCompleted + awardsCompleted + qualifiersCompleted;
  }, [finalStandingsCompleted, awardsCompleted, qualifiersCompleted]);

  const tournamentTotal = useMemo(() => {
    if (
      finalStandingsTotal === undefined ||
      awardsTotal === undefined ||
      qualifiersTotal === undefined
    ) {
      return undefined;
    }
    return finalStandingsTotal + awardsTotal + qualifiersTotal;
  }, [finalStandingsTotal, awardsTotal, qualifiersTotal]);

  const tournamentPercentage = useMemo(() => {
    if (tournamentCompleted === undefined || tournamentTotal === undefined || tournamentTotal === 0) {
      return undefined;
    }
    return Math.round((tournamentCompleted / tournamentTotal) * 100);
  }, [tournamentCompleted, tournamentTotal]);

  const gameUrgencyLevel = useMemo(
    () => getGameUrgencyLevel(urgentGames, urgentGameGuesses || {}),
    [urgentGames, urgentGameGuesses]
  );

  // Reconstruct tournament predictions object for urgency calculation
  const tournamentPredictions = useMemo(() => {
    if (
      tournamentPercentage === undefined ||
      isPredictionLocked === undefined
    ) {
      return undefined;
    }
    // Only include fields needed by getTournamentUrgencyLevel
    // Use calculated tournamentPercentage instead of baseline overallPercentage
    return {
      overallPercentage: tournamentPercentage,
      isPredictionLocked,
    } as any; // Partial object sufficient for urgency calculation
  }, [
    tournamentPercentage,
    isPredictionLocked,
  ]);

  const tournamentUrgencyLevel = useMemo(
    () => getTournamentUrgencyLevel(tournamentPredictions, tournamentStartDate),
    [tournamentPredictions, tournamentStartDate]
  );

  const handleBoostClick = useCallback((event: React.MouseEvent<HTMLElement>, type: 'silver' | 'golden') => {
    event.stopPropagation();
    setBoostAnchorEl(event.currentTarget);
    setActiveBoostType(type);
  }, []);

  const handleBoostClose = useCallback(() => {
    setBoostAnchorEl(null);
    setActiveBoostType(null);
  }, []);

  // Extract handlers to reduce cognitive complexity
  const handleGameRowClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!demoMode) {
        setGamePopoverAnchor(e.currentTarget);
      }
    },
    [demoMode]
  );

  const handleTournamentRowClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!demoMode) {
        setTournamentPopoverAnchor(e.currentTarget);
      }
    },
    [demoMode]
  );

  const boostClickHandler = demoMode ? undefined : handleBoostClick;

  const boostPopoverOpen = Boolean(boostAnchorEl);

  const searchParams = useSearchParams();

  // Extract boost values to reduce nesting
  const boostUsed = activeBoostType === 'silver' ? silverBoostsUsed : goldenBoostsUsed;
  const boostMax = activeBoostType === 'silver' ? silverBoostsMax : goldenBoostsMax;

  // Check if there are urgent games (within 48 hours)
  const hasUrgentGamesValue = useMemo(
    () => checkUrgentGames(urgentGames, urgentGameGuesses || {}),
    [urgentGames, urgentGameGuesses]
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

  // Close game popover when edit parameter is present (navigation-based edit)
  useEffect(() => {
    const editGameId = searchParams.get('edit');
    if (editGameId && gamePopoverAnchor) {
      setGamePopoverAnchor(null);
    }
  }, [searchParams, gamePopoverAnchor]);

  return (
    <Box ref={dashboardRef} sx={{ mb: 2 }}>
      {/* Game Predictions Row */}
      <PredictionProgressRow
        label={t('dashboard.games')}
        currentValue={predictedGames}
        maxValue={totalGames}
        percentage={gamePercentage}
        urgencyLevel={gameUrgencyLevel}
        onClick={handleGameRowClick}
        showBoosts={showBoosts}
        silverUsed={silverBoostsUsed}
        silverMax={silverBoostsMax}
        goldenUsed={goldenBoostsUsed}
        goldenMax={goldenBoostsMax}
        onBoostClick={boostClickHandler}
      />

      {/* Tournament Predictions Row */}
      {tournamentPercentage !== undefined && tournamentCompleted !== undefined && tournamentId && (
        <PredictionProgressRow
          label={t('dashboard.tournament')}
          currentValue={tournamentCompleted}
          maxValue={tournamentTotal}
          percentage={tournamentPercentage}
          urgencyLevel={tournamentUrgencyLevel}
          onClick={handleTournamentRowClick}
          marginBottom={0}
        />
      )}

      {/* Game Details Popover */}
      <GameDetailsPopover
        open={Boolean(gamePopoverAnchor)}
        anchorEl={gamePopoverAnchor}
        onClose={() => setGamePopoverAnchor(null)}
        width={dashboardWidth}
        hasUrgentGames={hasUrgentGamesValue}
        urgentGames={urgentGames}
        urgentGameGuesses={urgentGameGuesses}
        teamsMap={teamsMap}
        tournamentId={tournamentId}
        silverMax={silverBoostsMax}
        goldenMax={goldenBoostsMax}
      />

      {/* Tournament Details Popover */}
      <TournamentDetailsPopover
        open={Boolean(tournamentPopoverAnchor)}
        anchorEl={tournamentPopoverAnchor}
        onClose={() => setTournamentPopoverAnchor(null)}
        width={dashboardWidth}
        finalStandingsCompleted={finalStandingsCompleted}
        finalStandingsTotal={finalStandingsTotal}
        awardsCompleted={awardsCompleted}
        awardsTotal={awardsTotal}
        qualifiersCompleted={qualifiersCompleted}
        qualifiersTotal={qualifiersTotal}
        isPredictionLocked={isPredictionLocked}
        tournamentStartDate={tournamentStartDate}
        tournamentId={tournamentId}
      />

      {/* Boost Information Popover */}
      {activeBoostType && (
        <BoostInfoPopover
          open={boostPopoverOpen}
          anchorEl={boostAnchorEl}
          onClose={handleBoostClose}
          boostType={activeBoostType}
          used={boostUsed}
          max={boostMax}
          tournamentId={tournamentId}
        />
      )}
    </Box>
  );
}
