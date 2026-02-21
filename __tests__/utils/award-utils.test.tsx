import { describe, it, expect } from 'vitest';
import { getAwardsDefinition, awardsDefinition } from '../../app/utils/award-utils';

describe('Award Utils - i18n', () => {
  describe('getAwardsDefinition', () => {
    it('returns awards with translated labels', () => {
      const mockT = (key: string) => {
        const translations: Record<string, string> = {
          'categories.bestPlayer': 'Best Player',
          'categories.topGoalscorer': 'Top Goalscorer',
          'categories.bestGoalkeeper': 'Best Goalkeeper',
          'categories.bestYoungPlayer': 'Best Young Player',
        };
        return translations[key] || key;
      };

      const awards = getAwardsDefinition(mockT);

      expect(awards).toHaveLength(4);
      expect(awards[0].label).toBe('Best Player');
      expect(awards[0].property).toBe('best_player_id');
      expect(awards[1].label).toBe('Top Goalscorer');
      expect(awards[1].property).toBe('top_goalscorer_player_id');
      expect(awards[2].label).toBe('Best Goalkeeper');
      expect(awards[2].property).toBe('best_goalkeeper_player_id');
      expect(awards[3].label).toBe('Best Young Player');
      expect(awards[3].property).toBe('best_young_player_id');
    });

    it('uses correct translation keys', () => {
      const mockT = (key: string) => key; // Return key as-is to verify correct keys
      const awards = getAwardsDefinition(mockT);

      expect(awards[0].label).toBe('categories.bestPlayer');
      expect(awards[1].label).toBe('categories.topGoalscorer');
      expect(awards[2].label).toBe('categories.bestGoalkeeper');
      expect(awards[3].label).toBe('categories.bestYoungPlayer');
    });

    it('maintains same structure as old awardsDefinition', () => {
      const mockT = () => 'Translated Label';
      const newAwards = getAwardsDefinition(mockT);

      expect(newAwards).toHaveLength(awardsDefinition.length);
      expect(newAwards[0].property).toBe(awardsDefinition[0].property);
      // playerFilter is a function reference, so check it exists rather than comparing references
      expect(typeof newAwards[0].playerFilter).toBe('function');
    });
  });

  describe('awardsDefinition (deprecated)', () => {
    it('still exports old definition for backward compatibility', () => {
      expect(awardsDefinition).toBeDefined();
      expect(awardsDefinition).toHaveLength(4);
      expect(awardsDefinition[0].label).toBe('Mejor Jugador');
    });
  });
});
