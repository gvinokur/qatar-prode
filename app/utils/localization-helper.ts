/**
 * Localization helpers for database-driven internationalization
 *
 * These functions apply localization to data fetched from the database.
 * They should ONLY be used in Server Actions, never in repositories or components.
 */

/**
 * Apply localization to an object with multiple i18n fields
 *
 * ⚠️ IMPORTANT: This function should be called in Server Actions ONLY
 * ⚠️ DO NOT call this in repositories or components
 * ⚠️ Repositories return raw data, Actions apply localization
 *
 * @param data - Object with both field and field_i18n properties
 * @param locale - Target locale ('en' | 'es')
 * @param fields - Array of field mappings: { field: 'name', i18nField: 'name_i18n' }
 * @returns New object with localized field values
 *
 * @example
 * // ✅ CORRECT: Use in Server Action
 * export async function getTournament(id: string) {
 *   const locale = await getLocale();
 *   const tournament = await tournamentRepo.findById(id); // Raw data
 *   return applyLocalization(tournament, locale, [
 *     { field: 'long_name', i18nField: 'long_name_i18n' },
 *     { field: 'short_name', i18nField: 'short_name_i18n' }
 *   ]);
 * }
 *
 * @example
 * // ❌ WRONG: Do NOT use in repository
 * export function findTournamentById(id: string, locale: string) {
 *   const tournament = await db.selectFrom('tournaments')...;
 *   return applyLocalization(tournament, locale, [...]); // NO!
 * }
 */
export function applyLocalization<T extends Record<string, any>>(
  data: T,
  locale: string,
  fields: Array<{ field: keyof T; i18nField: keyof T }>
): T {
  const localized = { ...data };

  for (const { field, i18nField } of fields) {
    const originalValue = data[field] as string;
    const i18nJson = data[i18nField] as Record<string, string> | null | undefined;

    // If no i18n JSON provided, keep original value
    if (!i18nJson) {
      continue;
    }

    // If locale exists in JSON, use it
    if (i18nJson[locale]) {
      localized[field] = i18nJson[locale] as T[keyof T];
    } else {
      // Fallback to original value
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[i18n] Missing locale "${locale}" for field "${String(field)}" ` +
          `with value "${originalValue}". Available locales: ${Object.keys(i18nJson).join(', ')}`
        );
      }
      // Keep original value (already in localized object)
    }
  }

  return localized;
}

/**
 * Batch localization for arrays of objects
 *
 * ⚠️ IMPORTANT: Use in Server Actions ONLY (same rules as applyLocalization)
 *
 * @example
 * // ✅ CORRECT: Use in Server Action
 * export async function getGamesForTournament(tournamentId: string) {
 *   const locale = await getLocale();
 *   const games = await gameRepo.findByTournament(tournamentId); // Raw data
 *   return applyLocalizationBatch(games, locale, [
 *     { field: 'location', i18nField: 'location_i18n' }
 *   ]);
 * }
 */
export function applyLocalizationBatch<T extends Record<string, any>>(
  dataArray: T[],
  locale: string,
  fields: Array<{ field: keyof T; i18nField: keyof T }>
): T[] {
  return dataArray.map(item => applyLocalization(item, locale, fields));
}
