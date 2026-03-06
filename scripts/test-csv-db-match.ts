#!/usr/bin/env tsx
/**
 * Test script to validate that CSV data matches database rules
 * for a specific combination key
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Simple CSV parser function
function parseCSV(content: string): any[] {
  // Normalize line endings to \n
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    return row;
  });
}

const WORLD_CUP_2026_ID = '280a5902-5dfc-4ffc-ba9b-73a4f32e4401';
const CSV_PATH = path.join(__dirname, '../extracted_data.csv');

async function testCombinationKey(testCombinationKey: string) {
  // Import database modules AFTER environment is loaded
  const { db } = await import('../app/db/database');
  const { findThirdPlaceRuleByTournamentAndCombination } = await import('../app/db/tournament-third-place-rules-repository');

  console.log(`🧪 Testing combination key: ${testCombinationKey}\n`);

  try {
    // 1. Get the rule from the database
    console.log('📊 Step 1: Fetching from database...');
    const dbRule = await findThirdPlaceRuleByTournamentAndCombination(
      WORLD_CUP_2026_ID,
      testCombinationKey
    );

    if (!dbRule) {
      console.error(`❌ No rule found in database for combination: ${testCombinationKey}`);
      process.exit(1);
    }

    console.log(`✅ Found database rule:`);
    console.log(`   Combination: ${dbRule.combination_key}`);
    console.log(`   Rules: ${JSON.stringify(dbRule.rules, null, 2)}\n`);

    // 2. Read CSV and find matching row
    console.log('📄 Step 2: Reading CSV...');
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const records = parseCSV(csvContent);

    // Find the row with matching combination_key
    const csvRow = records.find((row: any) =>
      row.qualifying_groups_combination === testCombinationKey
    );

    if (!csvRow) {
      console.error(`❌ No row found in CSV for combination: ${testCombinationKey}`);
      process.exit(1);
    }

    console.log(`✅ Found CSV row (Option ${csvRow.Option}):`);
    console.log(`   Full row:`, csvRow, '\n');

    // 3. Build rules object from CSV
    console.log('🔨 Step 3: Building rules object from CSV...');
    const csvRules: Record<string, string> = {};

    // Parse headers to extract rule_keys
    const headers = Object.keys(csvRow);

    for (const header of headers) {
      // Skip Option and qualifying_groups_combination columns
      if (header === 'Option' || header === 'qualifying_groups_combination') {
        continue;
      }

      // Extract rule_key from header (format: "1A - CEFHI")
      const match = header.match(/^1[A-Z] - (.+)$/);
      if (match) {
        const ruleKey = match[1]; // e.g., "CEFHI"
        const cellValue = csvRow[header]; // e.g., "3H"

        // Remove the "3" prefix to get just the group letter
        const groupLetter = cellValue.replace(/^3/, ''); // "3H" -> "H"

        csvRules[ruleKey] = groupLetter;
      }
    }

    console.log(`✅ Built CSV rules object:`);
    console.log(`   ${JSON.stringify(csvRules, null, 2)}\n`);

    // 4. Compare the two rules objects
    console.log('🔍 Step 4: Comparing database rules vs CSV rules...');

    const dbRulesObj = dbRule.rules as Record<string, string>;
    let allMatch = true;
    const differences: string[] = [];

    // Check all keys from database rules
    for (const [ruleKey, dbValue] of Object.entries(dbRulesObj)) {
      const csvValue = csvRules[ruleKey];

      if (csvValue === undefined) {
        allMatch = false;
        differences.push(`   ❌ Missing in CSV: ${ruleKey}`);
      } else if (csvValue !== dbValue) {
        allMatch = false;
        differences.push(`   ❌ Mismatch for ${ruleKey}: DB="${dbValue}" vs CSV="${csvValue}"`);
      } else {
        console.log(`   ✅ ${ruleKey}: ${dbValue} (matches)`);
      }
    }

    // Check for extra keys in CSV
    for (const ruleKey of Object.keys(csvRules)) {
      if (!(ruleKey in dbRulesObj)) {
        allMatch = false;
        differences.push(`   ❌ Extra in CSV: ${ruleKey} = ${csvRules[ruleKey]}`);
      }
    }

    console.log();

    if (differences.length > 0) {
      console.log('⚠️  Differences found:');
      differences.forEach(diff => console.log(diff));
      console.log();
    }

    if (allMatch) {
      console.log('✨ SUCCESS! CSV data matches database rules perfectly!\n');
    } else {
      console.error('❌ FAILURE! Mismatches found between CSV and database.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Get combination key from command line or use default
const testKey = process.argv[2] || 'DFGHIJKL';
testCombinationKey(testKey);
