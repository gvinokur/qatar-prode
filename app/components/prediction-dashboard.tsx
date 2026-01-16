'use client'

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
  // Stats from database query
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

  // Boost limits from tournament config
  const silverMax = tournament.max_silver_games ?? 0;
  const goldenMax = tournament.max_golden_games ?? 0;

  return (
    <>
      <PredictionStatusBar
        totalGames={dashboardStats.totalGames}
        predictedGames={dashboardStats.predictedGames}
        silverUsed={dashboardStats.silverUsed}
        silverMax={silverMax}
        goldenUsed={dashboardStats.goldenUsed}
        goldenMax={goldenMax}
        urgentGames={dashboardStats.urgentGames}
        warningGames={dashboardStats.warningGames}
        noticeGames={dashboardStats.noticeGames}
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
