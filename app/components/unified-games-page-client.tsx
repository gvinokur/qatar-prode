'use client'

import { Box, Fab, useTheme, useMediaQuery } from '@mui/material';
import { useMemo, useContext, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { ScrollShadowContainer } from './common/scroll-shadow-container';
import { FilterContextProvider, useFilterContext } from './context-providers/filter-context-provider';
import { useEditTrigger } from './context-providers/edit-trigger-context-provider';
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
import { isGamePredictionComplete } from '../utils/game-prediction-helpers';

// Timing constants for edit parameter handling
const DOM_RENDER_DELAY = 50; // ms - small delay for DOM to re-render after filter change
const SCROLL_ANIMATION_DURATION = 600; // ms - time for smooth scroll to complete

interface UnifiedGamesPageContentProps {
  readonly games: ExtendedGameData[];
  readonly gameCounts: TournamentGameCounts;
  readonly teamsMap: Record<string, Team>;
  readonly tournamentId: string;
  readonly groups: TournamentGroup[];
  readonly rounds: PlayoffRound[];
  readonly tournament: Tournament;
  readonly closingGames: ExtendedGameData[];
  readonly tournamentPredictionCompletion: TournamentPredictionCompletion | null;
  readonly tournamentStartDate: Date | undefined;
  readonly qualifiedTeamsHref: string;
}

function UnifiedGamesPageContent({
  games,
  gameCounts,
  teamsMap,
  tournamentId,
  groups,
  rounds,
  tournament,
  closingGames,
  tournamentPredictionCompletion,
  tournamentStartDate,
  qualifiedTeamsHref
}: UnifiedGamesPageContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activeFilter, groupFilter, roundFilter, setActiveFilter, setGroupFilter, setRoundFilter } = useFilterContext();
  const { triggerEdit, isEditModeRef } = useEditTrigger();
  const guessesContext = useContext(GuessesContext);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [pendingEditGameId, setPendingEditGameId] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Filter games based on active filters
  const filteredGames = useMemo(() => {
    return filterGames(games, activeFilter, groupFilter, roundFilter, guessesContext.gameGuesses);
  }, [games, activeFilter, groupFilter, roundFilter, guessesContext.gameGuesses]);

  const handleGameStageClick = useCallback((game: ExtendedGameData) => {
    if (game.playoffStage) {
      setActiveFilter('playoffs');
      setRoundFilter(game.playoffStage.tournament_playoff_round_id);
    } else if (game.group) {
      setActiveFilter('groups');
      setGroupFilter(game.group.tournament_group_id);
    }
  }, [setActiveFilter, setGroupFilter, setRoundFilter]);

  // Calculate progress
  const totalGames = games.length;
  const predictedGames = games.filter(game => {
    const guess = guessesContext.gameGuesses[game.id];
    if (!guess) return false;

    return isGamePredictionComplete(
      game.game_type,
      guess.home_score,
      guess.away_score,
      guess.home_penalty_winner,
      guess.away_penalty_winner
    );
  }).length;

  // Effect 1: Detect edit parameter and clear filters
  useEffect(() => {
    const editGameId = searchParams.get('edit');

    if (editGameId && !pendingEditGameId) {
      // Step 1: Store the game ID to trigger scroll/edit after filters update
      setPendingEditGameId(editGameId);

      // Step 2: Clear all filters to ensure game is visible
      setActiveFilter('all');
      setGroupFilter(null);
      setRoundFilter(null);
    }
  }, [searchParams, setActiveFilter, setGroupFilter, setRoundFilter, pendingEditGameId]);

  // Effect 2: Scroll and trigger edit AFTER filters have updated
  useEffect(() => {
    if (pendingEditGameId && activeFilter === 'all' && groupFilter === null && roundFilter === null) {
      // Filters are confirmed cleared - now safe to scroll and edit

      // Small delay to ensure DOM has re-rendered with all games visible
      const timeoutId = setTimeout(() => {
        scrollToGame(`game-${pendingEditGameId}`, 'smooth');

        // Trigger edit after scroll animation completes
        const editTimeoutId = setTimeout(() => {
          triggerEdit(pendingEditGameId); // This sets isEditMode to true in context
          setPendingEditGameId(null); // Clear pending state

          // Remove edit parameter from URL to prevent re-triggering
          router.replace(globalThis.location.pathname, { scroll: false });
        }, SCROLL_ANIMATION_DURATION);

        return () => clearTimeout(editTimeoutId);
      }, DOM_RENDER_DELAY);

      return () => clearTimeout(timeoutId);
    }
  }, [pendingEditGameId, activeFilter, groupFilter, roundFilter, triggerEdit]);

  // Auto-scroll when filters change (but not when edit mode changes)
  useEffect(() => {
    // Skip auto-scroll if any card is in edit mode (check ref to avoid re-running on edit mode changes)
    if (isEditModeRef.current) {
      return;
    }

    if (filteredGames.length > 0) {
      const targetId = findScrollTarget(filteredGames);
      if (targetId) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          scrollToGame(targetId, 'smooth');
        }, 100);
      }
    }
  }, [activeFilter, groupFilter, roundFilter, filteredGames, isEditModeRef]);

  // Track scroll position to show/hide scroll to top button
  useEffect(() => {
    // On mobile, track Stack scroll; on desktop, track games container scroll
    const wrapper = isMobile
      ? document.getElementById('unified-games-stack')
      : document.getElementById('games-scroll-container');

    const scrollContainer = wrapper?.querySelector('[data-scroll-container]') as HTMLElement | null;

    if (!scrollContainer) return;

    const handleScroll = () => {
      setShowScrollTop(scrollContainer.scrollTop > 300);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isMobile]); // Re-run when screen size changes

  // Handler to scroll to next/current game
  const handleScrollToNext = () => {
    const targetId = findScrollTarget(filteredGames);
    if (targetId) {
      scrollToGame(targetId, 'smooth');
    }
  };

  // Handler to scroll to top (on mobile scrolls to show dashboard, on desktop scrolls games)
  const handleScrollToTop = () => {
    const wrapper = isMobile
      ? document.getElementById('unified-games-stack')
      : document.getElementById('games-scroll-container');

    const scrollContainer = wrapper?.querySelector('[data-scroll-container]') as HTMLElement | null;

    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <ScrollShadowContainer
      id="unified-games-stack"
      direction={isMobile ? 'vertical' : 'none'}
      hideScrollbar={true}
      sx={{
        height: '100%',
      }}
      scrollContainerSx={{
        pb: { xs: '56px', md: 0 }, // Account for fixed bottom nav on mobile
        pt: 2, // Add top padding for spacing from navigation tabs
        display: { xs: 'block', md: 'flex' },
        flexDirection: 'column',
        gap: 2, // Equivalent to Stack spacing={2}
      }}
    >
      {/* Compact Prediction Dashboard */}
      <Box>
        <CompactPredictionDashboard
          totalGames={totalGames}
          predictedGames={predictedGames}
          tournamentId={tournamentId}
          tournamentStartDate={tournamentStartDate}
          urgentGames={closingGames}
          urgentGameGuesses={guessesContext.gameGuesses as any}
          teamsMap={teamsMap}
          silverBoostsUsed={guessesContext.boostCounts.silver.used}
          silverBoostsMax={guessesContext.boostCounts.silver.max}
          goldenBoostsUsed={guessesContext.boostCounts.golden.used}
          goldenBoostsMax={guessesContext.boostCounts.golden.max}
          finalStandingsCompleted={tournamentPredictionCompletion?.finalStandings.completed}
          finalStandingsTotal={tournamentPredictionCompletion?.finalStandings.total}
          awardsCompleted={tournamentPredictionCompletion?.awards.completed}
          awardsTotal={tournamentPredictionCompletion?.awards.total}
          qualifiersCompleted={tournamentPredictionCompletion?.qualifiers.completed}
          qualifiersTotal={tournamentPredictionCompletion?.qualifiers.total}
          overallPercentage={tournamentPredictionCompletion?.overallPercentage}
          isPredictionLocked={tournamentPredictionCompletion?.isPredictionLocked}
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
      <ScrollShadowContainer
        id="games-scroll-container"
        direction={isMobile ? 'none' : 'vertical'}
        hideScrollbar={true}
        sx={{
          flexGrow: 1,
          minHeight: 0,
        }}
      >
        <GamesListWithScroll
          games={filteredGames}
          teamsMap={teamsMap}
          tournamentId={tournamentId}
          activeFilter={activeFilter}
          tournament={tournament}
          onGameStageClick={handleGameStageClick}
          qtPredictionLocked={tournamentPredictionCompletion?.isPredictionLocked ?? false}
          qualifiedTeamsHref={qualifiedTeamsHref}
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
      </ScrollShadowContainer>
    </ScrollShadowContainer>
  );
}

interface UnifiedGamesPageClientProps {
  readonly games: ExtendedGameData[];
  readonly gameCounts: TournamentGameCounts;
  readonly teamsMap: Record<string, Team>;
  readonly tournamentId: string;
  readonly groups: TournamentGroup[];
  readonly rounds: PlayoffRound[];
  readonly tournament: Tournament;
  readonly closingGames: ExtendedGameData[];
  readonly tournamentPredictionCompletion: TournamentPredictionCompletion | null;
  readonly tournamentStartDate: Date | undefined;
  readonly qualifiedTeamsHref: string;
}

export function UnifiedGamesPageClient(props: UnifiedGamesPageClientProps) {
  return (
    <FilterContextProvider tournamentId={props.tournamentId}>
      <UnifiedGamesPageContent {...props} />
    </FilterContextProvider>
  );
}
