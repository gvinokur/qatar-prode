/**
 * Validation script for materialized scores
 * Story #147: Materialize Score Calculations
 *
 * This script validates materialized scores against legacy aggregation calculations
 * for production spot-checks. Use this to verify score accuracy after deployment.
 *
 * Usage:
 *   npx tsx scripts/validate-materialized-scores.ts [tournament_id] [sample_size]
 *
 * Examples:
 *   npx tsx scripts/validate-materialized-scores.ts                    # Random 20 users from active tournaments
 *   npx tsx scripts/validate-materialized-scores.ts tournament-123     # Random 20 users from specific tournament
 *   npx tsx scripts/validate-materialized-scores.ts tournament-123 50  # Random 50 users from specific tournament
 */

import { db } from '../app/db/database';
import { getGameGuessStatisticsForUsers, legacyGetGameGuessStatisticsForUsers } from '../app/db/game-guess-repository';

interface ValidationResult {
  userId: string;
  tournamentId: string;
  field: string;
  materialized: number | undefined;
  legacy: number | undefined;
  match: boolean;
}

async function validateRandomUsers(
  tournamentId?: string,
  sampleSize: number = 20
): Promise<void> {
  console.log('Starting validation of materialized scores...\n');

  // Get tournament(s) to validate
  const tournamentsQuery = db.selectFrom('tournaments').select(['id', 'long_name']);
  const tournaments = tournamentId
    ? await tournamentsQuery.where('id', '=', tournamentId).execute()
    : await tournamentsQuery.where('is_active', '=', true).execute();

  if (tournaments.length === 0) {
    console.error('No tournaments found to validate');
    return;
  }

  console.log(`Validating ${sampleSize} random users across ${tournaments.length} tournament(s)...\n`);

  let totalMismatches = 0;
  let totalValidations = 0;

  for (const tournament of tournaments) {
    console.log(`Tournament: ${tournament.long_name} (${tournament.id})`);

    // Get random sample of users with game guesses
    const userSample = await db
      .selectFrom('game_guesses')
      .innerJoin('games', 'games.id', 'game_guesses.game_id')
      .where('games.tournament_id', '=', tournament.id)
      .select('game_guesses.user_id')
      .distinct()
      .limit(sampleSize)
      .execute();

    const userIds = userSample.map(u => u.user_id);
    console.log(`  Checking ${userIds.length} users...`);

    // Fetch both materialized and legacy stats
    const [materializedStats, legacyStats] = await Promise.all([
      getGameGuessStatisticsForUsers(userIds, tournament.id),
      legacyGetGameGuessStatisticsForUsers(userIds, tournament.id),
    ]);

    // Compare results
    const mismatches: ValidationResult[] = [];
    const fieldsToCheck = [
      'total_score',
      'group_score',
      'playoff_score',
      'total_boost_bonus',
      'group_boost_bonus',
      'playoff_boost_bonus',
      'total_correct_guesses',
      'total_exact_guesses',
      'group_correct_guesses',
      'group_exact_guesses',
      'playoff_correct_guesses',
      'playoff_exact_guesses',
      'yesterday_total_score',
      'yesterday_boost_bonus',
    ];

    for (const userId of userIds) {
      const materialized = materializedStats.find(s => s.user_id === userId);
      const legacy = legacyStats.find(s => s.user_id === userId);

      for (const field of fieldsToCheck) {
        totalValidations++;
        const matValue = materialized?.[field as keyof typeof materialized];
        const legValue = legacy?.[field as keyof typeof legacy];

        if (matValue !== legValue) {
          totalMismatches++;
          mismatches.push({
            userId,
            tournamentId: tournament.id,
            field,
            materialized: matValue as number | undefined,
            legacy: legValue as number | undefined,
            match: false,
          });
        }
      }
    }

    if (mismatches.length === 0) {
      console.log('  ✓ All scores match!\n');
    } else {
      console.error(`  ✗ Found ${mismatches.length} mismatches:`);
      mismatches.forEach(m => {
        console.error(
          `    User ${m.userId} - ${m.field}: materialized=${m.materialized}, legacy=${m.legacy}`
        );
      });
      console.log('');
    }
  }

  // Summary
  console.log('='.repeat(60));
  console.log('Validation Summary:');
  console.log(`  Total validations: ${totalValidations}`);
  console.log(`  Mismatches: ${totalMismatches}`);
  console.log(`  Match rate: ${((1 - totalMismatches / totalValidations) * 100).toFixed(2)}%`);
  console.log('='.repeat(60));

  if (totalMismatches > 0) {
    console.error('\n⚠️  VALIDATION FAILED: Mismatches detected!');
    process.exit(1);
  } else {
    console.log('\n✓ VALIDATION PASSED: All scores match!');
  }
}

// Parse command line arguments
const tournamentId = process.argv[2];
const sampleSize = process.argv[3] ? parseInt(process.argv[3], 10) : 20;

// Run validation
validateRandomUsers(tournamentId, sampleSize)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Validation failed with error:', error);
    process.exit(1);
  });
