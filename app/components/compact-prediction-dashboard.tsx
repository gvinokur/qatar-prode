'use client'

import React, { useContext, useMemo, useState, useRef, useCallback } from 'react';
import { Box } from '@mui/material';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  TournamentPredictionCompletion,
  GameGuessNew,
  TournamentGuessNew,
  QualifiedTeamPrediction
} from '../db/tables-definition';
import { GuessesContext } from './context-providers/guesses-context-provider';
import type { ExtendedGameData } from '../definitions';
import BoostInfoPopover from './boost-info-popover';
import { PredictionProgressRow } from './prediction-progress-row';
import { TournamentDetailsPopover } from './tournament-details-popover';
import {
  getGameUrgencyLevel,
  getTournamentUrgencyLevel
} from './urgency-helpers';
import {
  calculateGamePredictions,
  calculateQualifiedTeamsPredictions,
  calculateFinalStandings,
  calculateAwards
} from '../utils/dashboard-calculations';

/**
 * CompactPredictionDashboard - Pure component for displaying prediction progress
 *
 * This component displays prediction completion metrics across different categories:
 * - Game predictions (with playoff tie validation)
 * - Qualified team predictions
 * - Final standings predictions (champion, runner-up, third place)
 * - Individual awards predictions (top goalscorer, best player, best goalkeeper, best young player)
 *
 * **Architecture**: This is a pure component with NO context dependencies.
 * Parent components are responsible for:
 * - Consuming contexts (GuessesContext, QualifiedTeamsContext)
 * - Extracting relevant data from contexts
 * - Passing data as props to this component
 *
 * **Dynamic Calculation**: Set fixedData values to null to trigger dynamic calculation:
 * - fixedData.gamePredictions = null → calculates from gameGuesses prop
 * - fixedData.qualifiedTeams = null → calculates from qualifiedTeamsPredictions prop
 * - fixedData.finalStandings = null → calculates from tournamentGuesses prop
 * - fixedData.awards = null → calculates from tournamentGuesses prop
 *
 * **Navigation**: Clicking the game row navigates to tournament home page with
 * URL params for auto-scroll and filter reset.
 */
interface CompactPredictionDashboardProps {
  // Core tournament context
  readonly tournamentId?: string;
  readonly tournamentStartDate?: Date;
  readonly games?: ExtendedGameData[]; // For urgency calculation and dynamic game count
  readonly demoMode?: boolean;

  // Data for dynamic calculations (passed by parent components)
  readonly gameGuesses?: Record<string, GameGuessNew>; // For dynamic game count calculation
  readonly qualifiedTeamsPredictions?: Map<string, QualifiedTeamPrediction>; // For dynamic qualified teams count
  readonly tournamentGuesses?: TournamentGuessNew; // For dynamic final standings + awards calculation

  // Fixed data (retrieved once from server, won't change on this page)
  readonly fixedData: {
    readonly totalGames: number;
    readonly gamePredictions: number | null; // null = calculate dynamically from gameGuesses prop
    readonly qualifiedTeams: number | null; // null = calculate dynamically from qualifiedTeamsPredictions prop
    readonly finalStandings: number | null; // null = calculate dynamically from tournamentGuesses prop
    readonly awards: number | null; // null = calculate dynamically from tournamentGuesses prop
  };

  readonly tournamentPredictions?: TournamentPredictionCompletion;
}

