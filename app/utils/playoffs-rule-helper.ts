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
  if(isGroupFinishRule(rule)) {
    if (rule.position === 1) {
      return shortName
        ? t('playoffs.firstPlaceShort', { group: rule.group })
        : t('playoffs.firstPlace', { group: rule.group });
    } else if (rule.position === 2) {
      return shortName
        ? t('playoffs.secondPlaceShort', { group: rule.group })
        : t('playoffs.secondPlace', { group: rule.group });
    } else if (rule.position === 3) {
      return shortName
        ? t('playoffs.thirdPlaceShort', { group: rule.group })
        : t('playoffs.thirdPlace', { group: rule.group });
    }
  } else if (isTeamWinnerRule(rule)){
    if (rule.winner) {
      return shortName
        ? t('playoffs.winnerShort', { game: rule.game })
        : t('playoffs.winner', { game: rule.game });
    } else {
      return shortName
        ? t('playoffs.loserShort', { game: rule.game })
        : t('playoffs.loser', { game: rule.game });
    }
  }
  return ''
}
