'use server'

import { getLocale } from 'next-intl/server';
import { getLoggedInUser } from '../actions/user-actions';
import { getTeamsMap, getGamesClosingWithin48Hours } from '../actions/tournament-actions';
import { getAllTournamentGames, getTournamentGameCounts } from '../db/game-repository';
import { applyLocalization } from '../utils/localization-helper';
import { findGameGuessesByUserId, getPredictionDashboardStats } from '../db/game-guess-repository';
import { findTournamentById } from '../db/tournament-repository';
import { findGroupsInTournament } from '../db/tournament-group-repository';
import { findPlayoffStagesWithGamesInTournament } from '../db/tournament-playoff-repository';
import { getTournamentPredictionCompletion } from '../db/tournament-prediction-completion-repository';
import { customToMap } from '../utils/ObjectUtils';
import { GuessesContextProvider } from './context-providers/guesses-context-provider';
import { EditTriggerContextProvider } from './context-providers/edit-trigger-context-provider';
import { UnifiedGamesPageClient } from './unified-games-page-client';
import { PublicGamesPage } from './tournament-page/public-games-page';

interface UnifiedGamesPageProps {
  readonly tournamentId: string;
}

export async function UnifiedGamesPage({ tournamentId }: UnifiedGamesPageProps) {
  const user = await getLoggedInUser();

  // If user is not authenticated, show public view
  if (!user) {
    return <PublicGamesPage tournamentId={tournamentId} />;
  }

  // Fetch all data in parallel
  const locale = await getLocale();

  const [
    games,
    gameCounts,
    teamsMap,
    gameGuessesArray,
    _dashboardStats,
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

  const localizedGames = games.map(game => ({
    ...game,
    playoffStage: game.playoffStage
      ? applyLocalization(game.playoffStage, locale, [{ field: 'round_name', i18nField: 'round_name_i18n' }])
      : game.playoffStage
  }));

  // Convert game guesses array to map
  const gameGuesses = customToMap(gameGuessesArray, (gameGuess) => gameGuess.game_id);

  return (
    <GuessesContextProvider
      gameGuesses={gameGuesses}
      autoSave={true}
      tournamentMaxSilver={tournament.max_silver_games || 0}
      tournamentMaxGolden={tournament.max_golden_games || 0}
    >
      <EditTriggerContextProvider>
        <UnifiedGamesPageClient
          games={localizedGames}
          gameCounts={gameCounts}
          teamsMap={teamsMap}
          tournamentId={tournamentId}
          groups={groups}
          rounds={rounds}
          tournament={tournament}
          closingGames={closingGames}
          tournamentPredictionCompletion={tournamentPredictionCompletion}
          tournamentStartDate={tournamentStartDate}
        />
      </EditTriggerContextProvider>
    </GuessesContextProvider>
  );
}
