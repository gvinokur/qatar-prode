/**
 * Transform FIFA 2026 Third-Place Rules from Annex C format to our internal format
 *
 * FIFA format uses bracket positions as keys: "1A", "1B", etc.
 * Our code expects third-place identifiers as keys: "CEFHI", "EFGIJ", etc.
 *
 * This script reads annex-c-rules-raw.json and transforms it to the correct format.
 */

import fs from 'fs';
import path from 'path';

// Mapping from FIFA bracket positions to our third-place identifiers
// Based on the Round of 32 games where 1st place teams face 3rd place teams
const BRACKET_POSITION_TO_THIRD_PLACE_ID: { [key: string]: string } = {
  '1A': 'CEFHI',  // Game 79: 1A vs 3CEFHI
  '1B': 'EFGIJ',  // Game 85: 1B vs 3EFGIJ
  '1D': 'BEFIJ',  // Game 82: 1D vs 3BEFIJ
  '1E': 'ABCDF',  // Game 75: 1E vs 3ABCDF
  '1G': 'AEHIJ',  // Game 81: 1G vs 3AEHIJ
  '1I': 'CDFGH',  // Game 78: 1I vs 3CDFGH
  '1K': 'DEIJL',  // Game 88: 1K vs 3DEIJL
  '1L': 'EHIJK',  // Game 80: 1L vs 3EHIJK
};

interface FIFARuleRaw {
  combination: string;
  matchups: {
    [bracketPosition: string]: string;  // "1A": "H"
  };
}

interface TransformedRule {
  combination: string;
  matchups: {
    [thirdPlaceId: string]: string;  // "CEFHI": "H"
  };
}

async function transformRules() {
  console.log('=== FIFA 2026 Third-Place Rules Transformation ===\n');

  // Read raw FIFA data
  const rawDataPath = path.join(__dirname, '../data/fifa-2026/annex-c-rules-raw.json');
  const rawData: FIFARuleRaw[] = JSON.parse(fs.readFileSync(rawDataPath, 'utf-8'));

  console.log(`Loaded ${rawData.length} rules from annex-c-rules-raw.json\n`);

  // Transform each rule
  const transformedRules: TransformedRule[] = rawData.map(rule => {
    const transformedMatchups: { [key: string]: string } = {};

    // Transform matchups from "1A": "H" to "CEFHI": "H"
    for (const [bracketPosition, groupLetter] of Object.entries(rule.matchups)) {
      const thirdPlaceId = BRACKET_POSITION_TO_THIRD_PLACE_ID[bracketPosition];

      if (!thirdPlaceId) {
        throw new Error(
          `Unknown bracket position: ${bracketPosition} in combination ${rule.combination}`
        );
      }

      transformedMatchups[thirdPlaceId] = groupLetter;
    }

    return {
      combination: rule.combination,
      matchups: transformedMatchups,
    };
  });

  // Write transformed data
  const outputPath = path.join(__dirname, '../data/fifa-2026/third-place-rules-transformed.json');
  fs.writeFileSync(outputPath, JSON.stringify(transformedRules, null, 2), 'utf-8');

  console.log(`✓ Transformed ${transformedRules.length} rules`);
  console.log(`✓ Saved to: third-place-rules-transformed.json\n`);

  // Show sample transformation
  console.log('Sample transformation:');
  console.log('Before (FIFA format):');
  console.log(JSON.stringify(rawData[0], null, 2));
  console.log('\nAfter (Our format):');
  console.log(JSON.stringify(transformedRules[0], null, 2));
  console.log('\n✓ Transformation complete!');
}

transformRules().catch(error => {
  console.error('❌ Transformation failed:', error);
  process.exit(1);
});
