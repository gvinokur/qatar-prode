/**
 * Backfill script for materialized game scores
 * Story #147: Materialize Score Calculations
 *
 * This script populates the new materialized score columns in tournament_guesses
 * for all existing users with game guesses.
 *
 * Usage:
 *   npx tsx scripts/backfill-materialized-scores.ts
 */

import { db } from '../app/db/database';
import { recalculateGameScoresForUsers } from '../app/db/tournament-guess-repository';

async function backfillMaterializedScores() {
  console.log('Starting backfill of materialized scores...');

  // Get all active tournaments (or all tournaments for complete backfill)
  const tournaments = await db
    .selectFrom('tournaments')
    .where('is_active', '=', true)  // Only active tournaments to minimize load
    .select(['id', 'long_name'])
    .execute();

  console.log(`Found ${tournaments.length} active tournaments`);

  for (const tournament of tournaments) {
    console.log(`\nProcessing tournament: ${tournament.long_name} (${tournament.id})`);

    // Get all users with game guesses for this tournament
    const userIds = await db
      .selectFrom('game_guesses')
      .innerJoin('games', 'games.id', 'game_guesses.game_id')
      .where('games.tournament_id', '=', tournament.id)
      .select('game_guesses.user_id')
      .distinct()
      .execute();

    console.log(`  Found ${userIds.length} users with guesses`);

    // Process in batches of 50 users to avoid memory issues
    const BATCH_SIZE = 50;
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE).map(u => u.user_id);
      console.log(`  Processing users ${i + 1}-${Math.min(i + BATCH_SIZE, userIds.length)}...`);

      try {
        await recalculateGameScoresForUsers(batch, tournament.id);
      } catch (error) {
        console.error(`  Error processing batch:`, error);
        // Continue with next batch (partial failure doesn't stop entire backfill)
      }
    }

    console.log(`  ✓ Completed tournament: ${tournament.long_name}`);
  }

  console.log('\n✓ Backfill complete!');
}

// Run backfill
backfillMaterializedScores()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });
