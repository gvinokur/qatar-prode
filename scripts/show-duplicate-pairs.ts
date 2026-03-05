#!/usr/bin/env tsx
import * as path from 'path';
import * as fs from 'fs';

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

const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
const csvRecords = parseCSV(csvContent);

// Find duplicates
const comboCount = new Map<string, any[]>();
for (const row of csvRecords) {
  const combo = row.qualifying_groups_combination;
  if (!comboCount.has(combo)) {
    comboCount.set(combo, []);
  }
  comboCount.get(combo)!.push(row);
}

const duplicates = Array.from(comboCount.entries())
  .filter(([_, rows]) => rows.length > 1)
  .sort((a, b) => parseInt(a[1][0].Option) - parseInt(b[1][0].Option));

console.log(`Found ${duplicates.length} duplicate pairs:\n`);

for (let i = 0; i < duplicates.length; i++) {
  const [combo, rows] = duplicates[i];
  console.log(`=== Duplicate ${i + 1}/${duplicates.length}: ${combo} ===`);

  for (const row of rows) {
    console.log(`Option ${row.Option}:`);
    console.log(`  1A-CEFHI: ${row['1A - CEFHI']}`);
    console.log(`  1B-EFGIJ: ${row['1B - EFGIJ']}`);
    console.log(`  1D-BEFIJ: ${row['1D - BEFIJ']}`);
    console.log(`  1E-ABCDF: ${row['1E - ABCDF']}`);
    console.log(`  1G-AEHIJ: ${row['1G - AEHIJ']}`);
    console.log(`  1I-CDFGH: ${row['1I - CDFGH']}`);
    console.log(`  1K-DEIJL: ${row['1K - DEIJL']}`);
    console.log(`  1L-EHIJK: ${row['1L - EHIJK']}`);
  }
  console.log();
}
