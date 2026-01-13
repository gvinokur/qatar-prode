/**
 * Update Third-Place Rules from FIFA Format to Our Format
 *
 * This script updates all existing third-place rules in the database
 * from the old FIFA format (keys: "1A", "1B") to our code format (keys: "CEFHI", "EFGIJ")
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { db } from '../app/db/database';

// Mapping from FIFA bracket positions to our third-place identifiers
const BRACKET_POSITION_TO_THIRD_PLACE_ID: { [key: string]: string } = {
  '1A': 'CEFHI',  // Game 79: 1A vs 3CEFHI
  '1B': 'EFGIJ',  // Game 85: 1B vs 3EFGIJ
  '1D': 'BEFIJ',  // Game 82: 1D vs 3BEFIJ
  '1E': 'ABCDF',  // Game 75: 1E vs 3ABCDF
  '1G': 'AEHIJ',  // Game 81: 1G vs 3AEHIJ
  '1I': 'CDFGH',  // Game 78: 1I vs 3CDFGH
  '1K': 'DEIJL',  // Game 88: 1K vs 3DEIJL
  '1L': 'EHIJK',  // Game 80: 1L vs 3EHIJK
};

async function updateThirdPlaceRules() {
  console.log('=== Updating Third-Place Rules Format ===\n');

  // Get all third-place rules from database
  const rules = await db
    .selectFrom('tournament_third_place_rules')
    .selectAll()
    .execute();

  console.log(`Found ${rules.length} rules to update\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const rule of rules) {
    const oldMatchups = rule.rules as any;

    // Check if this rule is already in the new format
    const hasOldFormat = Object.keys(oldMatchups).some(key => key.startsWith('1'));

    if (!hasOldFormat) {
      console.log(`⊘ Skipping rule ${rule.combination_key} (already in new format)`);
      skippedCount++;
      continue;
    }

    // Transform matchups from old to new format
    const newMatchups: { [key: string]: string } = {};

    for (const [bracketPosition, groupLetter] of Object.entries(oldMatchups)) {
      const thirdPlaceId = BRACKET_POSITION_TO_THIRD_PLACE_ID[bracketPosition];

      if (!thirdPlaceId) {
        console.warn(`⚠️  Unknown bracket position: ${bracketPosition} in rule ${rule.combination_key}`);
        continue;
      }

      newMatchups[thirdPlaceId] = groupLetter as string;
    }

    // Update the rule in database
    await db
      .updateTable('tournament_third_place_rules')
      .set({
        rules: newMatchups as any
      })
      .where('id', '=', rule.id)
      .execute();

    console.log(`✓ Updated rule ${rule.combination_key}`);
    updatedCount++;
  }

  console.log('\n=== Update Complete ===');
  console.log(`Updated: ${updatedCount} rules`);
  console.log(`Skipped: ${skippedCount} rules (already in new format)`);
  console.log(`Total: ${rules.length} rules\n`);
}

// Execute the update
updateThirdPlaceRules()
  .then(() => {
    console.log('✓ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  });
