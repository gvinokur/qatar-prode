'use client'

import { Box, Fab, Tooltip, useTheme, useMediaQuery } from '@mui/material';
import { useMemo, useContext, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { ScrollShadowContainer } from './common/scroll-shadow-container';
import { FilterContextProvider, useFilterContext } from './context-providers/filter-context-provider';
import { useEditTrigger } from './context-providers/edit-trigger-context-provider';
import { GameFilters } from './game-filters';
import { PredictionStatusHeader, computeGamesHeaderVariant } from './prediction-status-header';
import { SecondaryFilters } from './secondary-filters';
import { GamesListWithScroll } from './games-list-with-scroll';
import { ExtendedGameData } from '../definitions';
import { Team, Tournament, TournamentGroup, PlayoffRound, TournamentPredictionCompletion, GameGuessNew } from '../db/tables-definition';
import { TournamentGameCounts } from '../db/game-repository';
import { filterGames } from '../utils/game-filters';
import { GuessesContext } from './context-providers/guesses-context-provider';
import { findScrollTarget, scrollToGame } from '../utils/auto-scroll';
import { isGuessComplete } from '../utils/guess-utils';
import { EDIT_NEXT_TOKEN } from '../utils/prediction-constants';
import { calculateDeadline } from '../utils/countdown-utils';
import { generateAIPrediction } from '../utils/ai-prediction-generator';
import { updateOrCreateGameGuesses } from '../actions/guesses-actions';
import type { Locale } from '../../i18n.config';
import AiGenerateAllDialog from './ai-generate-all-dialog';

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
  readonly nowAvailableRoundIds?: string[];
  readonly gamePointsEarned?: number;
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
  qualifiedTeamsHref,
  nowAvailableRoundIds,
  gamePointsEarned,
}: UnifiedGamesPageContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('predictions');
  const { activeFilter, groupFilter, roundFilter, setActiveFilter, setGroupFilter, setRoundFilter } = useFilterContext();
  const { triggerEdit, isEditModeRef } = useEditTrigger();
  const guessesContext = useContext(GuessesContext);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGenerateError, setAiGenerateError] = useState<string | null>(null);
  const [pendingEditGameId, setPendingEditGameId] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const nowAvailableRoundIdsSet = useMemo(
    () => new Set(nowAvailableRoundIds ?? []),
    [nowAvailableRoundIds]
  )

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

  const openUnpredictedGames = useMemo(() => {
    return games.filter(game =>
      game.home_team &&
      game.away_team &&
      calculateDeadline(game.game_date) > Date.now() &&
      !isGuessComplete(guessesContext.gameGuesses[game.id], !!game.playoffStage)
    );
  }, [games, guessesContext.gameGuesses]);

  const handleAIGenerateAll = useCallback(async () => {
    if (aiGenerating) return;
    setAiGenerating(true);
    setAiGenerateError(null);
    try {
      const guessesToSave: GameGuessNew[] = openUnpredictedGames.map(game => {
        const { homeScore, awayScore, homePenaltyWinner, awayPenaltyWinner } = generateAIPrediction(
          (teamsMap[game.home_team!] as { rank?: number | null })?.rank,
          (teamsMap[game.away_team!] as { rank?: number | null })?.rank,
          !!game.playoffStage
        );
        return {
          game_id: game.id,
          game_number: game.game_number,
          user_id: '',
          home_score: homeScore,
          away_score: awayScore,
          ...(homePenaltyWinner !== undefined && { home_penalty_winner: homePenaltyWinner }),
          ...(awayPenaltyWinner !== undefined && { away_penalty_winner: awayPenaltyWinner }),
        };
      });
      const result = await updateOrCreateGameGuesses(guessesToSave, locale as Locale);
      if (result.success) {
        guessesContext.bulkSetGameGuesses(guessesToSave);
        setAiDialogOpen(false);
      } else {
        setAiGenerateError(result.error ?? t('aiGenerate.errorMessage'));
      }
    } catch {
      setAiGenerateError(t('aiGenerate.errorMessage'));
    } finally {
      setAiGenerating(false);
    }
  }, [aiGenerating, openUnpredictedGames, teamsMap, guessesContext, locale, t]);

// Effect 1: Detect edit parameter and clear filters
  useEffect(() => {
    const editParam = searchParams.get('edit');

    if (editParam && !pendingEditGameId) {
      let targetGameId: string | null;
      if (editParam === EDIT_NEXT_TOKEN) {
        const guesses = guessesContext.gameGuesses;
        const now = new Date();
        const unpredictedUpcoming = games.find(
          g => calculateDeadline(g.game_date) > now.getTime()
            && !isGuessComplete(guesses[g.id], !!g.playoffStage)
        );
        if (unpredictedUpcoming) {
          targetGameId = unpredictedUpcoming.id;
        } else {
          // All upcoming games are predicted — fall back to first upcoming (chronological)
          const scrollTarget = findScrollTarget(games);
          targetGameId = scrollTarget ? scrollTarget.slice('game-'.length) : null;
        }
      } else {
        targetGameId = editParam;
      }

      if (targetGameId) {
        // Step 1: Store the game ID to trigger scroll/edit after filters update
        setPendingEditGameId(targetGameId);

        // Step 2: Clear all filters to ensure game is visible
        setActiveFilter('all');
        setGroupFilter(null);
        setRoundFilter(null);
      }
    }
  }, [searchParams, games, guessesContext.gameGuesses, setActiveFilter, setGroupFilter, setRoundFilter, pendingEditGameId]);

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
      {/* Prediction Status Header */}
      {tournamentPredictionCompletion && (
        <Box>
          <PredictionStatusHeader
            variant={computeGamesHeaderVariant(
              {
                completion: tournamentPredictionCompletion,
                games,
                urgentGames: closingGames,
                gameGuesses: guessesContext.gameGuesses as Record<string, import('../db/tables-definition').GameGuess>,
                teamsMap,
                tournamentId,
                gamePointsEarned,
                locale,
              },
              t as (key: string, values?: Record<string, unknown>) => string
            )}
          />
        </Box>
      )}

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
            nowAvailableRoundIds={nowAvailableRoundIdsSet}
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
          nowAvailableRoundIds={nowAvailableRoundIdsSet}
          onAIGenerateClick={() => {}}
        />

        {/* Floating Action Button - AI Generate All (mobile only) */}
        {openUnpredictedGames.length > 0 && (
          <Tooltip title={t('aiGenerate.generateAllButton')}>
            <Fab
              color="primary"
              aria-label={t('aiGenerate.generateAllButton')}
              onClick={() => setAiDialogOpen(true)}
              disabled={aiGenerating}
              sx={{
                display: { xs: 'flex', md: 'none' },
                position: 'fixed',
                bottom: 140,
                right: 16,
                zIndex: 1000
              }}
            >
              <AutoAwesomeIcon />
            </Fab>
          </Tooltip>
        )}

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

        {/* AI Generate All Dialog */}
        <AiGenerateAllDialog
          open={aiDialogOpen}
          onClose={() => { setAiDialogOpen(false); setAiGenerateError(null); }}
          onConfirm={handleAIGenerateAll}
          pendingCount={openUnpredictedGames.length}
          loading={aiGenerating}
          errorMessage={aiGenerateError}
        />

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
  readonly nowAvailableRoundIds?: string[];
  readonly gamePointsEarned?: number;
}

export function UnifiedGamesPageClient(props: UnifiedGamesPageClientProps) {
  return (
    <FilterContextProvider tournamentId={props.tournamentId}>
      <UnifiedGamesPageContent {...props} />
    </FilterContextProvider>
  );
}
