import { describe, it, expect } from 'vitest';
import { isGamePredictionComplete } from '@/app/utils/game-prediction-helpers';

describe('isGamePredictionComplete', () => {
  describe('Group Games', () => {
    it('returns true when both scores are filled', () => {
      expect(isGamePredictionComplete('group', 2, 1)).toBe(true);
    });

    it('returns false when home score is null', () => {
      expect(isGamePredictionComplete('group', null, 1)).toBe(false);
    });

    it('returns false when away score is null', () => {
      expect(isGamePredictionComplete('group', 2, null)).toBe(false);
    });

    it('returns false when home score is undefined', () => {
      expect(isGamePredictionComplete('group', undefined, 1)).toBe(false);
    });

    it('returns false when away score is undefined', () => {
      expect(isGamePredictionComplete('group', 2, undefined)).toBe(false);
    });

    it('returns false when both scores are null', () => {
      expect(isGamePredictionComplete('group', null, null)).toBe(false);
    });

    it('returns true for tied group games (penalty winner not required)', () => {
      expect(isGamePredictionComplete('group', 1, 1)).toBe(true);
    });
  });

  describe('Playoff Games - Not Tied', () => {
    it('returns true when both scores are filled and not tied', () => {
      expect(isGamePredictionComplete('playoff', 2, 1)).toBe(true);
    });

    it('returns true for first_round games when not tied', () => {
      expect(isGamePredictionComplete('first_round', 3, 1)).toBe(true);
    });

    it('returns true for other_round games when not tied', () => {
      expect(isGamePredictionComplete('other_round', 2, 0)).toBe(true);
    });

    it('returns false when home score is null', () => {
      expect(isGamePredictionComplete('playoff', null, 1)).toBe(false);
    });

    it('returns false when away score is undefined', () => {
      expect(isGamePredictionComplete('playoff', 2, undefined)).toBe(false);
    });
  });

  describe('Playoff Games - Tied (Penalty Winner Required)', () => {
    it('returns false for tied playoff game without penalty winner', () => {
      expect(isGamePredictionComplete('playoff', 1, 1)).toBe(false);
    });

    it('returns true for tied playoff game with home penalty winner', () => {
      expect(isGamePredictionComplete('playoff', 1, 1, true, false)).toBe(true);
    });

    it('returns true for tied playoff game with away penalty winner', () => {
      expect(isGamePredictionComplete('playoff', 2, 2, false, true)).toBe(true);
    });

    it('returns true for tied playoff game with only home penalty winner set', () => {
      expect(isGamePredictionComplete('playoff', 1, 1, true)).toBe(true);
    });

    it('returns true for tied playoff game with only away penalty winner set', () => {
      expect(isGamePredictionComplete('playoff', 1, 1, undefined, true)).toBe(true);
    });

    it('returns false for tied playoff game with null penalty winners', () => {
      expect(isGamePredictionComplete('playoff', 1, 1, null, null)).toBe(false);
    });

    it('returns false for tied playoff game with undefined penalty winners', () => {
      expect(isGamePredictionComplete('playoff', 1, 1, undefined, undefined)).toBe(false);
    });

    it('returns false for tied playoff game with false penalty winners', () => {
      expect(isGamePredictionComplete('playoff', 1, 1, false, false)).toBe(false);
    });

    it('returns true for tied 0-0 playoff game with penalty winner', () => {
      expect(isGamePredictionComplete('playoff', 0, 0, true, false)).toBe(true);
    });

    it('returns false for tied 0-0 playoff game without penalty winner', () => {
      expect(isGamePredictionComplete('playoff', 0, 0)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined game type (treats as playoff)', () => {
      // When game_type is undefined, it's treated as playoff
      expect(isGamePredictionComplete(undefined, 2, 1)).toBe(true);
      expect(isGamePredictionComplete(undefined, 1, 1)).toBe(false); // Tied, needs penalty
      expect(isGamePredictionComplete(undefined, 1, 1, true, false)).toBe(true);
    });

    it('handles null game type (treats as playoff)', () => {
      expect(isGamePredictionComplete(null, 2, 1)).toBe(true);
      expect(isGamePredictionComplete(null, 1, 1)).toBe(false); // Tied, needs penalty
      expect(isGamePredictionComplete(null, 1, 1, false, true)).toBe(true);
    });

    it('handles zero scores correctly', () => {
      expect(isGamePredictionComplete('group', 0, 0)).toBe(true);
      expect(isGamePredictionComplete('playoff', 0, 1)).toBe(true);
      expect(isGamePredictionComplete('playoff', 0, 0)).toBe(false); // Tied, needs penalty
      expect(isGamePredictionComplete('playoff', 0, 0, true, false)).toBe(true);
    });
  });
});
