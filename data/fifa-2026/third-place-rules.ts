/**
 * FIFA 2026 World Cup Third-Place Team Assignment Rules
 *
 * These 495 combinations define how third-place teams are assigned to bracket positions
 * in the Round of 32 based on which 8 out of 12 groups have their third-place teams qualify.
 *
 * Source: FIFA World Cup 26 Regulations, Annex C (page 80)
 * https://digitalhub.fifa.com/m/636f5c9c6f29771f/original/FWC2026_regulations_EN.pdf
 *
 * Each rule maps a combination of qualifying groups (e.g., "EFGHIJKL") to the specific
 * third-place position identifiers (e.g., "CEFHI", "EFGIJ") where each group's third-place team plays.
 *
 * Format:
 * - Key (combination): Sorted letters of groups with qualifying third-place teams (e.g., "EFGHIJKL")
 * - Value (matchups): Object mapping third-place position identifiers to group letters
 *
 * Example for combination "EFGHIJKL":
 * - "CEFHI": "E" means the third-place team that plays in position "3CEFHI" comes from Group E
 * - "EFGIJ": "J" means the third-place team that plays in position "3EFGIJ" comes from Group J
 * - This determines which actual group fills each third-place bracket position
 */

import transformedRules from './third-place-rules-transformed.json';

export interface ThirdPlaceRule {
  combination: string;
  matchups: {
    [bracketPosition: string]: string;
  };
}

export const FIFA_2026_THIRD_PLACE_RULES: ThirdPlaceRule[] = transformedRules as ThirdPlaceRule[];

/**
 * Convert the rules array to a map for faster lookup
 * Key: combination string (e.g., "ABCDEFGH")
 * Value: matchups object
 */
export function getRulesMap(): Map<string, { [key: string]: string }> {
  const map = new Map<string, { [key: string]: string }>();

  for (const rule of FIFA_2026_THIRD_PLACE_RULES) {
    map.set(rule.combination, rule.matchups);
  }

  return map;
}

/**
 * Get the matchup rules for a specific combination of qualifying groups
 */
export function getMatchupsForCombination(
  qualifyingGroups: string[]
): { [key: string]: string } | undefined {
  const combinationKey = qualifyingGroups.sort().join('');
  const rulesMap = getRulesMap();
  return rulesMap.get(combinationKey);
}
