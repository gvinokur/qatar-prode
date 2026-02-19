'use server'

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
export async function getThirdPlaceRulesForTournament(tournamentId: string) {
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Admin access required');
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
  rules: ThirdPlaceRuleMapping
) {
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }

  // Validate combination key format (only uppercase letters)
  if (!/^[A-Z]+$/.test(combinationKey)) {
    throw new Error('Combination key must contain only uppercase letters (e.g., "ABCDEFGH")');
  }

  // Validate rules is a proper object
  if (typeof rules !== 'object' || rules === null || Array.isArray(rules)) {
    throw new Error('Rules must be a valid JSON object (not an array)');
  }

  // Validate that all values in rules are strings
  const invalidValues = Object.entries(rules).filter(([_, value]) => typeof value !== 'string');
  if (invalidValues.length > 0) {
    throw new Error('All rule values must be strings (group letters)');
  }

  return await upsertThirdPlaceRule(tournamentId, combinationKey, rules);
}

/**
 * Delete a third-place rule
 * Requires admin access
 */
export async function deleteThirdPlaceRuleAction(ruleId: string) {
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }

  return await deleteThirdPlaceRule(ruleId);
}
