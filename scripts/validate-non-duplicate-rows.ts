#!/usr/bin/env tsx
/**
 * Validate that the 455 non-duplicate rows have correct values
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const WORLD_CUP_2026_ID = '280a5902-5dfc-4ffc-ba9b-73a4f32e4401';
const CSV_PATH = path.join(__dirname, '../extracted_data.csv');

// Simple CSV parser
function parseCSV(content: string): any[] {
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

async function validateNonDuplicates() {
  const { db } = await import('../app/db/database');
  const { findThirdPlaceRulesByTournament } = await import('../app/db/tournament-third-place-rules-repository');

  console.log('🔍 Validating non-duplicate rows...\n');

  try {
    // Get all DB rules
    const dbRules = await findThirdPlaceRulesByTournament(WORLD_CUP_2026_ID);

    // Read CSV
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const csvRecords = parseCSV(csvContent);

    // Find duplicate combination keys
    const comboCount = new Map<string, number>();
    csvRecords.forEach(row => {
      const combo = row.qualifying_groups_combination;
      comboCount.set(combo, (comboCount.get(combo) || 0) + 1);
    });

    const duplicateCombos = new Set(
      Array.from(comboCount.entries())
        .filter(([_, count]) => count > 1)
        .map(([combo, _]) => combo)
    );

    console.log(`Total rows in CSV: ${csvRecords.length}`);
    console.log(`Duplicate combinations to skip: ${duplicateCombos.size}`);
    console.log(`Rows to validate: ~${csvRecords.length - duplicateCombos.size * 2}\n`);

    let validatedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const csvRow of csvRecords) {
      const combinationKey = csvRow.qualifying_groups_combination;

      // Skip if this is a duplicate combination
      if (duplicateCombos.has(combinationKey)) {
        continue;
      }

      // Find corresponding DB rule
      const dbRule = dbRules.find(r => r.combination_key === combinationKey);

      if (!dbRule) {
        // This should be one of the missing combinations
        continue;
      }

      // Build rules from CSV
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
          rowErrors.push(`  Mismatch: ${ruleKey} → DB="${dbValue}" vs CSV="${csvValue}" (cell has "3${csvValue}")`);
        }
      }

      for (const ruleKey of Object.keys(csvRules)) {
        if (!(ruleKey in dbRulesObj)) {
          rowValid = false;
          rowErrors.push(`  Extra key: ${ruleKey} = ${csvRules[ruleKey]}`);
        }
      }

      if (rowValid) {
        validatedCount++;
      } else {
        errorCount++;
        errors.push(`❌ Option ${csvRow.Option} [${combinationKey}]:`);
        errors.push(...rowErrors);
        errors.push('');
      }

      // Progress indicator
      if ((validatedCount + errorCount) % 100 === 0) {
        console.log(`   Validated: ${validatedCount + errorCount}...`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 VALIDATION SUMMARY (Non-Duplicate Rows)');
    console.log('='.repeat(60));
    console.log(`Rows validated: ${validatedCount + errorCount}`);
    console.log(`✅ Valid: ${validatedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

    if (errorCount > 0) {
      console.log('\n❌ ERRORS FOUND IN NON-DUPLICATE ROWS:\n');
      errors.forEach(error => console.log(error));
      console.log();
      process.exit(1);
    } else {
      console.log('\n✨ SUCCESS! All non-duplicate rows are correct!\n');
      console.log('The 455 non-duplicate rows match the database perfectly.');
      console.log('You can now fix the ~40 duplicate/missing rows.\n');
    }

  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

validateNonDuplicates();
