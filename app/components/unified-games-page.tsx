'use server'

import { getLoggedInUser } from '../actions/user-actions';
import { getTeamsMap, getGamesClosingWithin48Hours } from '../actions/tournament-actions';
import { getAllTournamentGames, getTournamentGameCounts } from '../db/game-repository';
import { findGameGuessesByUserId, getPredictionDashboardStats } from '../db/game-guess-repository';
import { findTournamentById } from '../db/tournament-repository';
import { findGroupsInTournament } from '../db/tournament-group-repository';
import { findPlayoffStagesWithGamesInTournament } from '../db/tournament-playoff-repository';
import { getTournamentPredictionCompletion } from '../db/tournament-prediction-completion-repository';
import { customToMap } from '../utils/ObjectUtils';
import { GuessesContextProvider } from './context-providers/guesses-context-provider';
import { UnifiedGamesPageClient } from './unified-games-page-client';

interface UnifiedGamesPageProps {
  readonly tournamentId: string;
}

export async function UnifiedGamesPage({ tournamentId }: UnifiedGamesPageProps) {
  const user = await getLoggedInUser();

  if (!user) {
    // Return empty state or redirect if user not logged in
    return (
      <div>Please log in to view games.</div>
    );
  }

  // Fetch all data in parallel
  const [
    games,
    gameCounts,
    teamsMap,
    gameGuessesArray,
    dashboardStats,
    tournament,
    groups,
    rounds,
    closingGames,
    tournamentPredictionCompletion
  ] = await Promise.all([
    getAllTournamentGames(tournamentId),
    getTournamentGameCounts(user.id, tournamentId),
    getTeamsMap(tournamentId),
    findGameGuessesByUserId(user.id, tournamentId),
    getPredictionDashboardStats(user.id, tournamentId),
    findTournamentById(tournamentId),
    findGroupsInTournament(tournamentId),
    findPlayoffStagesWithGamesInTournament(tournamentId),
    getGamesClosingWithin48Hours(tournamentId),
    (async () => {
      const t = await findTournamentById(tournamentId);
      return t ? getTournamentPredictionCompletion(user.id, tournamentId, t) : null;
    })()
  ]);

  if (!tournament) {
    return <div>Tournament not found.</div>;
  }

  // Calculate tournament start date (earliest game date)
  const tournamentStartDate = games.length > 0
    ? new Date(Math.min(...games.map(g => g.game_date.getTime())))
    : undefined;

  // Convert game guesses array to map
  const gameGuesses = customToMap(gameGuessesArray, (gameGuess) => gameGuess.game_id);

  return (
    <GuessesContextProvider
      gameGuesses={gameGuesses}
      autoSave={true}
    >
      <UnifiedGamesPageClient
        games={games}
        gameCounts={gameCounts}
        teamsMap={teamsMap}
        tournamentId={tournamentId}
        groups={groups}
        rounds={rounds}
        dashboardStats={dashboardStats}
        tournament={tournament}
        closingGames={closingGames}
        tournamentPredictionCompletion={tournamentPredictionCompletion}
        tournamentStartDate={tournamentStartDate}
      />
    </GuessesContextProvider>
  );
}
