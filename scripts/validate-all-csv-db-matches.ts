#!/usr/bin/env tsx
/**
 * Validation script to verify ALL 495 CSV rows match database rules
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const WORLD_CUP_2026_ID = '280a5902-5dfc-4ffc-ba9b-73a4f32e4401';
const CSV_PATH = path.join(__dirname, '../extracted_data.csv');

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

async function validateAllCombinations() {
  // Import database modules AFTER environment is loaded
  const { db } = await import('../app/db/database');
  const { findThirdPlaceRulesByTournament } = await import('../app/db/tournament-third-place-rules-repository');

  console.log('🔍 Validating ALL 495 CSV rows against database rules...\n');

  try {
    // 1. Get all rules from database
    console.log('📊 Step 1: Fetching all rules from database...');
    const dbRules = await findThirdPlaceRulesByTournament(WORLD_CUP_2026_ID);
    console.log(`✅ Found ${dbRules.length} rules in database\n`);

    // 2. Read CSV
    console.log('📄 Step 2: Reading CSV...');
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const csvRecords = parseCSV(csvContent);
    console.log(`✅ Found ${csvRecords.length} rows in CSV\n`);

    // 3. Create a map of CSV records by combination_key
    const csvMap = new Map<string, any>();
    for (const row of csvRecords) {
      csvMap.set(row.qualifying_groups_combination, row);
    }

    // 4. Validate each database rule against CSV
    console.log('🔍 Step 3: Validating each combination...\n');

    let validCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < dbRules.length; i++) {
      const dbRule = dbRules[i];
      const combinationKey = dbRule.combination_key;

      // Progress indicator every 50 combinations
      if ((i + 1) % 50 === 0) {
        console.log(`   Progress: ${i + 1}/${dbRules.length} validated...`);
      }

      // Find corresponding CSV row
      const csvRow = csvMap.get(combinationKey);

      if (!csvRow) {
        errorCount++;
        errors.push(`❌ [${combinationKey}] Missing in CSV`);
        continue;
      }

      // Build rules object from CSV
      const csvRules: Record<string, string> = {};
      const headers = Object.keys(csvRow);

      for (const header of headers) {
        if (header === 'Option' || header === 'qualifying_groups_combination') {
          continue;
        }

        const match = header.match(/^1[A-Z] - (.+)$/);
        if (match) {
          const ruleKey = match[1];
          const cellValue = csvRow[header];
          const groupLetter = cellValue.replace(/^3/, '');
          csvRules[ruleKey] = groupLetter;
        }
      }

      // Compare rules
      const dbRulesObj = dbRule.rules as Record<string, string>;
      let rowValid = true;
      const rowErrors: string[] = [];

      for (const [ruleKey, dbValue] of Object.entries(dbRulesObj)) {
        const csvValue = csvRules[ruleKey];

        if (csvValue === undefined) {
          rowValid = false;
          rowErrors.push(`  Missing key: ${ruleKey}`);
        } else if (csvValue !== dbValue) {
          rowValid = false;
          rowErrors.push(`  Mismatch: ${ruleKey} → DB="${dbValue}" vs CSV="${csvValue}"`);
        }
      }

      // Check for extra keys in CSV
      for (const ruleKey of Object.keys(csvRules)) {
        if (!(ruleKey in dbRulesObj)) {
          rowValid = false;
          rowErrors.push(`  Extra key: ${ruleKey} = ${csvRules[ruleKey]}`);
        }
      }

      if (rowValid) {
        validCount++;
      } else {
        errorCount++;
        errors.push(`❌ [${combinationKey}] (Option ${csvRow.Option}):`);
        errors.push(...rowErrors);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total combinations tested: ${dbRules.length}`);
    console.log(`✅ Valid: ${validCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

    if (errorCount > 0) {
      console.log('\n❌ ERRORS FOUND:\n');
      errors.forEach(error => console.log(error));
      console.log();
      process.exit(1);
    } else {
      console.log('\n✨ SUCCESS! All 495 combinations match perfectly!\n');
    }

  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

validateAllCombinations();
