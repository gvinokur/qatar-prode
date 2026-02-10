'use server'

import { getLoggedInUser } from '../actions/user-actions';
import { getTeamsMap } from '../actions/tournament-actions';
import { getAllTournamentGames, getTournamentGameCounts } from '../db/game-repository';
import { findGameGuessesByUserId } from '../db/game-guess-repository';
import { getPredictionDashboardStats } from '../db/game-guess-repository';
import { findTournamentById } from '../db/tournament-repository';
import { findGroupsInTournament } from '../db/tournament-group-repository';
import { findPlayoffStagesWithGamesInTournament } from '../db/tournament-playoff-repository';
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
    rounds
  ] = await Promise.all([
    getAllTournamentGames(tournamentId),
    getTournamentGameCounts(user.id, tournamentId),
    getTeamsMap(tournamentId),
    findGameGuessesByUserId(user.id, tournamentId),
    getPredictionDashboardStats(user.id, tournamentId),
    findTournamentById(tournamentId),
    findGroupsInTournament(tournamentId),
    findPlayoffStagesWithGamesInTournament(tournamentId)
  ]);

  if (!tournament) {
    return <div>Tournament not found.</div>;
  }

  // Convert game guesses array to map
  const gameGuesses = customToMap(gameGuessesArray, (gameGuess) => gameGuess.game_id);

  return (
    <GuessesContextProvider
      gameGuesses={gameGuesses}
      groupGames={[]}
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
      />
    </GuessesContextProvider>
  );
}
