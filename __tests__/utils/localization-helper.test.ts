import { describe, it, expect } from 'vitest';
import { applyLocalization, applyLocalizationBatch } from '../../app/utils/localization-helper';

describe('localization-helper', () => {
  describe('applyLocalization', () => {
    it('should apply localization for single field', () => {
      const data = {
        id: '1',
        name: 'Original Name',
        name_i18n: { en: 'English Name', es: 'Nombre en Español' }
      };

      const result = applyLocalization(data, 'en', [
        { field: 'name', i18nField: 'name_i18n' }
      ]);

      expect(result.name).toBe('English Name');
      expect(result.id).toBe('1');
    });

    it('should apply localization for multiple fields', () => {
      const data = {
        id: '1',
        long_name: 'Original Long Name',
        long_name_i18n: { en: 'English Long Name', es: 'Nombre Largo en Español' },
        short_name: 'Original Short',
        short_name_i18n: { en: 'EN Short', es: 'ES Corto' }
      };

      const result = applyLocalization(data, 'es', [
        { field: 'long_name', i18nField: 'long_name_i18n' },
        { field: 'short_name', i18nField: 'short_name_i18n' }
      ]);

      expect(result.long_name).toBe('Nombre Largo en Español');
      expect(result.short_name).toBe('ES Corto');
    });

    it('should fallback to original value when i18n field is null', () => {
      const data = {
        id: '1',
        name: 'Original Name',
        name_i18n: null
      };

      const result = applyLocalization(data, 'en', [
        { field: 'name', i18nField: 'name_i18n' }
      ]);

      expect(result.name).toBe('Original Name');
    });

    it('should fallback to original value when i18n field is undefined', () => {
      const data = {
        id: '1',
        name: 'Original Name',
        name_i18n: undefined
      };

      const result = applyLocalization(data, 'en', [
        { field: 'name', i18nField: 'name_i18n' }
      ]);

      expect(result.name).toBe('Original Name');
    });

    it('should fallback to original value when locale is missing in i18n object', () => {
      const data = {
        id: '1',
        name: 'Original Name',
        name_i18n: { en: 'English Name' }
      };

      const result = applyLocalization(data, 'fr', [
        { field: 'name', i18nField: 'name_i18n' }
      ]);

      expect(result.name).toBe('Original Name');
    });

    it('should handle empty i18n object', () => {
      const data = {
        id: '1',
        name: 'Original Name',
        name_i18n: {}
      };

      const result = applyLocalization(data, 'en', [
        { field: 'name', i18nField: 'name_i18n' }
      ]);

      expect(result.name).toBe('Original Name');
    });

    it('should not mutate the original object', () => {
      const data = {
        id: '1',
        name: 'Original Name',
        name_i18n: { en: 'English Name', es: 'Nombre en Español' }
      };

      const result = applyLocalization(data, 'en', [
        { field: 'name', i18nField: 'name_i18n' }
      ]);

      expect(data.name).toBe('Original Name');
      expect(result.name).toBe('English Name');
      expect(result).not.toBe(data);
    });

    it('should preserve all other fields', () => {
      const data = {
        id: '1',
        name: 'Original Name',
        name_i18n: { en: 'English Name' },
        description: 'Some description',
        count: 42,
        active: true
      };

      const result = applyLocalization(data, 'en', [
        { field: 'name', i18nField: 'name_i18n' }
      ]);

      expect(result.description).toBe('Some description');
      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
    });
  });

  describe('applyLocalizationBatch', () => {
    it('should apply localization to array of objects', () => {
      const data = [
        { id: '1', name: 'Team 1', name_i18n: { en: 'English Team 1', es: 'Equipo 1' } },
        { id: '2', name: 'Team 2', name_i18n: { en: 'English Team 2', es: 'Equipo 2' } },
        { id: '3', name: 'Team 3', name_i18n: { en: 'English Team 3', es: 'Equipo 3' } }
      ];

      const result = applyLocalizationBatch(data, 'es', [
        { field: 'name', i18nField: 'name_i18n' }
      ]);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Equipo 1');
      expect(result[1].name).toBe('Equipo 2');
      expect(result[2].name).toBe('Equipo 3');
    });

    it('should handle empty array', () => {
      const result = applyLocalizationBatch([], 'en', [
        { field: 'name', i18nField: 'name_i18n' }
      ]);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should handle mixed localization availability', () => {
      const data = [
        { id: '1', name: 'Team 1', name_i18n: { en: 'English Team 1' } },
        { id: '2', name: 'Team 2', name_i18n: null },
        { id: '3', name: 'Team 3', name_i18n: { en: 'English Team 3' } }
      ];

      const result = applyLocalizationBatch(data, 'en', [
        { field: 'name', i18nField: 'name_i18n' }
      ]);

      expect(result[0].name).toBe('English Team 1');
      expect(result[1].name).toBe('Team 2'); // Fallback to original
      expect(result[2].name).toBe('English Team 3');
    });

    it('should apply multiple field localizations in batch', () => {
      const data = [
        {
          id: '1',
          long_name: 'Tournament 1',
          long_name_i18n: { en: 'EN Tournament 1', es: 'ES Torneo 1' },
          short_name: 'T1',
          short_name_i18n: { en: 'EN T1', es: 'ES T1' }
        },
        {
          id: '2',
          long_name: 'Tournament 2',
          long_name_i18n: { en: 'EN Tournament 2', es: 'ES Torneo 2' },
          short_name: 'T2',
          short_name_i18n: { en: 'EN T2', es: 'ES T2' }
        }
      ];

      const result = applyLocalizationBatch(data, 'en', [
        { field: 'long_name', i18nField: 'long_name_i18n' },
        { field: 'short_name', i18nField: 'short_name_i18n' }
      ]);

      expect(result[0].long_name).toBe('EN Tournament 1');
      expect(result[0].short_name).toBe('EN T1');
      expect(result[1].long_name).toBe('EN Tournament 2');
      expect(result[1].short_name).toBe('EN T2');
    });

    it('should not mutate the original array or objects', () => {
      const data = [
        { id: '1', name: 'Team 1', name_i18n: { en: 'English Team 1' } }
      ];

      const result = applyLocalizationBatch(data, 'en', [
        { field: 'name', i18nField: 'name_i18n' }
      ]);

      expect(data[0].name).toBe('Team 1');
      expect(result[0].name).toBe('English Team 1');
      expect(result[0]).not.toBe(data[0]);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in translations', () => {
      const data = {
        name: 'Original',
        name_i18n: {
          en: 'Team with "quotes" and \'apostrophes\'',
          es: 'Equipo con áccéntos y ñ'
        }
      };

      const resultEn = applyLocalization(data, 'en', [
        { field: 'name', i18nField: 'name_i18n' }
      ]);
      const resultEs = applyLocalization(data, 'es', [
        { field: 'name', i18nField: 'name_i18n' }
      ]);

      expect(resultEn.name).toBe('Team with "quotes" and \'apostrophes\'');
      expect(resultEs.name).toBe('Equipo con áccéntos y ñ');
    });

    it('should fallback to original when translation is empty string', () => {
      const data = {
        name: 'Original Name',
        name_i18n: { en: '', es: 'Nombre en Español' }
      };

      const result = applyLocalization(data, 'en', [
        { field: 'name', i18nField: 'name_i18n' }
      ]);

      // Empty string is falsy, so fallback to original value
      expect(result.name).toBe('Original Name');
    });

    it('should handle whitespace-only translations', () => {
      const data = {
        name: 'Original Name',
        name_i18n: { en: '   ', es: 'Nombre' }
      };

      const result = applyLocalization(data, 'en', [
        { field: 'name', i18nField: 'name_i18n' }
      ]);

      // Whitespace is a valid translation
      expect(result.name).toBe('   ');
    });
  });
});
