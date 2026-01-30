'use client'

import { useMemo, useContext } from 'react';
import { GuessesContext } from './context-providers/guesses-context-provider';
import { PredictionStatusBar } from './prediction-status-bar';
import GamesGrid from './games-grid';
import type { ExtendedGameData } from '../definitions';
import type { Tournament, Team } from '../db/tables-definition';

interface PredictionDashboardProps {
  readonly games: ExtendedGameData[];
  readonly teamsMap: Record<string, Team>;
  readonly tournament: Tournament;
  readonly isPlayoffs: boolean;
  readonly isLoggedIn: boolean;
  readonly tournamentId: string;
  readonly isAwardsPredictionLocked?: boolean;
  // Initial stats from database query
  readonly dashboardStats: {
    totalGames: number;
    predictedGames: number;
    silverUsed: number;
    goldenUsed: number;
  };
  // Optional: All games closing within 48 hours (for accordion on playoffs page)
  readonly closingGames?: ExtendedGameData[];
}

export function PredictionDashboard({
  games,
  teamsMap,
  tournament,
  isPlayoffs,
  isLoggedIn,
  tournamentId,
  isAwardsPredictionLocked,
  dashboardStats,
  closingGames
}: PredictionDashboardProps) {
  // Get gameGuesses from context for real-time updates
  const { gameGuesses } = useContext(GuessesContext);

  // Recalculate stats client-side when predictions change
  const currentStats = useMemo(() => {
    // Count predictions for current games (view-specific)
    // Must check for both null and undefined - playoff games may have home_team/away_team but not scores
    const predictedCount = games.filter(game => {
      const guess = gameGuesses[game.id];
      return guess &&
        guess.home_score != null &&
        guess.away_score != null &&
        typeof guess.home_score === 'number' &&
        typeof guess.away_score === 'number';
    }).length;

    // Count boosts tournament-wide (not just current view)
    // Boost limits are tournament-wide, so counts must be tournament-wide
    const silverUsed = Object.values(gameGuesses).filter(g => g?.boost_type === 'silver').length;
    const goldenUsed = Object.values(gameGuesses).filter(g => g?.boost_type === 'golden').length;

    return {
      totalGames: games.length,
      predictedGames: predictedCount,
      silverUsed,
      goldenUsed
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
        games={closingGames || games}
        teamsMap={teamsMap}
        tournamentId={tournamentId}
        isPlayoffs={isPlayoffs}
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
