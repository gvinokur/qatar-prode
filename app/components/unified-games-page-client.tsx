'use client'

import { Box, Stack, Fab } from '@mui/material';
import { useMemo, useContext, useEffect, useState } from 'react';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { FilterContextProvider, useFilterContext } from './context-providers/filter-context-provider';
import { GameFilters } from './game-filters';
import { CompactPredictionDashboard } from './compact-prediction-dashboard';
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
  const [showScrollTop, setShowScrollTop] = useState(false);

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

  // Track scroll position to show/hide scroll to top button
  useEffect(() => {
    // On mobile, track Stack scroll; on desktop, track games container scroll
    const isMobile = window.innerWidth < 900; // md breakpoint
    const scrollContainer = isMobile
      ? document.getElementById('unified-games-stack')
      : document.getElementById('games-scroll-container');

    if (!scrollContainer) return;

    const handleScroll = () => {
      setShowScrollTop(scrollContainer.scrollTop > 300);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Handler to scroll to next/current game
  const handleScrollToNext = () => {
    const targetId = findScrollTarget(filteredGames);
    if (targetId) {
      scrollToGame(targetId, 'smooth');
    }
  };

  // Handler to scroll to top (on mobile scrolls to show dashboard, on desktop scrolls games)
  const handleScrollToTop = () => {
    const isMobile = window.innerWidth < 900; // md breakpoint
    const scrollContainer = isMobile
      ? document.getElementById('unified-games-stack')
      : document.getElementById('games-scroll-container');

    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <Stack
      id="unified-games-stack"
      spacing={2}
      sx={{
        height: '100%',
        overflow: { xs: 'auto', md: 'hidden' }, // Mobile: entire stack scrolls; Desktop: only games scroll
        pb: { xs: '56px', md: 0 }, // Account for fixed bottom nav on mobile
        pt: 2 // Add top padding for spacing from navigation tabs
      }}
    >
      {/* Compact Prediction Dashboard */}
      <Box>
        <CompactPredictionDashboard
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
      </Box>

      {/* Filters - Side by side, sticky on mobile */}
      <Box sx={{
        display: 'flex',
        gap: 2,
        mb: 2,
        position: { xs: 'sticky', md: 'static' },
        top: { xs: 0, md: 'auto' },
        zIndex: { xs: 10, md: 'auto' },
        backgroundColor: { xs: 'background.default', md: 'transparent' },
        pt: { xs: 1, md: 0 },
        pb: { xs: 1, md: 0 }
      }}>
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
        id="games-scroll-container"
        sx={{
          flexGrow: 1,
          overflow: { xs: 'visible', md: 'auto' }, // Mobile: no scroll (Stack scrolls); Desktop: scrolls
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

        {/* Floating Action Button - Scroll to Next Game (mobile only) */}
        {filteredGames.length > 0 && (
          <Fab
            color="primary"
            aria-label="scroll to next game"
            onClick={handleScrollToNext}
            sx={{
              display: { xs: 'flex', md: 'none' },
              position: 'fixed',
              bottom: 80,
              right: 16,
              zIndex: 1000
            }}
          >
            <ArrowDownwardIcon />
          </Fab>
        )}

        {/* Floating Action Button - Scroll to Top (mobile only, when scrolled) */}
        {showScrollTop && (
          <Fab
            color="secondary"
            aria-label="scroll to top"
            onClick={handleScrollToTop}
            sx={{
              position: 'fixed',
              bottom: 160,
              right: 16,
              zIndex: 1000,
              display: { xs: 'flex', md: 'none' }
            }}
          >
            <ArrowUpwardIcon />
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
