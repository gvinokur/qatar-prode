import {GroupFinishRule, TeamWinnerRule} from "../db/tables-definition";

/**
 * Type guard to check if an object is a valid GroupFinishRule.
 * A GroupFinishRule must be a non-null object with exactly 'position' and 'group' properties.
 * 
 * @param object - The object to check
 * @returns True if the object is a valid GroupFinishRule, false otherwise
 */
export const isGroupFinishRule = (object: any): object is GroupFinishRule => {
  return object !== null && object !== undefined && 
         typeof object === 'object' && 
         'position' in object && 
         'group' in object &&
         Object.keys(object).length === 2;
}

/**
 * Type guard to check if an object is a valid TeamWinnerRule.
 * A TeamWinnerRule must be a non-null object with exactly 'winner' and 'game' properties.
 * 
 * @param object - The object to check
 * @returns True if the object is a valid TeamWinnerRule, false otherwise
 */
export const isTeamWinnerRule = (object: any): object is TeamWinnerRule => {
  return object !== null && object !== undefined && 
         typeof object === 'object' && 
         'winner' in object && 
         'game' in object &&
         Object.keys(object).length === 2;
}

/**
 * Helper function to get translation key for group finish position.
 * @param position - The position in the group (1, 2, or 3)
 * @param shortName - Whether to return short version
 * @returns Translation key or null if position is invalid
 */
const getGroupFinishKey = (position: number, shortName: boolean): string | null => {
  const keyMap: Record<number, { short: string; long: string }> = {
    1: { short: 'playoffs.firstPlaceShort', long: 'playoffs.firstPlace' },
    2: { short: 'playoffs.secondPlaceShort', long: 'playoffs.secondPlace' },
    3: { short: 'playoffs.thirdPlaceShort', long: 'playoffs.thirdPlace' },
  };

  const keys = keyMap[position];
  return keys ? (shortName ? keys.short : keys.long) : null;
};

/**
 * Helper function to get description for GroupFinishRule.
 * @param rule - The GroupFinishRule
 * @param t - Translation function
 * @param shortName - Whether to return short version
 * @returns Translated description or empty string
 */
const getGroupFinishDescription = (
  rule: GroupFinishRule,
  t: (key: string, params?: any) => string,
  shortName: boolean
): string => {
  const key = getGroupFinishKey(rule.position, shortName);
  return key ? t(key, { group: rule.group }) : '';
};

/**
 * Helper function to get description for TeamWinnerRule.
 * @param rule - The TeamWinnerRule
 * @param t - Translation function
 * @param shortName - Whether to return short version
 * @returns Translated description
 */
const getTeamWinnerDescription = (
  rule: TeamWinnerRule,
  t: (key: string, params?: any) => string,
  shortName: boolean
): string => {
  const key = rule.winner
    ? (shortName ? 'playoffs.winnerShort' : 'playoffs.winner')
    : (shortName ? 'playoffs.loserShort' : 'playoffs.loser');

  return t(key, { game: rule.game });
};

/**
 * Get a human-readable description of a team rule.
 *
 * @param rule - The team rule to describe (can be undefined)
 * @param t - Translation function from useTranslations('predictions')
 * @param shortName - Whether to return a short description (default: false)
 * @returns A string description of the rule, or empty string if rule is invalid/undefined
 */
export const getTeamDescription = (
  rule: GroupFinishRule | TeamWinnerRule | undefined,
  t: (key: string, params?: any) => string,
  shortName?: boolean
) => {
  const useShort = shortName ?? false;

  if (isGroupFinishRule(rule)) {
    return getGroupFinishDescription(rule, t, useShort);
  }

  if (isTeamWinnerRule(rule)) {
    return getTeamWinnerDescription(rule, t, useShort);
  }

  return '';
}
