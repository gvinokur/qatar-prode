'use server'

import {
  findThirdPlaceRulesByTournament,
  upsertThirdPlaceRule,
  deleteThirdPlaceRule
} from '../db/tournament-third-place-rules-repository';
import { auth } from '../../auth';
import { ThirdPlaceRuleMapping } from '../db/tables-definition';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '../../i18n.config';

/**
 * Get the currently logged in user
 */
async function getLoggedInUser() {
  const session = await auth();
  return session?.user;
}

/**
 * Get all third-place rules for a tournament
 * Requires admin access
 */
export async function getThirdPlaceRulesForTournament(tournamentId: string, locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error(t('unauthorized'));
  }

  return await findThirdPlaceRulesByTournament(tournamentId);
}

/**
 * Create or update a third-place rule
 * Requires admin access
 */
export async function upsertThirdPlaceRuleAction(
  tournamentId: string,
  combinationKey: string,
  rules: ThirdPlaceRuleMapping,
  locale: Locale = 'es'
) {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error(t('unauthorized'));
  }

  // Validate combination key format (only uppercase letters)
  if (!/^[A-Z]+$/.test(combinationKey)) {
    throw new Error(t('thirdPlace.invalidCombinationKey'));
  }

  // Validate rules is a proper object
  if (typeof rules !== 'object' || rules === null || Array.isArray(rules)) {
    throw new Error(t('thirdPlace.rulesNotObject'));
  }

  // Validate that all values in rules are strings
  const invalidValues = Object.entries(rules).filter(([_, value]) => typeof value !== 'string');
  if (invalidValues.length > 0) {
    throw new Error(t('thirdPlace.ruleValuesMustBeStrings'));
  }

  return await upsertThirdPlaceRule(tournamentId, combinationKey, rules);
}

/**
 * Delete a third-place rule
 * Requires admin access
 */
export async function deleteThirdPlaceRuleAction(ruleId: string, locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error(t('unauthorized'));
  }

  return await deleteThirdPlaceRule(ruleId);
}
