'use client'

import { Box, Stack, Fab } from '@mui/material';
import { useMemo, useContext } from 'react';
import NavigationIcon from '@mui/icons-material/Navigation';
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
import { findScrollTarget, scrollToGame } from '../utils/auto-scroll';

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

  // Handler to scroll to next/current game
  const handleScrollToNext = () => {
    const targetId = findScrollTarget(filteredGames);
    if (targetId) {
      scrollToGame(targetId, 'smooth');
    }
  };

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

      {/* Filters - Side by side */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {/* Primary Filter */}
        <Box sx={{ flex: 1 }}>
          <GameFilters
            gameCounts={gameCounts}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </Box>

        {/* Secondary Filter (Groups/Rounds) */}
        <Box sx={{ flex: 1 }}>
          <SecondaryFilters
            activeFilter={activeFilter}
            groupFilter={groupFilter}
            roundFilter={roundFilter}
            groups={groups}
            rounds={rounds}
            onGroupChange={setGroupFilter}
            onRoundChange={setRoundFilter}
          />
        </Box>
      </Box>

      {/* Scrollable Games List */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          minHeight: 0,
          px: { xs: 0, sm: 1 },
          position: 'relative'
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

        {/* Floating Action Button - Scroll to Next Game */}
        {filteredGames.length > 0 && (
          <Fab
            color="primary"
            aria-label="scroll to next game"
            onClick={handleScrollToNext}
            sx={{
              position: 'fixed',
              bottom: { xs: 80, md: 24 },
              right: { xs: 16, md: 24 },
              zIndex: 1000
            }}
          >
            <NavigationIcon />
          </Fab>
        )}
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
