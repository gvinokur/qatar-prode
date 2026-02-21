import { describe, it, expect } from 'vitest';
import esStats from '@/locales/es/stats.json';
import enStats from '@/locales/en/stats.json';

describe('stats namespace i18n', () => {
  it('should have stats.json in both locales', () => {
    expect(esStats).toBeDefined();
    expect(enStats).toBeDefined();
    expect(typeof esStats).toBe('object');
    expect(typeof enStats).toBe('object');
  });

  it('should have matching keys between en and es', () => {
    const esKeys = JSON.stringify(Object.keys(esStats).sort());
    const enKeys = JSON.stringify(Object.keys(enStats).sort());
    expect(esKeys).toBe(enKeys);
  });

  it('should not have any EnOf() placeholders (fully translated)', () => {
    const enJSON = JSON.stringify(enStats);
    const esJSON = JSON.stringify(esStats);

    // Both files should be fully translated (no EnOf or EsOf markers)
    expect(enJSON).not.toContain('EnOf(');
    expect(esJSON).not.toContain('EsOf(');
  });

  it('should have valid dynamic interpolation placeholders', () => {
    // Check boosts section has dynamic text with placeholders
    expect(enStats.boosts.emptyState.available).toContain('{silver}');
    expect(enStats.boosts.emptyState.available).toContain('{golden}');
    expect(enStats.boosts.groupAllocation).toContain('{letter}');
    expect(enStats.boosts.groupAllocation).toContain('{count}');
    expect(enStats.boosts.playoffsAllocation).toContain('{count}');

    // Same placeholders in Spanish
    expect(esStats.boosts.emptyState.available).toContain('{silver}');
    expect(esStats.boosts.emptyState.available).toContain('{golden}');
    expect(esStats.boosts.groupAllocation).toContain('{letter}');
    expect(esStats.boosts.groupAllocation).toContain('{count}');
    expect(esStats.boosts.playoffsAllocation).toContain('{count}');
  });

  it('should have all required top-level sections', () => {
    const requiredSections = ['sidebar', 'performance', 'accuracy', 'boosts', 'tabs'];

    for (const section of requiredSections) {
      expect(esStats).toHaveProperty(section);
      expect(enStats).toHaveProperty(section);
    }
  });

  it('should have nested keys matching between en and es', () => {
    const getNestedKeys = (obj: any, prefix = ''): string[] => {
      let keys: string[] = [];
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        keys.push(fullKey);
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          keys = keys.concat(getNestedKeys(value, fullKey));
        }
      }
      return keys;
    };

    const esNestedKeys = getNestedKeys(esStats).sort();
    const enNestedKeys = getNestedKeys(enStats).sort();

    expect(esNestedKeys).toEqual(enNestedKeys);
  });

  it('sidebar section should have correct structure', () => {
    expect(enStats.sidebar).toHaveProperty('title');
    expect(enStats.sidebar).toHaveProperty('activeIndicator');
    expect(enStats.sidebar).toHaveProperty('labels');
    expect(enStats.sidebar).toHaveProperty('viewDetails');
    expect(enStats.sidebar).toHaveProperty('ariaLabels');

    expect(esStats.sidebar).toHaveProperty('title');
    expect(esStats.sidebar).toHaveProperty('activeIndicator');
    expect(esStats.sidebar).toHaveProperty('labels');
    expect(esStats.sidebar).toHaveProperty('viewDetails');
    expect(esStats.sidebar).toHaveProperty('ariaLabels');

    // Check sidebar labels
    const labels = ['groups', 'playoffs', 'qualified', 'awards', 'total'];
    for (const label of labels) {
      expect(enStats.sidebar.labels).toHaveProperty(label);
      expect(esStats.sidebar.labels).toHaveProperty(label);
    }

    // Check sidebar ariaLabels
    const ariaLabels = ['card', 'expandButton', 'viewDetailsButton'];
    for (const ariaLabel of ariaLabels) {
      expect(enStats.sidebar.ariaLabels).toHaveProperty(ariaLabel);
      expect(esStats.sidebar.ariaLabels).toHaveProperty(ariaLabel);
    }
  });

  it('performance section should have correct structure', () => {
    expect(enStats.performance).toHaveProperty('title');
    expect(enStats.performance).toHaveProperty('emptyState');
    expect(enStats.performance).toHaveProperty('totalPoints');
    expect(enStats.performance).toHaveProperty('breakdown');
    expect(enStats.performance).toHaveProperty('groupStage');
    expect(enStats.performance).toHaveProperty('playoffStage');

    expect(esStats.performance).toHaveProperty('title');
    expect(esStats.performance).toHaveProperty('emptyState');
    expect(esStats.performance).toHaveProperty('totalPoints');
    expect(esStats.performance).toHaveProperty('breakdown');
    expect(esStats.performance).toHaveProperty('groupStage');
    expect(esStats.performance).toHaveProperty('playoffStage');

    // Check group stage fields
    const groupStageFields = ['title', 'gamePoints', 'boostBonus', 'qualifiedCorrect', 'qualifiedPoints', 'total'];
    for (const field of groupStageFields) {
      expect(enStats.performance.groupStage).toHaveProperty(field);
      expect(esStats.performance.groupStage).toHaveProperty(field);
    }

    // Check playoff stage fields
    const playoffStageFields = ['title', 'gamePoints', 'boostBonus', 'finalPredictions', 'individualAwards', 'total'];
    for (const field of playoffStageFields) {
      expect(enStats.performance.playoffStage).toHaveProperty(field);
      expect(esStats.performance.playoffStage).toHaveProperty(field);
    }
  });

  it('accuracy section should have correct structure', () => {
    const accuracyFields = [
      'title',
      'emptyState',
      'totalPredictions',
      'completed',
      'overallAccuracy',
      'resultCorrect',
      'exactScore',
      'missed',
      'byPhase',
      'groupStage',
      'playoffStage',
    ];

    for (const field of accuracyFields) {
      expect(enStats.accuracy).toHaveProperty(field);
      expect(esStats.accuracy).toHaveProperty(field);
    }
  });

  it('boosts section should have correct structure', () => {
    expect(enStats.boosts).toHaveProperty('title');
    expect(enStats.boosts).toHaveProperty('emptyState');
    expect(enStats.boosts).toHaveProperty('silver');
    expect(enStats.boosts).toHaveProperty('golden');
    expect(enStats.boosts).toHaveProperty('available');
    expect(enStats.boosts).toHaveProperty('used');
    expect(enStats.boosts).toHaveProperty('scoredGames');
    expect(enStats.boosts).toHaveProperty('pointsEarned');
    expect(enStats.boosts).toHaveProperty('roi');
    expect(enStats.boosts).toHaveProperty('distribution');
    expect(enStats.boosts).toHaveProperty('groupAllocation');
    expect(enStats.boosts).toHaveProperty('playoffsAllocation');
    expect(enStats.boosts).toHaveProperty('none');

    expect(esStats.boosts).toHaveProperty('title');
    expect(esStats.boosts).toHaveProperty('emptyState');
    expect(esStats.boosts).toHaveProperty('silver');
    expect(esStats.boosts).toHaveProperty('golden');
    expect(esStats.boosts).toHaveProperty('available');
    expect(esStats.boosts).toHaveProperty('used');
    expect(esStats.boosts).toHaveProperty('scoredGames');
    expect(esStats.boosts).toHaveProperty('pointsEarned');
    expect(esStats.boosts).toHaveProperty('roi');
    expect(esStats.boosts).toHaveProperty('distribution');
    expect(esStats.boosts).toHaveProperty('groupAllocation');
    expect(esStats.boosts).toHaveProperty('playoffsAllocation');
    expect(esStats.boosts).toHaveProperty('none');

    // Check emptyState nested fields
    expect(enStats.boosts.emptyState).toHaveProperty('message');
    expect(enStats.boosts.emptyState).toHaveProperty('available');
    expect(esStats.boosts.emptyState).toHaveProperty('message');
    expect(esStats.boosts.emptyState).toHaveProperty('available');
  });

  it('tabs section should have correct structure', () => {
    const tabsFields = ['performance', 'accuracy', 'boosts', 'ariaLabel'];

    for (const field of tabsFields) {
      expect(enStats.tabs).toHaveProperty(field);
      expect(esStats.tabs).toHaveProperty(field);
    }
  });

  it('all English string values should be non-empty', () => {
    const validateNonEmpty = (obj: any, path = ''): string[] => {
      const errors: string[] = [];
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        if (typeof value === 'string') {
          if (value.trim() === '') {
            errors.push(`Empty string at ${currentPath}`);
          }
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          errors.push(...validateNonEmpty(value, currentPath));
        }
      }
      return errors;
    };

    const enErrors = validateNonEmpty(enStats);
    const esErrors = validateNonEmpty(esStats);

    expect(enErrors).toEqual([]);
    expect(esErrors).toEqual([]);
  });

  it('should have matching value types between en and es', () => {
    const validateTypeMatching = (enObj: any, esObj: any, path = ''): string[] => {
      const errors: string[] = [];
      for (const [key, enValue] of Object.entries(enObj)) {
        const esValue = esObj[key];
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof enValue !== typeof esValue) {
          errors.push(`Type mismatch at ${currentPath}: en is ${typeof enValue}, es is ${typeof esValue}`);
        }

        if (typeof enValue === 'object' && enValue !== null && !Array.isArray(enValue)) {
          if (typeof esValue === 'object' && esValue !== null && !Array.isArray(esValue)) {
            errors.push(...validateTypeMatching(enValue, esValue, currentPath));
          }
        }
      }
      return errors;
    };

    const errors = validateTypeMatching(enStats, esStats);
    expect(errors).toEqual([]);
  });

  it('should not have any extra keys in Spanish file', () => {
    const validateNoExtraKeys = (esObj: any, enObj: any, path = ''): string[] => {
      const errors: string[] = [];
      for (const key of Object.keys(esObj)) {
        if (!(key in enObj)) {
          const currentPath = path ? `${path}.${key}` : key;
          errors.push(`Extra key in Spanish: ${currentPath}`);
        } else if (typeof esObj[key] === 'object' && esObj[key] !== null && !Array.isArray(esObj[key])) {
          if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
            errors.push(...validateNoExtraKeys(esObj[key], enObj[key], path ? `${path}.${key}` : key));
          }
        }
      }
      return errors;
    };

    const errors = validateNoExtraKeys(esStats, enStats);
    expect(errors).toEqual([]);
  });
});
