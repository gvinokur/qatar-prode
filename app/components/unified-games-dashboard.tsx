'use server'

import { getLoggedInUser } from '../actions/user-actions';
import { getTeamsMap, getGamesClosingWithin48Hours } from '../actions/tournament-actions';
import { getAllTournamentGames } from '../db/game-repository';
import { getPredictionDashboardStats } from '../db/game-guess-repository';
import { findTournamentById } from '../db/tournament-repository';
import { getTournamentPredictionCompletion } from '../db/tournament-prediction-completion-repository';
import { UnifiedGamesDashboardClient } from './unified-games-dashboard-client';

interface UnifiedGamesDashboardProps {
  readonly tournamentId: string;
}

export async function UnifiedGamesDashboard({ tournamentId }: UnifiedGamesDashboardProps) {
  const user = await getLoggedInUser();

  if (!user) {
    return null;
  }

  // Fetch dashboard data in parallel
  const [
    games,
    teamsMap,
    dashboardStats,
    tournament,
    closingGames,
    tournamentPredictionCompletion
  ] = await Promise.all([
    getAllTournamentGames(tournamentId),
    getTeamsMap(tournamentId),
    getPredictionDashboardStats(user.id, tournamentId),
    findTournamentById(tournamentId),
    getGamesClosingWithin48Hours(tournamentId),
    (async () => {
      const t = await findTournamentById(tournamentId);
      return t ? getTournamentPredictionCompletion(user.id, tournamentId, t) : null;
    })()
  ]);

  if (!tournament) {
    return null;
  }

  // Calculate tournament start date (earliest game date)
  const tournamentStartDate = games.length > 0
    ? new Date(Math.min(...games.map(g => g.game_date.getTime())))
    : undefined;

  // Calculate total and predicted games
  const totalGames = games.length;
  const predictedGames = games.filter(game => {
    // This is a simple check - in the actual component we use the GuessesContext
    // For now, we'll pass 0 as a placeholder since the real count comes from context
    return false;
  }).length;

  return (
    <UnifiedGamesDashboardClient
      totalGames={totalGames}
      predictedGames={predictedGames}
      silverUsed={dashboardStats?.silverUsed || 0}
      silverMax={tournament.max_silver_games || 0}
      goldenUsed={dashboardStats?.goldenUsed || 0}
      goldenMax={tournament.max_golden_games || 0}
      tournamentPredictions={tournamentPredictionCompletion || undefined}
      tournamentId={tournamentId}
      tournamentStartDate={tournamentStartDate}
      closingGames={closingGames}
      teamsMap={teamsMap}
    />
  );
}
