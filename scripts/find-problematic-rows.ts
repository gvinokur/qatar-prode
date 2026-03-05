#!/usr/bin/env tsx
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const CSV_PATH = path.join(__dirname, '../extracted_data.csv');

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

async function findProblematicRows() {
  const { db } = await import('../app/db/database');
  const { findThirdPlaceRulesByTournament } = await import('../app/db/tournament-third-place-rules-repository');

  const WORLD_CUP_2026_ID = '280a5902-5dfc-4ffc-ba9b-73a4f32e4401';

  console.log('🔍 Finding problematic rows in CSV...\n');

  try {
    // Get all valid combinations from DB
    const dbRules = await findThirdPlaceRulesByTournament(WORLD_CUP_2026_ID);
    const validCombos = new Set(dbRules.map(r => r.combination_key));

    // Read CSV
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const csvRecords = parseCSV(csvContent);

    // Find CSV combinations that don't exist in DB
    const invalidRows: any[] = [];
    const csvComboCount = new Map<string, number>();

    for (const row of csvRecords) {
      const combo = row.qualifying_groups_combination;
      csvComboCount.set(combo, (csvComboCount.get(combo) || 0) + 1);

      if (!validCombos.has(combo)) {
        invalidRows.push(row);
      }
    }

    // Find duplicates in CSV
    const duplicates = Array.from(csvComboCount.entries())
      .filter(([_, count]) => count > 1)
      .map(([combo, count]) => ({ combo, count }));

    console.log('📊 Analysis:');
    console.log(`Total CSV rows: ${csvRecords.length}`);
    console.log(`Total DB combinations: ${dbRules.length}`);
    console.log(`Invalid rows (combo not in DB): ${invalidRows.length}`);
    console.log(`Duplicate combinations: ${duplicates.length}\n`);

    if (invalidRows.length > 0) {
      console.log('❌ Rows with invalid combinations:');
      for (const row of invalidRows) {
        console.log(`  Option ${row.Option}: ${row.qualifying_groups_combination}`);
      }
      console.log();
    }

    if (duplicates.length > 0) {
      console.log('🔄 Duplicate combinations in CSV:');
      for (const { combo, count } of duplicates) {
        console.log(`  ${combo}: appears ${count} times`);
        const options = csvRecords
          .filter(r => r.qualifying_groups_combination === combo)
          .map(r => r.Option);
        console.log(`    Options: ${options.join(', ')}`);
      }
      console.log();
    }

    // Show missing combinations from DB
    const csvCombos = new Set(csvRecords.map(r => r.qualifying_groups_combination));
    const missingFromCSV = dbRules
      .filter(r => !csvCombos.has(r.combination_key))
      .map(r => r.combination_key);

    console.log('📋 Combinations in DB but missing from CSV:');
    console.log(`  Total: ${missingFromCSV.length}`);
    console.log(`  ${missingFromCSV.join(', ')}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

findProblematicRows();
