'use client'

import React, { useState, useMemo, useEffect, useContext } from 'react';
import { Box } from '@mui/material';
import { UrgencyAccordion } from './urgency-accordion';
import GameResultEditDialog from './game-result-edit-dialog';
import { GuessesContext } from './context-providers/guesses-context-provider';
import { useCountdownContext } from './context-providers/countdown-context-provider';
import { getGuessLoser, getGuessWinner } from '../utils/score-utils';
import { getTeamDescription } from '../utils/playoffs-rule-helper';
import { updateOrCreateTournamentGuess } from '../actions/guesses-actions';
import { useSession } from 'next-auth/react';
import type { ExtendedGameData } from '../definitions';
import type { Team, GameGuessNew } from '../db/tables-definition';

interface UrgencyAccordionGroupProps {
  readonly games: ExtendedGameData[];
  readonly teamsMap: Record<string, Team>;
  readonly gameGuesses: Record<string, GameGuessNew>;
  readonly tournamentId: string;
  readonly isPlayoffs: boolean;
}

const ONE_HOUR = 60 * 60 * 1000;

export function UrgencyAccordionGroup({
  games,
  teamsMap,
  gameGuesses,
  tournamentId: _tournamentId,
  isPlayoffs: _isPlayoffs
}: UrgencyAccordionGroupProps) {
  const [expandedTierId, setExpandedTierId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<ExtendedGameData | null>(null);

  const { currentTime } = useCountdownContext();
  const groupContext = useContext(GuessesContext);
  const { data } = useSession();

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
      setSelectedGame(game);
      setEditDialogOpen(true);
    }
  };

  const handleGameResultSave = async (
    gameId: string,
    homeScore?: number,
    awayScore?: number,
    homePenaltyWinner?: boolean,
    awayPenaltyWinner?: boolean,
    boostType?: 'silver' | 'golden' | null
  ) => {
    if (!selectedGame) return;

    const updatedGameGuess = {
      ...(gameGuesses[gameId] || {
        game_id: gameId,
        user_id: data?.user?.id || '',
        home_team: selectedGame.home_team,
        away_team: selectedGame.away_team
      }),
      home_score: homeScore,
      away_score: awayScore,
      home_penalty_winner: homePenaltyWinner || false,
      away_penalty_winner: awayPenaltyWinner || false,
      boost_type: boostType
    };

    // Update via context
    await groupContext.updateGameGuess(gameId, updatedGameGuess);

    // Handle tournament-level guesses for finals/third-place
    if (selectedGame.playoffStage?.is_final || selectedGame.playoffStage?.is_third_place) {
      if (updatedGameGuess?.home_team && updatedGameGuess?.away_team) {
        const winner_team_id = getGuessWinner(updatedGameGuess, updatedGameGuess.home_team, updatedGameGuess.away_team);
        const loser_team_id = getGuessLoser(updatedGameGuess, updatedGameGuess.home_team, updatedGameGuess.away_team);

        if (selectedGame.playoffStage.is_final) {
          await updateOrCreateTournamentGuess({
            user_id: data?.user?.id || '',
            tournament_id: selectedGame.tournament_id,
            champion_team_id: winner_team_id,
            runner_up_team_id: loser_team_id,
          });
        } else if (selectedGame.playoffStage.is_third_place) {
          await updateOrCreateTournamentGuess({
            user_id: data?.user?.id || '',
            tournament_id: selectedGame.tournament_id,
            third_place_team_id: loser_team_id,
          });
        }
      }
    }
  };

  // Get team names for dialog
  const getTeamNames = () => {
    if (!selectedGame) return { homeTeamName: 'Unknown', awayTeamName: 'Unknown' };

    const gameGuess = gameGuesses[selectedGame.id];
    const homeTeam = selectedGame.home_team || gameGuess?.home_team;
    const awayTeam = selectedGame.away_team || gameGuess?.away_team;

    return {
      homeTeamName: homeTeam ? teamsMap[homeTeam].name : getTeamDescription(selectedGame.home_team_rule),
      awayTeamName: awayTeam ? teamsMap[awayTeam].name : getTeamDescription(selectedGame.away_team_rule)
    };
  };

  const { homeTeamName, awayTeamName } = getTeamNames();
  const gameGuess = selectedGame ? gameGuesses[selectedGame.id] : undefined;

  // Build title messages with Spanish pluralization and unpredicted count
  const buildTitle = (totalCount: number, unpredictedCount: number, timeframe: string): string => {
    const plural = totalCount > 1;
    let title = `${totalCount} partido${plural ? 's' : ''} cierra${plural ? 'n' : ''} en ${timeframe}`;

    if (unpredictedCount > 0) {
      title += `, ${unpredictedCount} sin predecir`;
    }

    return title;
  };

  // Calculate unpredicted counts for each tier
  const urgentUnpredicted = filteredGames.urgent.filter(game => !isPredicted(game)).length;
  const warningUnpredicted = filteredGames.warning.filter(game => !isPredicted(game)).length;
  const noticeUnpredicted = filteredGames.notice.filter(game => !isPredicted(game)).length;

  return (
    <>
      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        {/* Urgent tier (< 2h) */}
        {filteredGames.urgent.length > 0 && (
          <UrgencyAccordion
            severity="error"
            title={buildTitle(filteredGames.urgent.length, urgentUnpredicted, '2 horas')}
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
            title={buildTitle(filteredGames.warning.length, warningUnpredicted, '24 horas')}
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
            title={buildTitle(filteredGames.notice.length, noticeUnpredicted, '2 días')}
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

      {/* Edit Dialog */}
      {data?.user && selectedGame && (
        <GameResultEditDialog
          isGameGuess={true}
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onGameGuessSave={handleGameResultSave}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
          gameId={selectedGame.id}
          gameNumber={selectedGame.game_number}
          initialHomeScore={gameGuess?.home_score}
          initialAwayScore={gameGuess?.away_score}
          initialHomePenaltyWinner={gameGuess?.home_penalty_winner}
          initialAwayPenaltyWinner={gameGuess?.away_penalty_winner}
          initialBoostType={gameGuess?.boost_type}
          isPlayoffGame={!!selectedGame.playoffStage}
          tournamentId={_tournamentId}
        />
      )}
    </>
  );
}
