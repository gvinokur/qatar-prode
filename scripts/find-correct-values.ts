#!/usr/bin/env tsx
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function findCorrectValues() {
  const { db } = await import('../app/db/database');
  const { findThirdPlaceRulesByTournament } = await import('../app/db/tournament-third-place-rules-repository');

  const WORLD_CUP_2026_ID = '280a5902-5dfc-4ffc-ba9b-73a4f32e4401';

  // Get all DB rules
  const dbRules = await findThirdPlaceRulesByTournament(WORLD_CUP_2026_ID);

  // The 40 missing combinations from the validation
  const missingCombos = [
    'DEFGHJKL', 'CDEGHIJL', 'BDFGHIJL', 'BDEGHJKL', 'BDEFHJKL',
    'BCFGHIJL', 'BCEFGIJL', 'BCDFGHJL', 'AEFGHJKL', 'ADFGHIJL',
    'ADEFGHJK', 'ACDEFHKL', 'ABDFGHJL', 'ABDFGHJK', 'ABDEFGJK',
    'ABDEFGIJ', 'ABDEFGHJ', 'ABCFGHJK', 'ABCFGHIJ', 'ABCEFHJK',
    'ABCEFGJL', 'ABCEFGJK', 'ABCEFGIJ', 'ABCDGHJL', 'ABCDGHJK',
    'ABCDGHIJ', 'ABCDFGJL', 'ABCDFGJK', 'ABCDFGIJ', 'ABCDFGHJ',
    'ABCDEGJL', 'ABCDEGJK', 'ABCDEGHJ', 'ABCDEFGJ', 'CDFHIJKL',
    'ABDFGHIJ', 'ABDEFGJL', 'ABCFGHJL', 'ABCEFGHJ', 'ABCDEGIJ'
  ];

  console.log('Missing combinations that should exist:\n');

  for (const combo of missingCombos.slice(0, 5)) {
    const rule = dbRules.find(r => r.combination_key === combo);
    if (rule) {
      console.log(`${combo}:`);
      console.log(`  ${JSON.stringify(rule.rules)}\n`);
    }
  }

  // Show what DEFGHIKL (the duplicate) looks like
  console.log('\nThe DUPLICATE combination (DEFGHIKL):');
  const dup = dbRules.find(r => r.combination_key === 'DEFGHIKL');
  if (dup) {
    console.log(`  ${JSON.stringify(dup.rules)}\n`);
  }

  await db.destroy();
}

findCorrectValues();
