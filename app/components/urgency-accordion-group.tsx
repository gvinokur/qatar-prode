'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { UrgencyAccordion } from './urgency-accordion';
import { useCountdownContext } from './context-providers/countdown-context-provider';
import type { ExtendedGameData } from '../definitions';
import type { Team, GameGuessNew } from '../db/tables-definition';

interface UrgencyAccordionGroupProps {
  readonly games: ExtendedGameData[];
  readonly teamsMap: Record<string, Team>;
  readonly gameGuesses: Record<string, GameGuessNew>;
  readonly tournamentId: string;
  readonly isPlayoffs?: boolean;
}

const ONE_HOUR = 60 * 60 * 1000;

export function UrgencyAccordionGroup({
  games,
  teamsMap,
  gameGuesses,
  tournamentId,
  isPlayoffs: _isPlayoffs
}: UrgencyAccordionGroupProps) {
  const router = useRouter();
  const t = useTranslations('predictions');
  const locale = useLocale();
  const [expandedTierId, setExpandedTierId] = useState<string | null>(null);

  const { currentTime } = useCountdownContext();

  // Filter games by urgency tier
  const filteredGames = useMemo(() => {
    const now = currentTime;
    const urgent: ExtendedGameData[] = [];
    const warning: ExtendedGameData[] = [];
    const notice: ExtendedGameData[] = [];

    games.forEach(game => {
      const deadline = game.game_date.getTime() - ONE_HOUR;
      const timeUntilClose = deadline - now;

      // Only include games closing within 48 hours
      if (timeUntilClose > 48 * ONE_HOUR || timeUntilClose < -ONE_HOUR) {
        return;
      }

      if (timeUntilClose < 2 * ONE_HOUR) {
        urgent.push(game);
      } else if (timeUntilClose < 24 * ONE_HOUR) {
        warning.push(game);
      } else {
        notice.push(game);
      }
    });

    // Sort by deadline (earliest first)
    const sortByDeadline = (a: ExtendedGameData, b: ExtendedGameData) =>
      a.game_date.getTime() - b.game_date.getTime();

    return {
      urgent: urgent.toSorted(sortByDeadline),
      warning: warning.toSorted(sortByDeadline),
      notice: notice.toSorted(sortByDeadline)
    };
  }, [games, currentTime]);

  // Check if a game is predicted
  const isPredicted = (game: ExtendedGameData): boolean => {
    const guess = gameGuesses[game.id];
    return !!(
      guess &&
      guess.home_score != null &&
      guess.away_score != null &&
      typeof guess.home_score === 'number' &&
      typeof guess.away_score === 'number'
    );
  };

  // Auto-expand urgent tier on mount if it has unpredicted games
  useEffect(() => {
    if (filteredGames.urgent.length > 0) {
      const hasUnpredictedUrgent = filteredGames.urgent.some(game => !isPredicted(game));
      if (hasUnpredictedUrgent) {
        setExpandedTierId('urgent');
      }
    }
  }, []); // Only run on mount

  const handleToggle = (tierId: string) => {
    setExpandedTierId(prevId => prevId === tierId ? null : tierId);
  };

  const handleEditGame = (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (game) {
      router.push(`/${locale}/tournaments/${tournamentId}/games?edit=${gameId}`);
    }
  };

  // Build title messages with i18n pluralization and unpredicted count
  const buildTitle = (totalCount: number, unpredictedCount: number, timeframe: string): string => {
    let title = t('urgency.games', { count: totalCount, timeframe });

    if (unpredictedCount > 0) {
      title += t('urgency.unpredicted', { count: unpredictedCount });
    }

    return title;
  };

  // Calculate unpredicted counts for each tier
  const urgentUnpredicted = filteredGames.urgent.filter(game => !isPredicted(game)).length;
  const warningUnpredicted = filteredGames.warning.filter(game => !isPredicted(game)).length;
  const noticeUnpredicted = filteredGames.notice.filter(game => !isPredicted(game)).length;

  return (
    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
      {/* Urgent tier (< 2h) */}
      {filteredGames.urgent.length > 0 && (
        <UrgencyAccordion
          severity="error"
          title={buildTitle(filteredGames.urgent.length, urgentUnpredicted, t('urgency.timeframes.twoHours'))}
          games={filteredGames.urgent}
          teamsMap={teamsMap}
          gameGuesses={gameGuesses}
          isExpanded={expandedTierId === 'urgent'}
          onToggle={handleToggle}
          tierId="urgent"
          onEditGame={handleEditGame}
        />
      )}

      {/* Warning tier (2-24h) */}
      {filteredGames.warning.length > 0 && (
        <UrgencyAccordion
          severity="warning"
          title={buildTitle(filteredGames.warning.length, warningUnpredicted, t('urgency.timeframes.twentyFourHours'))}
          games={filteredGames.warning}
          teamsMap={teamsMap}
          gameGuesses={gameGuesses}
          isExpanded={expandedTierId === 'warning'}
          onToggle={handleToggle}
          tierId="warning"
          onEditGame={handleEditGame}
        />
      )}

      {/* Notice tier (24-48h) */}
      {filteredGames.notice.length > 0 && (
        <UrgencyAccordion
          severity="info"
          title={buildTitle(filteredGames.notice.length, noticeUnpredicted, t('urgency.timeframes.twoDays'))}
          games={filteredGames.notice}
          teamsMap={teamsMap}
          gameGuesses={gameGuesses}
          isExpanded={expandedTierId === 'notice'}
          onToggle={handleToggle}
          tierId="notice"
          onEditGame={handleEditGame}
        />
      )}
    </Box>
  );
}
