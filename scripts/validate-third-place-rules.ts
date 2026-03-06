#!/usr/bin/env tsx
/**
 * Validation script for World Cup 2026 third place rules
 * Checks that the database has the correct number of entries
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables FIRST before any imports
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const WORLD_CUP_2026_ID = '280a5902-5dfc-4ffc-ba9b-73a4f32e4401';
const EXPECTED_RULE_COUNT = 495;

async function validateThirdPlaceRules() {
  // Import database modules AFTER environment is loaded
  const { db } = await import('../app/db/database');
  const { findThirdPlaceRulesByTournament } = await import('../app/db/tournament-third-place-rules-repository');

  console.log('🔍 Validating World Cup 2026 Third Place Rules...\n');

  try {
    // 1. Check tournament exists
    console.log('1️⃣ Checking tournament exists...');
    const tournament = await db
      .selectFrom('tournaments')
      .where('id', '=', WORLD_CUP_2026_ID)
      .select(['id', 'short_name', 'long_name'])
      .executeTakeFirst();

    if (!tournament) {
      console.error('❌ Tournament not found with ID:', WORLD_CUP_2026_ID);
      process.exit(1);
    }
    console.log(`✅ Tournament found: ${tournament.long_name || tournament.short_name}\n`);

    // 2. Count third place rules
    console.log('2️⃣ Counting third place rules...');
    const rules = await findThirdPlaceRulesByTournament(WORLD_CUP_2026_ID);
    const actualCount = rules.length;

    console.log(`   Expected: ${EXPECTED_RULE_COUNT} rules`);
    console.log(`   Actual:   ${actualCount} rules`);

    if (actualCount === EXPECTED_RULE_COUNT) {
      console.log(`✅ Count matches! Found ${actualCount} rules\n`);
    } else {
      console.error(`❌ Count mismatch! Expected ${EXPECTED_RULE_COUNT} but found ${actualCount}\n`);

      if (actualCount < EXPECTED_RULE_COUNT) {
        console.error(`   Missing ${EXPECTED_RULE_COUNT - actualCount} rules`);
      } else {
        console.error(`   ${actualCount - EXPECTED_RULE_COUNT} extra rules found`);
      }

      process.exit(1);
    }

    // 3. Show sample data
    console.log('3️⃣ Sample rules (first 5):');
    const samples = rules.slice(0, 5);
    samples.forEach((rule, idx) => {
      console.log(`   ${idx + 1}. ${rule.combination_key}: ${JSON.stringify(rule.rules)}`);
    });

    console.log('\n✨ Validation complete! All checks passed.');

  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

validateThirdPlaceRules();
