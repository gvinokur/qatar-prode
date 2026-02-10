'use client'

import { Box, Stack } from '@mui/material';
import { useMemo, useContext } from 'react';
import { FilterContextProvider, useFilterContext } from './context-providers/filter-context-provider';
import { GameFilters } from './game-filters';
import { PredictionStatusBar } from './prediction-status-bar';
import { SecondaryFilters } from './secondary-filters';
import { GamesListWithScroll } from './games-list-with-scroll';
import { ExtendedGameData } from '../definitions';
import { Team, Tournament, TournamentGroup, PlayoffRound, TournamentPredictionCompletion } from '../db/tables-definition';
import { TournamentGameCounts } from '../db/game-repository';
import { filterGames } from '../utils/game-filters';
import { GuessesContext } from './context-providers/guesses-context-provider';

interface UnifiedGamesPageContentProps {
  readonly games: ExtendedGameData[];
  readonly gameCounts: TournamentGameCounts;
  readonly teamsMap: Record<string, Team>;
  readonly tournamentId: string;
  readonly groups: TournamentGroup[];
  readonly rounds: PlayoffRound[];
  readonly dashboardStats: {
    silverUsed: number;
    goldenUsed: number;
  } | null;
  readonly tournament: Tournament;
  readonly closingGames: ExtendedGameData[];
  readonly tournamentPredictionCompletion: TournamentPredictionCompletion | null;
  readonly tournamentStartDate: Date | undefined;
}

function UnifiedGamesPageContent({
  games,
  gameCounts,
  teamsMap,
  tournamentId,
  groups,
  rounds,
  dashboardStats,
  tournament,
  closingGames,
  tournamentPredictionCompletion,
  tournamentStartDate
}: UnifiedGamesPageContentProps) {
  const { activeFilter, groupFilter, roundFilter, setActiveFilter, setGroupFilter, setRoundFilter } = useFilterContext();
  const guessesContext = useContext(GuessesContext);

  // Filter games based on active filters
  const filteredGames = useMemo(() => {
    return filterGames(games, activeFilter, groupFilter, roundFilter, guessesContext.gameGuesses);
  }, [games, activeFilter, groupFilter, roundFilter, guessesContext.gameGuesses]);

  // Calculate progress
  const totalGames = games.length;
  const predictedGames = games.filter(game => {
    const guess = guessesContext.gameGuesses[game.id];
    return guess && guess.home_score !== null && guess.away_score !== null;
  }).length;

  return (
    <Stack spacing={2} sx={{ height: '100%', overflow: 'hidden' }}>
      {/* Prediction Status Bar */}
      <PredictionStatusBar
        totalGames={totalGames}
        predictedGames={predictedGames}
        silverUsed={dashboardStats?.silverUsed || 0}
        silverMax={tournament.max_silver_games || 0}
        goldenUsed={dashboardStats?.goldenUsed || 0}
        goldenMax={tournament.max_golden_games || 0}
        tournamentPredictions={tournamentPredictionCompletion || undefined}
        tournamentId={tournamentId}
        tournamentStartDate={tournamentStartDate}
        games={closingGames}
        teamsMap={teamsMap}
        isPlayoffs={false}
      />

      {/* Primary Filters */}
      <GameFilters
        gameCounts={gameCounts}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Secondary Filters (Groups/Rounds tabs) */}
      <SecondaryFilters
        activeFilter={activeFilter}
        groupFilter={groupFilter}
        roundFilter={roundFilter}
        groups={groups}
        rounds={rounds}
        onGroupChange={setGroupFilter}
        onRoundChange={setRoundFilter}
      />

      {/* Scrollable Games List */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          minHeight: 0,
          px: { xs: 0, sm: 1 }
        }}
      >
        <GamesListWithScroll
          games={filteredGames}
          teamsMap={teamsMap}
          tournamentId={tournamentId}
          activeFilter={activeFilter}
          dashboardStats={dashboardStats}
          tournament={tournament}
        />
      </Box>
    </Stack>
  );
}

interface UnifiedGamesPageClientProps {
  readonly games: ExtendedGameData[];
  readonly gameCounts: TournamentGameCounts;
  readonly teamsMap: Record<string, Team>;
  readonly tournamentId: string;
  readonly groups: TournamentGroup[];
  readonly rounds: PlayoffRound[];
  readonly dashboardStats: {
    silverUsed: number;
    goldenUsed: number;
  } | null;
  readonly tournament: Tournament;
  readonly closingGames: ExtendedGameData[];
  readonly tournamentPredictionCompletion: TournamentPredictionCompletion | null;
  readonly tournamentStartDate: Date | undefined;
}

export function UnifiedGamesPageClient(props: UnifiedGamesPageClientProps) {
  return (
    <FilterContextProvider tournamentId={props.tournamentId}>
      <UnifiedGamesPageContent {...props} />
    </FilterContextProvider>
  );
}
