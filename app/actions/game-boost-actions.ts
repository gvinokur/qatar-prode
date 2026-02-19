'use server';

import { getTranslations } from 'next-intl/server';
import type { Locale } from '../../i18n.config';
import { auth } from '../../auth';
import {
  setGameGuessBoost,
  countUserBoostsByType,
  getGameGuessWithBoost,
  getBoostAllocationBreakdown,
} from '../db/game-guess-repository';
import { findGameById } from '../db/game-repository';
import { findTournamentById } from '../db/tournament-repository';

/**
 * Set boost for game (with validation)
 */
export async function setGameBoostAction(gameId: string, boostType: 'silver' | 'golden' | null, locale: Locale = 'es') {
  try {
    const t = await getTranslations({ locale, namespace: 'games' });
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: t('unauthorized') };
    }

    const game = await findGameById(gameId);
    if (!game) {
      return { success: false, error: t('notFound') };
    }

    // Check if game has started
    if (new Date() >= game.game_date) {
      return { success: false, error: t('boost.cannotSetAfterStart') };
    }

    // Get tournament for limits
    const tournament = await findTournamentById(game.tournament_id);
    if (!tournament) {
      const tErrors = await getTranslations({ locale, namespace: 'errors' });
      return { success: false, error: tErrors('generic') };
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
        return { success: false, error: t('boost.maxSilverReached', { max: max_silver_games }) };
      }
      if (boostType === 'golden' && effectiveCount > max_golden_games) {
        return { success: false, error: t('boost.maxGoldenReached', { max: max_golden_games }) };
      }
    }

    const result = await setGameGuessBoost(session.user.id, gameId, boostType);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error setting game boost:', error);
    const tErrors = await getTranslations({ locale, namespace: 'errors' });
    return { success: false, error: tErrors('generic') };
  }
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
  try {
    const t = await getTranslations({ locale, namespace: 'games' });
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: t('unauthorized') };
    }

    const result = await getBoostAllocationBreakdown(session.user.id, tournamentId, boostType);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error getting boost allocation breakdown:', error);
    const tErrors = await getTranslations({ locale, namespace: 'errors' });
    return { success: false, error: tErrors('generic') };
  }
}
