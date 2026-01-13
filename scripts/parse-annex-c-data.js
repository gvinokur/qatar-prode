const fs = require('fs');

/**
 * Parse the FIFA Annex C data from the downloaded CSV
 * and convert it to our format
 */

// Read the downloaded file
const fileContent = fs.readFileSync('/tmp/best3-data.js', 'utf-8');

// Extract the CSV content from the JavaScript file
const csvMatch = fileContent.match(/const best3CsvContent = `\n([\s\S]+?)`/);
if (!csvMatch) {
  console.error('Could not extract CSV content');
  process.exit(1);
}

const csvContent = csvMatch[1];
const lines = csvContent.trim().split('\n');

// Parse CSV (simple parser, assuming no commas in quoted fields)
function parseCsvLine(line) {
  return line.split(',').map(field => field.trim().replace(/^"|"$/g, ''));
}

const headers = parseCsvLine(lines[0]);
console.log('Total lines in CSV:', lines.length);
console.log('Processing data rows...');

// Process each data row
const rules = [];

for (let i = 1; i < lines.length; i++) {
  const fields = parseCsvLine(lines[i]);

  // Skip empty lines
  if (fields.length < 20) continue;

  // Columns 1-12 contain the qualifying groups (A-L)
  // Each column represents a group, and if it has a value, that group's 3rd place team qualifies
  const qualifyingGroups = [];

  for (let col = 1; col <= 12; col++) {
    const value = fields[col] && fields[col].trim();
    // Only include single letter group identifiers (A-L)
    if (value && value.length === 1 && value >= 'A' && value <= 'L') {
      qualifyingGroups.push(value);
    }
  }

  // Sort the qualifying groups to create the combination key
  const combinationKey = qualifyingGroups.sort().join('');

  if (qualifyingGroups.length !== 8) {
    console.warn(`Row ${i}: Expected 8 qualifying groups, found ${qualifyingGroups.length}`);
    continue;
  }

  // Parse the matchups
  // The matchup columns are at indices 14-21 (after empty column 13)
  // These correspond to bracket positions: 1A, 1B, 1D, 1E, 1G, 1I, 1K, 1L
  // Values are formatted as "3X" where X is the group letter
  const matchups = {};

  const matchupGroups = ['1A', '1B', '1D', '1E', '1G', '1I', '1K', '1L'];
  const matchupStartCol = 14;

  for (let j = 0; j < matchupGroups.length; j++) {
    const opponent = fields[matchupStartCol + j];
    if (opponent && opponent.startsWith('3')) {
      const thirdPlaceGroup = opponent.substring(1); // Remove '3' prefix
      matchups[matchupGroups[j]] = thirdPlaceGroup;
    }
  }

  rules.push({
    combination: combinationKey,
    matchups: matchups
  });
}

console.log(`\nParsed ${rules.length} rules`);
console.log('\nFirst 3 rules:');
console.log(JSON.stringify(rules.slice(0, 3), null, 2));
console.log('\nLast 3 rules:');
console.log(JSON.stringify(rules.slice(-3), null, 2));

// Write to output file
const outputPath = '/Users/gvinokur/Personal/qatar-prode/data/fifa-2026/annex-c-rules-raw.json';
fs.writeFileSync(outputPath, JSON.stringify(rules, null, 2));
console.log(`\nWrote raw rules to: ${outputPath}`);
console.log(`Total combinations: ${rules.length}`);