export function CompactPredictionDashboard({
  tournamentId,
  tournamentStartDate,
  games,
  demoMode = false,
  gameGuesses,
  qualifiedTeamsPredictions,
  tournamentGuesses,
  fixedData,
  tournamentPredictions
}: CompactPredictionDashboardProps) {
  const t = useTranslations('predictions');
  const router = useRouter();
  const locale = useLocale();
  const { boostCounts } = useContext(GuessesContext);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [tournamentPopoverAnchor, setTournamentPopoverAnchor] = useState<HTMLElement | null>(null);
  const [boostAnchorEl, setBoostAnchorEl] = useState<HTMLElement | null>(null);
  const [activeBoostType, setActiveBoostType] = useState<'silver' | 'golden' | null>(null);
  const [dashboardWidth, setDashboardWidth] = useState<number>(600);

  // Calculate dynamic metrics based on fixedData null values
  const calculatedData = useMemo(() => {
    // Calculate game predictions if fixedData.gamePredictions is null
    const gamePredictions = fixedData.gamePredictions !== null
      ? fixedData.gamePredictions
      : (games && gameGuesses ? calculateGamePredictions(games, gameGuesses) : 0);

    // Calculate qualified teams if fixedData.qualifiedTeams is null
    const qualifiedTeams = fixedData.qualifiedTeams !== null
      ? fixedData.qualifiedTeams
      : (qualifiedTeamsPredictions
          ? calculateQualifiedTeamsPredictions(qualifiedTeamsPredictions)
          : 0);

    // Calculate final standings if fixedData.finalStandings is null
    const finalStandings = fixedData.finalStandings !== null
      ? fixedData.finalStandings
      : calculateFinalStandings(tournamentGuesses ?? null);

    // Calculate awards if fixedData.awards is null
    const awards = fixedData.awards !== null
      ? fixedData.awards
      : calculateAwards(tournamentGuesses ?? null);

    return { gamePredictions, qualifiedTeams, finalStandings, awards };
  }, [
    fixedData.gamePredictions,
    fixedData.qualifiedTeams,
    fixedData.finalStandings,
    fixedData.awards,
    games,
    gameGuesses,
    qualifiedTeamsPredictions,
    tournamentGuesses
  ]);

  const gamePercentage = fixedData.totalGames > 0
    ? Math.round((calculatedData.gamePredictions / fixedData.totalGames) * 100)
    : 0;
  const showBoosts = boostCounts.silver.max > 0 || boostCounts.golden.max > 0;

  const gameUrgencyLevel = useMemo(
    () => getGameUrgencyLevel(games, gameGuesses ?? {}),
    [games, gameGuesses]
  );

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

  /**
   * Navigate to tournament home page with URL params for auto-scroll and filter reset
   * Replaces the old GameDetailsPopover behavior
   */
  const handleGameRowClick = useCallback(
    () => {
      if (demoMode || !tournamentId) return;

      const url = `/${locale}/tournaments/${tournamentId}?scrollToGame=auto&filter=all`;
      router.push(url);
    },
    [demoMode, tournamentId, router, locale]
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

  // Extract boost values to reduce nesting
  const boostUsed = activeBoostType === 'silver' ? boostCounts.silver.used : boostCounts.golden.used;
  const boostMax = activeBoostType === 'silver' ? boostCounts.silver.max : boostCounts.golden.max;

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
        label={t('dashboard.games')}
        currentValue={calculatedData.gamePredictions}
        maxValue={fixedData.totalGames}
        percentage={gamePercentage}
        urgencyLevel={gameUrgencyLevel}
        onClick={handleGameRowClick}
        showBoosts={showBoosts}
        silverUsed={boostCounts.silver.used}
        silverMax={boostCounts.silver.max}
        goldenUsed={boostCounts.golden.used}
        goldenMax={boostCounts.golden.max}
        onBoostClick={boostClickHandler}
      />

      {/* Qualified Teams Predictions Row */}
      {tournamentPredictions && tournamentId && (
        <PredictionProgressRow
          label={t('dashboard.qualifiedTeams')}
          currentValue={calculatedData.qualifiedTeams}
          maxValue={tournamentPredictions.qualifiers.total}
          percentage={
            tournamentPredictions.qualifiers.total > 0
              ? Math.round((calculatedData.qualifiedTeams / tournamentPredictions.qualifiers.total) * 100)
              : 0
          }
          urgencyLevel={tournamentUrgencyLevel}
          onClick={handleTournamentRowClick}
        />
      )}

      {/* Final Standings Predictions Row */}
      {tournamentPredictions && tournamentId && (
        <PredictionProgressRow
          label={t('dashboard.finalStandings')}
          currentValue={calculatedData.finalStandings}
          maxValue={tournamentPredictions.finalStandings.total}
          percentage={
            tournamentPredictions.finalStandings.total > 0
              ? Math.round((calculatedData.finalStandings / tournamentPredictions.finalStandings.total) * 100)
              : 0
          }
          urgencyLevel={tournamentUrgencyLevel}
          onClick={handleTournamentRowClick}
        />
      )}

      {/* Individual Awards Predictions Row */}
      {tournamentPredictions && tournamentId && (
        <PredictionProgressRow
          label={t('dashboard.awards')}
          currentValue={calculatedData.awards}
          maxValue={tournamentPredictions.awards.total}
          percentage={
            tournamentPredictions.awards.total > 0
              ? Math.round((calculatedData.awards / tournamentPredictions.awards.total) * 100)
              : 0
          }
          urgencyLevel={tournamentUrgencyLevel}
          onClick={handleTournamentRowClick}
          marginBottom={0}
        />
      )}

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
          used={boostUsed}
          max={boostMax}
          tournamentId={tournamentId}
        />
      )}
    </Box>
  );
}
