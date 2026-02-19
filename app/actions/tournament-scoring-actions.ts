'use server';

import { auth } from '../../auth';
import { findTournamentById, updateTournament } from '../db/tournament-repository';
import { findGamesInTournament } from '../db/game-repository';
import { TournamentUpdate } from '../db/tables-definition';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '../../i18n.config';

/**
 * Get tournament scoring config (admin only)
 */
export async function getTournamentScoringConfigAction(tournamentId: string, locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  const session = await auth();
  if (!session?.user?.isAdmin) {
    throw new Error(t('unauthorized'));
  }

  const tournament = await findTournamentById(tournamentId);
  if (!tournament) {
    throw new Error(t('notFound'));
  }

  // Return scoring fields
  return {
    game_exact_score_points: tournament.game_exact_score_points ?? 2,
    game_correct_outcome_points: tournament.game_correct_outcome_points ?? 1,
    champion_points: tournament.champion_points ?? 5,
    runner_up_points: tournament.runner_up_points ?? 3,
    third_place_points: tournament.third_place_points ?? 1,
    individual_award_points: tournament.individual_award_points ?? 3,
    qualified_team_points: tournament.qualified_team_points ?? 1,
    exact_position_qualified_points: tournament.exact_position_qualified_points ?? 1,
    max_silver_games: tournament.max_silver_games ?? 0,
    max_golden_games: tournament.max_golden_games ?? 0,
  };
}

/**
 * Update tournament scoring config (admin only)
 */
export async function updateTournamentScoringConfigAction(
  tournamentId: string,
  update: TournamentUpdate,
  locale: Locale = 'es'
) {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  const session = await auth();
  if (!session?.user?.isAdmin) {
    throw new Error(t('unauthorized'));
  }

  return updateTournament(tournamentId, update);
}

/**
 * Get recommended point values based on tournament statistics
 */
export async function getRecommendedScoringValues(tournamentId: string, locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  const session = await auth();
  if (!session?.user?.isAdmin) {
    throw new Error(t('unauthorized'));
  }

  const games = await findGamesInTournament(tournamentId);
  const totalGames = games.length;
  const groupGames = games.filter(g => g.game_type === 'group').length;
  const playoffGames = totalGames - groupGames;

  // Calculate recommended values as percentage of total possible game points
  // Assuming average user scores ~50% on game predictions (0.5-1 point per game on average)
  const avgGamePoints = totalGames * 0.75; // Assume 0.75 average points per game

  return {
    game_exact_score_points: 2,
    game_correct_outcome_points: 1,
    champion_points: Math.max(10, Math.round(avgGamePoints * 0.13)), // ~13% of avg game points
    runner_up_points: Math.max(6, Math.round(avgGamePoints * 0.08)),  // ~8% of avg game points
    third_place_points: Math.max(4, Math.round(avgGamePoints * 0.05)), // ~5% of avg game points
    individual_award_points: Math.max(5, Math.round(avgGamePoints * 0.07)), // ~7% of avg game points
    qualified_team_points: 1,
    exact_position_qualified_points: 2,
    max_silver_games: Math.max(3, Math.round(totalGames * 0.10)), // 10% of games
    max_golden_games: Math.max(1, Math.round(totalGames * 0.03)), // 3% of games
    rationale: `Based on ${totalGames} total games (${groupGames} group, ${playoffGames} playoff). Tournament-level achievements weighted to be ~5-13% of expected game prediction points to create meaningful impact without overshadowing match predictions.`,
  };
}
