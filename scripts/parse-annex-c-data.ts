import * as fs from 'fs';

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
function parseCsvLine(line: string): string[] {
  return line.split(',').map(field => field.trim().replace(/^"|"$/g, ''));
}

const headers = parseCsvLine(lines[0]);
console.log('Headers:', headers);

// Process each data row
const rules: any[] = [];

for (let i = 1; i < lines.length; i++) {
  const fields = parseCsvLine(lines[i]);

  // Skip empty lines
  if (fields.length < 20) continue;

  // Columns 1-12 contain the qualifying groups (indices 4-15 after No. and empty columns)
  // Groups are in columns: A(1), B(2), C(3), D(4), E(5), F(6), G(7), H(8), I(9), J(10), K(11), L(12)
  const qualifyingGroups: string[] = [];

  for (let col = 4; col <= 15; col++) {
    if (fields[col] && fields[col].trim()) {
      qualifyingGroups.push(fields[col].trim());
    }
  }

  // Sort the qualifying groups to create the combination key
  const combinationKey = qualifyingGroups.sort().join('');

  if (qualifyingGroups.length !== 8) {
    console.warn(`Row ${i}: Expected 8 qualifying groups, found ${qualifyingGroups.length}`);
    continue;
  }

  // Parse the matchups
  // The matchup columns start after the qualifying groups
  // Format: "1A vs" at column 17, "1B vs" at 18, etc.
  // Values are at columns 17, 18, 19, 20, 21, 22, 23, 24
  const matchups: { [key: string]: string } = {};

  const matchupGroups = ['1A', '1B', '1D', '1E', '1G', '1I', '1K', '1L'];
  const matchupStartCol = 17;

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

// Write to output file
const outputPath = '/Users/gvinokur/Personal/qatar-prode/data/fifa-2026/annex-c-rules-raw.json';
fs.writeFileSync(outputPath, JSON.stringify(rules, null, 2));
console.log(`\nWrote raw rules to: ${outputPath}`);
