'use server'

import { getTranslations } from 'next-intl/server';
import type { Locale } from '../../i18n.config';
import {
  findThirdPlaceRulesByTournament,
  upsertThirdPlaceRule,
  deleteThirdPlaceRule
} from '../db/tournament-third-place-rules-repository';
import { auth } from '../../auth';
import { ThirdPlaceRuleMapping } from '../db/tables-definition';

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
  try {
    const t = await getTranslations({ locale, namespace: 'tournaments' });
    const user = await getLoggedInUser();
    if (!user?.isAdmin) {
      return { success: false, error: t('unauthorized') };
    }

    const result = await findThirdPlaceRulesByTournament(tournamentId);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error getting third place rules:', error);
    const tErrors = await getTranslations({ locale, namespace: 'errors' });
    return { success: false, error: tErrors('generic') };
  }
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
  try {
    const t = await getTranslations({ locale, namespace: 'tournaments' });
    const user = await getLoggedInUser();
    if (!user?.isAdmin) {
      return { success: false, error: t('unauthorized') };
    }

    // Validate combination key format (only uppercase letters)
    if (!/^[A-Z]+$/.test(combinationKey)) {
      return { success: false, error: 'Combination key must contain only uppercase letters (e.g., "ABCDEFGH")' };
    }

    // Validate rules is a proper object
    if (typeof rules !== 'object' || rules === null || Array.isArray(rules)) {
      return { success: false, error: 'Rules must be a valid JSON object (not an array)' };
    }

    // Validate that all values in rules are strings
    const invalidValues = Object.entries(rules).filter(([_, value]) => typeof value !== 'string');
    if (invalidValues.length > 0) {
      return { success: false, error: 'All rule values must be strings (group letters)' };
    }

    const result = await upsertThirdPlaceRule(tournamentId, combinationKey, rules);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error upserting third place rule:', error);
    const tErrors = await getTranslations({ locale, namespace: 'errors' });
    return { success: false, error: tErrors('generic') };
  }
}

/**
 * Delete a third-place rule
 * Requires admin access
 */
export async function deleteThirdPlaceRuleAction(ruleId: string, locale: Locale = 'es') {
  try {
    const t = await getTranslations({ locale, namespace: 'tournaments' });
    const user = await getLoggedInUser();
    if (!user?.isAdmin) {
      return { success: false, error: t('unauthorized') };
    }

    const result = await deleteThirdPlaceRule(ruleId);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error deleting third place rule:', error);
    const tErrors = await getTranslations({ locale, namespace: 'errors' });
    return { success: false, error: tErrors('generic') };
  }
}
