import { upsertThirdPlaceRule } from '../app/db/tournament-third-place-rules-repository';
import { FIFA_2026_THIRD_PLACE_RULES } from '../data/fifa-2026/third-place-rules';

/**
 * Import the 495 FIFA 2026 World Cup third-place assignment rules into the database
 *
 * Usage: npx ts-node scripts/import-fifa-2026-rules.ts <tournament-id>
 */

async function importRules() {
  const tournamentId = process.argv[2];

  if (!tournamentId) {
    console.error('Usage: npx ts-node scripts/import-fifa-2026-rules.ts <tournament-id>');
    process.exit(1);
  }

  console.log(`Importing FIFA 2026 rules for tournament: ${tournamentId}`);
  console.log(`Found ${FIFA_2026_THIRD_PLACE_RULES.length} rules to import`);

  let successCount = 0;
  let errorCount = 0;

  // Import each rule
  for (let i = 0; i < FIFA_2026_THIRD_PLACE_RULES.length; i++) {
    const rule = FIFA_2026_THIRD_PLACE_RULES[i];

    try {
      await upsertThirdPlaceRule(
        tournamentId,
        rule.combination,
        rule.matchups
      );
      successCount++;

      if ((i + 1) % 100 === 0) {
        console.log(`Progress: ${i + 1}/${FIFA_2026_THIRD_PLACE_RULES.length} rules imported`);
      }
    } catch (error) {
      console.error(`Error importing rule ${rule.combination}:`, error);
      errorCount++;
    }
  }

  console.log('\nImport complete!');
  console.log(`Successfully imported: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`\nTotal rules in database: ${successCount}`);
}

importRules()
  .then(() => {
    console.log('Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
