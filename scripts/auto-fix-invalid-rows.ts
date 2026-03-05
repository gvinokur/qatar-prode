#!/usr/bin/env tsx
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: __dirname + '/../.env.local' });

const CSV_PATH = __dirname + '/../extracted_data.csv';

// Map of rule keys to column positions (0-indexed after Option column)
const RULE_KEY_COLUMNS: Record<string, number> = {
  'CEFHI': 0,  // 1A
  'EFGIJ': 1,  // 1B
  'BEFIJ': 2,  // 1D
  'ABCDF': 3,  // 1E
  'AEHIJ': 4,  // 1G
  'CDFGH': 5,  // 1I
  'DEIJL': 6,  // 1K
  'EHIJK': 7   // 1L
};

async function autoFixInvalidRows() {
  const { db } = await import('../app/db/database.js');
  const { findThirdPlaceRulesByTournament, findThirdPlaceRuleByTournamentAndCombination } =
    await import('../app/db/tournament-third-place-rules-repository.js');

  const WORLD_CUP_2026_ID = '280a5902-5dfc-4ffc-ba9b-73a4f32e4401';

  console.log('🔧 Auto-fixing invalid rows...\n');

  // Get all valid combinations
  const dbRules = await findThirdPlaceRulesByTournament(WORLD_CUP_2026_ID);
  const validCombos = new Set(dbRules.map(r => r.combination_key));

  // Read CSV
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const header = lines[0];
  const dataLines = lines.slice(1).filter(l => l.trim());

  let fixCount = 0;
  const newLines = [header];

  for (const line of dataLines) {
    const parts = line.split(',').map(p => p.trim());
    const option = parts[0];
    const currentCombo = parts[9];

    if (!validCombos.has(currentCombo)) {
      console.log(`Fixing Option ${option}: ${currentCombo}`);

      // Extract current values
      const values = parts.slice(1, 9); // Columns 1A-1L

      // Build current rules
      const currentRules: Record<string, string> = {};
      Object.entries(RULE_KEY_COLUMNS).forEach(([key, idx]) => {
        currentRules[key] = values[idx].replace(/^3/, '');
      });

      // Try to find a matching valid combination by checking similar ones
      let foundFix = false;

      for (const dbRule of dbRules) {
        const expectedRules = dbRule.rules as Record<string, string>;
        let diffCount = 0;
        let fixColumn = -1;
        let fixValue = '';

        // Compare each rule
        Object.entries(expectedRules).forEach(([key, expectedValue]) => {
          const currentValue = currentRules[key];
          if (currentValue !== expectedValue) {
            diffCount++;
            fixColumn = RULE_KEY_COLUMNS[key];
            fixValue = expectedValue;
          }
        });

        // If only one difference, we found the fix!
        if (diffCount === 1) {
          values[fixColumn] = '3' + fixValue;
          const newCombo = dbRule.combination_key;
          const newLine = [option, ...values, newCombo].join(',');
          newLines.push(newLine);
          console.log(`  ✅ Fixed to ${newCombo} (changed column ${fixColumn + 1} to 3${fixValue})\n`);
          fixCount++;
          foundFix = true;
          break;
        }
      }

      if (!foundFix) {
        console.log(`  ⚠️  Could not auto-fix (multiple changes needed)\n`);
        newLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  }

  // Write back
  fs.writeFileSync(CSV_PATH, newLines.join('\n') + '\n');

  console.log(`\n✨ Fixed ${fixCount} invalid rows automatically!`);

  await db.destroy();
}

autoFixInvalidRows();
