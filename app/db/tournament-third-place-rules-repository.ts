import { db } from './database';
import { createBaseFunctions } from "./base-repository";
import {
  TournamentThirdPlaceRules,
  TournamentThirdPlaceRulesTable,
  ThirdPlaceRuleMapping
} from "./tables-definition";

const baseFunctions = createBaseFunctions<
  TournamentThirdPlaceRulesTable,
  TournamentThirdPlaceRules
>('tournament_third_place_rules');

export const createThirdPlaceRule = baseFunctions.create;
export const updateThirdPlaceRule = baseFunctions.update;
export const deleteThirdPlaceRule = baseFunctions.delete;
export const findThirdPlaceRuleById = baseFunctions.findById;

/**
 * Get all third-place rules for a tournament
 * @param tournamentId - Tournament ID
 * @returns Array of third-place rules for the tournament
 */
export async function findThirdPlaceRulesByTournament(tournamentId: string) {
  return db.selectFrom('tournament_third_place_rules')
    .where('tournament_id', '=', tournamentId)
    .selectAll()
    .execute();
}

/**
 * Get specific rule for a tournament and combination
 * @param tournamentId - Tournament ID
 * @param combinationKey - Sorted group letters (e.g., "ABCDEFGH")
 * @returns The third-place rule if found
 */
export async function findThirdPlaceRuleByTournamentAndCombination(
  tournamentId: string,
  combinationKey: string
) {
  return db.selectFrom('tournament_third_place_rules')
    .where('tournament_id', '=', tournamentId)
    .where('combination_key', '=', combinationKey)
    .selectAll()
    .executeTakeFirst();
}

/**
 * Upsert third-place rules for a tournament
 * Creates if doesn't exist, updates if exists
 * @param tournamentId - Tournament ID
 * @param combinationKey - Sorted group letters (e.g., "ABCDEFGH")
 * @param rules - Mapping of bracket positions to group letters
 * @returns The created or updated rule
 */
export async function upsertThirdPlaceRule(
  tournamentId: string,
  combinationKey: string,
  rules: ThirdPlaceRuleMapping
) {
  return db
    .insertInto('tournament_third_place_rules')
    .values({
      tournament_id: tournamentId,
      combination_key: combinationKey,
      rules: rules as any,
      updated_at: new Date()
    })
    .onConflict((oc) =>
      oc
        .columns(['tournament_id', 'combination_key'])
        .doUpdateSet({
          rules: rules as any,
          updated_at: new Date()
        })
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}

/**
 * Delete all third-place rules for a tournament
 * @param tournamentId - Tournament ID
 * @returns Delete result
 */
export async function deleteThirdPlaceRulesByTournament(tournamentId: string) {
  return db.deleteFrom('tournament_third_place_rules')
    .where('tournament_id', '=', tournamentId)
    .execute();
}

/**
 * Convert database rules to the format expected by playoff calculator
 * Returns a map where keys are combination keys (e.g., "ABCDEFGH")
 * and values are position mappings (e.g., {"Position1": "A", "Position2": "B"})
 * @param tournamentId - Tournament ID
 * @returns Formatted rules map for the playoff calculator
 */
export async function getThirdPlaceRulesMapForTournament(tournamentId: string) {
  const rules = await findThirdPlaceRulesByTournament(tournamentId);

  return Object.fromEntries(
    rules.map(rule => [rule.combination_key, rule.rules])
  );
}
