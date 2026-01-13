'use server';

import { auth } from '../../auth';
import {
  setGameGuessBoost,
  countUserBoostsByType,
  getGameGuessWithBoost,
} from '../db/game-guess-repository';
import { findGameById } from '../db/game-repository';
import { findTournamentById } from '../db/tournament-repository';

/**
 * Set boost for game (with validation)
 */
export async function setGameBoostAction(gameId: string, boostType: 'silver' | 'golden' | null) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const game = await findGameById(gameId);
  if (!game) {
    throw new Error('Game not found');
  }

  // Check if game has started
  if (new Date() >= game.game_date) {
    throw new Error('Cannot set boost after game starts');
  }

  // Get tournament for limits
  const tournament = await findTournamentById(game.tournament_id);
  if (!tournament) {
    throw new Error('Tournament not found');
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
      throw new Error(`Maximum ${max_silver_games} silver games allowed`);
    }
    if (boostType === 'golden' && effectiveCount > max_golden_games) {
      throw new Error(`Maximum ${max_golden_games} golden games allowed`);
    }
  }

  return setGameGuessBoost(session.user.id, gameId, boostType);
}

/**
 * Get boost counts for tournament
 */
export async function getBoostCountsAction(tournamentId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const [counts, tournament] = await Promise.all([
    countUserBoostsByType(session.user.id, tournamentId),
    findTournamentById(tournamentId),
  ]);

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  return {
    silver: { used: counts.silver, max: tournament.max_silver_games ?? 0 },
    golden: { used: counts.golden, max: tournament.max_golden_games ?? 0 },
  };
}
