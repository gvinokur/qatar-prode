/**
 * FIFA 2026 World Cup Third-Place Team Assignment Rules
 *
 * These 495 combinations define how third-place teams are assigned to bracket positions
 * in the Round of 32 based on which 8 out of 12 groups have their third-place teams qualify.
 *
 * Source: FIFA World Cup 26 Regulations, Annex C (page 80)
 * https://digitalhub.fifa.com/m/636f5c9c6f29771f/original/FWC2026_regulations_EN.pdf
 *
 * Each rule maps a combination of qualifying groups (e.g., "ABCDEFGH") to the specific
 * bracket positions (1A, 1B, 1D, 1E, 1G, 1I, 1K, 1L) where each third-place team plays.
 *
 * Example:
 * - If groups A, B, C, D, E, F, G, H have the best 8 third-place teams
 * - Then the combination key is "ABCDEFGH"
 * - The matchups specify: 1A plays 3H, 1B plays 3G, 1D plays 3B, etc.
 */

import rawRules from './annex-c-rules-raw.json';

export interface ThirdPlaceRule {
  combination: string;
  matchups: {
    [bracketPosition: string]: string;
  };
}

export const FIFA_2026_THIRD_PLACE_RULES: ThirdPlaceRule[] = rawRules as ThirdPlaceRule[];

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
