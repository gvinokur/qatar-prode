'use client'

import { Box, Stack, Fab } from '@mui/material';
import { useMemo, useContext, useEffect } from 'react';
import NavigationIcon from '@mui/icons-material/Navigation';
import { FilterContextProvider, useFilterContext } from './context-providers/filter-context-provider';
import { GameFilters } from './game-filters';
import { SecondaryFilters } from './secondary-filters';
import { GamesListWithScroll } from './games-list-with-scroll';
import { ExtendedGameData } from '../definitions';
import { Team, Tournament, TournamentGroup, PlayoffRound } from '../db/tables-definition';
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
}

function UnifiedGamesPageContent({
  games,
  gameCounts,
  teamsMap,
  tournamentId,
  groups,
  rounds,
  dashboardStats,
  tournament
}: UnifiedGamesPageContentProps) {
  const { activeFilter, groupFilter, roundFilter, setActiveFilter, setGroupFilter, setRoundFilter } = useFilterContext();
  const guessesContext = useContext(GuessesContext);

  // Filter games based on active filters
  const filteredGames = useMemo(() => {
    return filterGames(games, activeFilter, groupFilter, roundFilter, guessesContext.gameGuesses);
  }, [games, activeFilter, groupFilter, roundFilter, guessesContext.gameGuesses]);

  // Auto-scroll when filters change
  useEffect(() => {
    if (filteredGames.length > 0) {
      const targetId = findScrollTarget(filteredGames);
      if (targetId) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          scrollToGame(targetId, 'smooth');
        }, 100);
      }
    }
  }, [activeFilter, groupFilter, roundFilter, filteredGames]);

  // Handler to scroll to next/current game
  const handleScrollToNext = () => {
    const targetId = findScrollTarget(filteredGames);
    if (targetId) {
      scrollToGame(targetId, 'smooth');
    }
  };

  return (
    <Stack spacing={2} sx={{ height: '100%', overflow: 'hidden' }}>

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
}

export function UnifiedGamesPageClient(props: UnifiedGamesPageClientProps) {
  return (
    <FilterContextProvider tournamentId={props.tournamentId}>
      <UnifiedGamesPageContent {...props} />
    </FilterContextProvider>
  );
}
