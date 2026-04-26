'use client'

import { Box, Button } from '@mui/material';
import { Fragment, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import FlippableGameCard from './flippable-game-card';
import { StageSeparator } from './stage-separator';
import { StageTransitionBanner } from './stage-transition-banner';
import { ExtendedGameData } from '../definitions';
import { Game, GameGuessNew, Team, Tournament } from '../db/tables-definition';
import { GuessesContext } from './context-providers/guesses-context-provider';
import { useEditMode } from './context-providers/edit-mode-context-provider';
import { useEditTrigger } from './context-providers/edit-trigger-context-provider';
import { EmptyGamesState } from './empty-games-state';
import { FilterType } from '../utils/game-filters';
import { findScrollTarget, scrollToGame } from '../utils/auto-scroll';
import { calculateTeamNamesForPlayoffGame } from '../utils/playoff-utils';
import { isGamePredictionComplete } from '../utils/game-prediction-helpers';

type GameSection = { sectionKey: string; label: string; games: ExtendedGameData[] }

interface GamesListWithScrollProps {
  readonly games: ExtendedGameData[];
  readonly teamsMap: Record<string, Team>;
  readonly tournamentId: string;
  readonly activeFilter: FilterType;
  readonly tournament: Tournament;
  readonly onGameStageClick?: (game: ExtendedGameData) => void;
  readonly qtPredictionLocked: boolean;
  readonly qualifiedTeamsHref: string;
}

const buildGameGuess = (game: Game, userId: string): GameGuessNew => ({
  game_id: game.id,
  game_number: game.game_number,
  user_id: userId,
  home_score: undefined,
  away_score: undefined,
  home_penalty_winner: false,
  away_penalty_winner: false,
  home_team: undefined,
  away_team: undefined,
  score: undefined
});

export function GamesListWithScroll({
  games,
  teamsMap,
  tournamentId,
  activeFilter,
  tournament,
  onGameStageClick,
  qtPredictionLocked,
  qualifiedTeamsHref
}: GamesListWithScrollProps) {
  const t = useTranslations('predictions');
  const groupContext = useContext(GuessesContext);
  const editMode = useEditMode();
  const { registerTrigger, setEditMode } = useEditTrigger();
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const gameGuesses = groupContext.gameGuesses;
  const { data } = useSession();

  const gameSections = useMemo((): GameSection[] => {
    const sections: GameSection[] = [];
    const keyIndex: Record<string, number> = {};

    for (const game of games) {
      let sectionKey: string;
      let label: string;

      if (game.playoffStage) {
        sectionKey = `playoff-${game.playoffStage.tournament_playoff_round_id}`;
        label = game.playoffStage.round_name;
      } else if (game.group && game.matchday != null) {
        sectionKey = `matchday-${game.matchday}`;
        label = t('game.matchday', { number: game.matchday });
      } else if (game.group) {
        sectionKey = `group-${game.group.group_letter}`;
        label = t('secondaryFilters.groupWithLetter', { letter: game.group.group_letter });
      } else {
        sectionKey = 'other';
        label = '';
      }

      if (keyIndex[sectionKey] === undefined) {
        keyIndex[sectionKey] = sections.length;
        sections.push({ sectionKey, label, games: [] });
      }
      sections[keyIndex[sectionKey]].games.push(game);
    }

    // Sort group-fallback sections alphabetically; matchday/playoff sections keep insertion order
    sections.sort((a, b) => {
      const aIsGroup = a.sectionKey.startsWith('group-');
      const bIsGroup = b.sectionKey.startsWith('group-');
      if (aIsGroup && bIsGroup) return a.sectionKey.localeCompare(b.sectionKey);
      return 0;
    });

    return sections;
  }, [games, t]);

  // Auto-scroll effect (runs once on mount)
  useEffect(() => {
    const scrollKey = `autoScrolled-${tournamentId}`;
    const hasScrolled = sessionStorage.getItem(scrollKey);

    if (!hasScrolled && games.length > 0) {
      const targetId = findScrollTarget(games);
      if (targetId) {
        // Delay to ensure DOM is ready
        setTimeout(() => {
          scrollToGame(targetId, 'smooth');
          sessionStorage.setItem(scrollKey, 'true');
        }, 300);
      }
    }
  }, [games, tournamentId]);

  // Update playoff game teams when guesses change
  useEffect(() => {
    const isPlayoffs = games.some(g => g.playoffStage !== null && g.playoffStage !== undefined);

    if (isPlayoffs && data?.user) {
      games.forEach(game => {
        if (game.playoffStage) {
          const gameGuess = gameGuesses[game.id] || buildGameGuess(game, data.user.id);
          const result = calculateTeamNamesForPlayoffGame(
            true,
            game,
            gameGuesses,
            Object.fromEntries(games.map(g => [g.id, g]))
          );
          if (result) {
            const { homeTeam, awayTeam } = result;
            if (homeTeam !== gameGuess.home_team || awayTeam !== gameGuess.away_team) {
              groupContext.updateGameGuess(gameGuess.game_id, {
                ...gameGuess,
                home_team: homeTeam,
                away_team: awayTeam
              });
            }
          }
        }
      });
    }
  }, [gameGuesses, games, groupContext, data]);

  const handleEditStart = useCallback(async (gameId: string) => {
    if (editMode) {
      await editMode.startEdit(gameId, 'inline');
    }
    setEditingGameId(gameId);
    setEditMode(true); // Mark edit mode as active
  }, [editMode, setEditMode]);

  const handleEditEnd = useCallback(() => {
    if (editMode) {
      editMode.endEdit();
    }
    setEditingGameId(null);
    setEditMode(false); // Mark edit mode as inactive
  }, [editMode, setEditMode]);

  // Register handleEditStart with EditTriggerContext to allow external triggering
  useEffect(() => {
    registerTrigger(handleEditStart);

    // Cleanup: unregister on unmount
    return () => {
      registerTrigger(null);
    };
  }, [handleEditStart, registerTrigger]);

  const handleAutoAdvanceNext = useCallback((currentGameId: string) => {
    const idx = games.findIndex(g => g.id === currentGameId);

    // Find next unpredicted group-stage game (never crosses into playoffs)
    for (let i = idx + 1; i < games.length; i++) {
      const nextGame = games[i];

      // Stop at group stage boundary — never advance into playoff games
      if (nextGame.playoffStage !== null && nextGame.playoffStage !== undefined) {
        return;
      }

      const nextGuess = gameGuesses[nextGame.id];
      const isPredicted = isGamePredictionComplete(
        nextGame.game_type,
        nextGuess?.home_score,
        nextGuess?.away_score,
        nextGuess?.home_penalty_winner,
        nextGuess?.away_penalty_winner
      );

      if (!isPredicted) {
        handleEditStart(nextGame.id);

        // Scroll after edit form opens so the expanded card stays in view
        setTimeout(() => {
          const cardElement = document.getElementById(`game-${nextGame.id}`);
          cardElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);

        return;
      }
    }
    // No unpredicted group game found — stop silently
  }, [games, gameGuesses, handleEditStart]);

  const handleAutoGoPrevious = useCallback((currentGameId: string) => {
    const idx = games.findIndex(g => g.id === currentGameId);

    // Find previous enabled game (skip disabled games)
    for (let i = idx - 1; i >= 0; i--) {
      const prevGame = games[i];
      const ONE_HOUR = 60 * 60 * 1000;
      const isDisabled = Date.now() + ONE_HOUR > prevGame.game_date.getTime();

      if (!isDisabled) {
        handleEditStart(prevGame.id);

        // Scroll to previous card
        setTimeout(() => {
          const cardElement = document.getElementById(`game-${prevGame.id}`);
          cardElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);

        return;
      }
    }
  }, [games, handleEditStart]);

  const handleScrollToTop = useCallback(() => {
    if (games.length > 0) {
      const firstGameId = `game-${games[0].id}`;
      scrollToGame(firstGameId, 'smooth');
    }
  }, [games]);

  const handleScrollToNext = useCallback(() => {
    const targetId = findScrollTarget(games);
    if (targetId) {
      scrollToGame(targetId, 'smooth');
    } else if (games.length > 0) {
      // If no target found (all games predicted or closed), scroll to last game
      const lastGame = games.at(-1);
      if (lastGame) {
        const lastGameId = `game-${lastGame.id}`;
        scrollToGame(lastGameId, 'smooth');
      }
    }
  }, [games]);

  // Show empty state if no games
  if (games.length === 0) {
    return <EmptyGamesState filterType={activeFilter} />;
  }

  return (
    <Box>
      {/* Next game button - only show on desktop if more than 1 game */}
      {games.length > 1 && (
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center', pb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowDownwardIcon />}
            onClick={handleScrollToNext}
            sx={{ minWidth: 200 }}
          >
            {t('navigation.goToNextGame')}
          </Button>
        </Box>
      )}

      {/* Two-column responsive grid for game cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 2,
          width: '100%',
        }}
      >
        {gameSections.map((section, sectionIdx) => {
          const isFirstPlayoffSection = section.sectionKey.startsWith('playoff-') &&
            !gameSections.slice(0, sectionIdx).some(s => s.sectionKey.startsWith('playoff-'));
          const ctaLabel = qtPredictionLocked
            ? t('stageTransition.checkQtPredictions')
            : t('stageTransition.predictQualifiedTeams');

          return (
            <Fragment key={section.sectionKey}>
              {section.label && (
                isFirstPlayoffSection ? (
                  <StageTransitionBanner
                    label={section.label}
                    ctaLabel={ctaLabel}
                    ctaHref={qualifiedTeamsHref}
                  />
                ) : (
                  <StageSeparator label={section.label} />
                )
              )}
              {section.games.map(game => {
                const gameGuess = gameGuesses[game.id];
                const isPlayoffGame = game.playoffStage !== null && game.playoffStage !== undefined;

                return (
                  <Box
                    key={game.id}
                    id={`game-${game.id}`}
                    data-game-id={game.id}
                  >
                    <FlippableGameCard
                      game={game}
                      teamsMap={teamsMap}
                      isPlayoffs={isPlayoffGame}
                      tournamentId={tournamentId}
                      homeScore={gameGuess?.home_score}
                      awayScore={gameGuess?.away_score}
                      homePenaltyWinner={gameGuess?.home_penalty_winner}
                      awayPenaltyWinner={gameGuess?.away_penalty_winner}
                      boostType={gameGuess?.boost_type}
                      initialBoostType={gameGuess?.boost_type}
                      isEditing={editingGameId === game.id}
                      onEditStart={() => handleEditStart(game.id)}
                      onEditEnd={handleEditEnd}
                      disabled={false}
                      onAutoAdvanceNext={() => handleAutoAdvanceNext(game.id)}
                      onAutoGoPrevious={() => handleAutoGoPrevious(game.id)}
                      onStageClick={onGameStageClick ? () => onGameStageClick(game) : undefined}
                      isGuidedMode={true}
                    />
                  </Box>
                );
              })}
            </Fragment>
          );
        })}
      </Box>

      {/* Back to top button - only show on desktop if more than 1 game */}
      {games.length > 1 && (
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center', pt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowUpwardIcon />}
            onClick={handleScrollToTop}
            sx={{ minWidth: 200 }}
          >
            {t('navigation.backToTop')}
          </Button>
        </Box>
      )}
    </Box>
  );
}
