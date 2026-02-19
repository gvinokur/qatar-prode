'use server';

import { auth } from '../../auth';
import {
  setGameGuessBoost,
  countUserBoostsByType,
  getGameGuessWithBoost,
  getBoostAllocationBreakdown,
} from '../db/game-guess-repository';
import { findGameById } from '../db/game-repository';
import { findTournamentById } from '../db/tournament-repository';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '../../i18n.config';

/**
 * Set boost for game (with validation)
 */
export async function setGameBoostAction(gameId: string, boostType: 'silver' | 'golden' | null, locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'games' });
  const tErrors = await getTranslations({ locale, namespace: 'errors' });
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error(tErrors('notAuthenticated'));
  }

  const game = await findGameById(gameId);
  if (!game) {
    throw new Error(t('notFound'));
  }

  // Check if game has started
  if (new Date() >= game.game_date) {
    throw new Error(t('boost.cannotSetAfterStart'));
  }

  // Get tournament for limits
  const tournament = await findTournamentById(game.tournament_id);
  if (!tournament) {
    const tTournaments = await getTranslations({ locale, namespace: 'tournaments' });
    throw new Error(tTournaments('notFound'));
  }

  const max_silver_games = tournament.max_silver_games ?? 0;
  const max_golden_games = tournament.max_golden_games ?? 0;

  // Check existing boost
  const existingGuess = await getGameGuessWithBoost(session.user.id, gameId);
  const existingBoostType = existingGuess?.boost_type;

  // Count current boosts
  const counts = await countUserBoostsByType(session.user.id, game.tournament_id);

  // Validate limits (only if adding or changing boost type)
  if (boostType && boostType !== existingBoostType) {
    const effectiveCount = existingBoostType && boostType !== existingBoostType
      ? counts[boostType]      // Switching types doesn't increase count
      : counts[boostType] + 1; // Adding new boost increases count

    if (boostType === 'silver' && effectiveCount > max_silver_games) {
      throw new Error(t('boost.maxSilverReached', { max: max_silver_games }));
    }
    if (boostType === 'golden' && effectiveCount > max_golden_games) {
      throw new Error(t('boost.maxGoldenReached', { max: max_golden_games }));
    }
  }

  return setGameGuessBoost(session.user.id, gameId, boostType);
}

/**
 * Get boost allocation breakdown for tournament
 * Returns how boosts are distributed across groups and playoffs
 */
export async function getBoostAllocationBreakdownAction(
  tournamentId: string,
  boostType: 'silver' | 'golden',
  locale: Locale = 'es'
) {
  const tErrors = await getTranslations({ locale, namespace: 'errors' });
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error(tErrors('notAuthenticated'));
  }

  return getBoostAllocationBreakdown(session.user.id, tournamentId, boostType);
}
