'use client'

import { useMemo, useContext } from 'react';
import { GuessesContext } from './context-providers/guesses-context-provider';
import { PredictionStatusBar } from './prediction-status-bar';
import GamesGrid from './games-grid';
import type { ExtendedGameData } from '../definitions';
import type { Tournament, Team } from '../db/tables-definition';

interface PredictionDashboardProps {
  games: ExtendedGameData[];
  teamsMap: Record<string, Team>;
  tournament: Tournament;
  isPlayoffs: boolean;
  isLoggedIn: boolean;
  tournamentId: string;
  isAwardsPredictionLocked?: boolean;
  // Initial stats from database query (used for tournament-wide urgency on main page)
  dashboardStats: {
    totalGames: number;
    predictedGames: number;
    silverUsed: number;
    goldenUsed: number;
    urgentGames: number;
    warningGames: number;
    noticeGames: number;
  };
}

const ONE_HOUR = 60 * 60 * 1000;

export function PredictionDashboard({
  games,
  teamsMap,
  tournament,
  isPlayoffs,
  isLoggedIn,
  tournamentId,
  isAwardsPredictionLocked,
  dashboardStats
}: PredictionDashboardProps) {
  // Get gameGuesses from context for real-time updates
  const { gameGuesses } = useContext(GuessesContext);

  // Recalculate stats client-side when predictions change
  const currentStats = useMemo(() => {
    const now = Date.now();

    // Count predictions for current games
    const predictedCount = games.filter(game => {
      const guess = gameGuesses[game.id];
      return guess && guess.home_score !== undefined && guess.away_score !== undefined;
    }).length;

    // Count boosts for current games
    const silverUsed = games.filter(g => gameGuesses[g.id]?.boost_type === 'silver').length;
    const goldenUsed = games.filter(g => gameGuesses[g.id]?.boost_type === 'golden').length;

    // Calculate urgency warnings for current games
    const unpredictedGamesClosingSoon = games.filter(game => {
      const guess = gameGuesses[game.id];
      const isPredicted = guess && guess.home_score !== undefined && guess.away_score !== undefined;
      if (isPredicted) return false;

      const timeUntilClose = game.game_date.getTime() - ONE_HOUR - now;
      return timeUntilClose > 0 && timeUntilClose < 48 * 60 * 60 * 1000;
    });

    const urgentGames = unpredictedGamesClosingSoon.filter(g => {
      const timeUntilClose = g.game_date.getTime() - ONE_HOUR - now;
      return timeUntilClose < 2 * 60 * 60 * 1000;
    }).length;

    const warningGames = unpredictedGamesClosingSoon.filter(g => {
      const timeUntilClose = g.game_date.getTime() - ONE_HOUR - now;
      return timeUntilClose >= 2 * 60 * 60 * 1000 && timeUntilClose < 24 * 60 * 60 * 1000;
    }).length;

    const noticeGames = unpredictedGamesClosingSoon.filter(g => {
      const timeUntilClose = g.game_date.getTime() - ONE_HOUR - now;
      return timeUntilClose >= 24 * 60 * 60 * 1000 && timeUntilClose < 48 * 60 * 60 * 1000;
    }).length;

    return {
      totalGames: games.length,
      predictedGames: predictedCount,
      silverUsed,
      goldenUsed,
      urgentGames,
      warningGames,
      noticeGames
    };
  }, [games, gameGuesses]);

  // Boost limits from tournament config
  const silverMax = tournament.max_silver_games ?? 0;
  const goldenMax = tournament.max_golden_games ?? 0;

  return (
    <>
      <PredictionStatusBar
        totalGames={currentStats.totalGames}
        predictedGames={currentStats.predictedGames}
        silverUsed={currentStats.silverUsed}
        silverMax={silverMax}
        goldenUsed={currentStats.goldenUsed}
        goldenMax={goldenMax}
        urgentGames={currentStats.urgentGames}
        warningGames={currentStats.warningGames}
        noticeGames={currentStats.noticeGames}
      />

      <GamesGrid
        games={games}
        teamsMap={teamsMap}
        isPlayoffs={isPlayoffs}
        isLoggedIn={isLoggedIn}
        tournamentId={tournamentId}
        isAwardsPredictionLocked={isAwardsPredictionLocked}
      />
    </>
  );
}
