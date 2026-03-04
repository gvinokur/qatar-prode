import { describe, it, expect } from 'vitest';
import { calculatePredictionResult } from '../../app/components/compact-game-view-card';

describe('calculatePredictionResult', () => {
  describe('Exact Match', () => {
    it('returns "exact" when predicted scores match actual scores exactly', () => {
      expect(calculatePredictionResult(2, 0, 2, 0)).toBe('exact');
      expect(calculatePredictionResult(1, 1, 1, 1)).toBe('exact');
      expect(calculatePredictionResult(0, 0, 0, 0)).toBe('exact');
      expect(calculatePredictionResult(3, 2, 3, 2)).toBe('exact');
    });
  });

  describe('Correct Winner - Home Win', () => {
    it('returns "correct" when both predicted and actual are home wins (different scores)', () => {
      expect(calculatePredictionResult(2, 0, 3, 1)).toBe('correct');
      expect(calculatePredictionResult(1, 0, 2, 0)).toBe('correct');
      expect(calculatePredictionResult(3, 1, 2, 0)).toBe('correct');
    });
  });

  describe('Correct Winner - Away Win', () => {
    it('returns "correct" when both predicted and actual are away wins (different scores)', () => {
      expect(calculatePredictionResult(0, 2, 1, 3)).toBe('correct');
      expect(calculatePredictionResult(0, 1, 0, 2)).toBe('correct');
      expect(calculatePredictionResult(1, 3, 0, 2)).toBe('correct');
    });
  });

  describe('Correct Winner - Draw', () => {
    it('returns "correct" when both predicted and actual are draws (different scores)', () => {
      expect(calculatePredictionResult(1, 1, 0, 0)).toBe('correct');
      expect(calculatePredictionResult(0, 0, 2, 2)).toBe('correct');
      expect(calculatePredictionResult(2, 2, 3, 3)).toBe('correct');
    });
  });

  describe('Incorrect Predictions', () => {
    it('returns "incorrect" when predicted home win but actual was away win', () => {
      expect(calculatePredictionResult(2, 0, 0, 2)).toBe('incorrect');
      expect(calculatePredictionResult(3, 1, 1, 3)).toBe('incorrect');
    });

    it('returns "incorrect" when predicted away win but actual was home win', () => {
      expect(calculatePredictionResult(0, 2, 2, 0)).toBe('incorrect');
      expect(calculatePredictionResult(1, 3, 3, 1)).toBe('incorrect');
    });

    it('returns "incorrect" when predicted home win but actual was draw', () => {
      expect(calculatePredictionResult(2, 0, 1, 1)).toBe('incorrect');
      expect(calculatePredictionResult(3, 1, 2, 2)).toBe('incorrect');
    });

    it('returns "incorrect" when predicted away win but actual was draw', () => {
      expect(calculatePredictionResult(0, 2, 1, 1)).toBe('incorrect');
      expect(calculatePredictionResult(1, 3, 2, 2)).toBe('incorrect');
    });

    it('returns "incorrect" when predicted draw but actual was home win', () => {
      expect(calculatePredictionResult(0, 0, 1, 0)).toBe('incorrect');
      expect(calculatePredictionResult(1, 1, 2, 0)).toBe('incorrect');
    });

    it('returns "incorrect" when predicted draw but actual was away win', () => {
      expect(calculatePredictionResult(0, 0, 0, 1)).toBe('incorrect');
      expect(calculatePredictionResult(1, 1, 0, 2)).toBe('incorrect');
    });
  });

  describe('Edge Cases', () => {
    it('handles 0-0 exact match', () => {
      expect(calculatePredictionResult(0, 0, 0, 0)).toBe('exact');
    });

    it('handles high scores', () => {
      expect(calculatePredictionResult(7, 1, 7, 1)).toBe('exact');
      expect(calculatePredictionResult(5, 3, 6, 2)).toBe('correct');
      expect(calculatePredictionResult(10, 0, 0, 10)).toBe('incorrect');
    });

    it('handles one-goal differences', () => {
      expect(calculatePredictionResult(1, 0, 1, 0)).toBe('exact');
      expect(calculatePredictionResult(1, 0, 2, 1)).toBe('correct');
      expect(calculatePredictionResult(1, 0, 0, 1)).toBe('incorrect');
    });

    it('handles narrow home wins vs draws', () => {
      expect(calculatePredictionResult(1, 0, 1, 1)).toBe('incorrect');
      expect(calculatePredictionResult(2, 1, 1, 1)).toBe('incorrect');
    });

    it('handles narrow away wins vs draws', () => {
      expect(calculatePredictionResult(0, 1, 1, 1)).toBe('incorrect');
      expect(calculatePredictionResult(1, 2, 1, 1)).toBe('incorrect');
    });

    it('handles draws vs narrow wins', () => {
      expect(calculatePredictionResult(1, 1, 2, 1)).toBe('incorrect');
      expect(calculatePredictionResult(2, 2, 2, 3)).toBe('incorrect');
    });
  });

  describe('Comprehensive Scenarios', () => {
    it('correctly classifies all possible outcomes for 2-1 actual score', () => {
      const actualHome = 2;
      const actualAway = 1;

      // Exact
      expect(calculatePredictionResult(2, 1, actualHome, actualAway)).toBe('exact');

      // Correct (home wins with different scores)
      expect(calculatePredictionResult(1, 0, actualHome, actualAway)).toBe('correct');
      expect(calculatePredictionResult(3, 0, actualHome, actualAway)).toBe('correct');
      expect(calculatePredictionResult(3, 2, actualHome, actualAway)).toBe('correct');

      // Incorrect (away wins)
      expect(calculatePredictionResult(0, 1, actualHome, actualAway)).toBe('incorrect');
      expect(calculatePredictionResult(1, 2, actualHome, actualAway)).toBe('incorrect');

      // Incorrect (draw)
      expect(calculatePredictionResult(0, 0, actualHome, actualAway)).toBe('incorrect');
      expect(calculatePredictionResult(1, 1, actualHome, actualAway)).toBe('incorrect');
    });

    it('correctly classifies all possible outcomes for 1-1 actual score', () => {
      const actualHome = 1;
      const actualAway = 1;

      // Exact
      expect(calculatePredictionResult(1, 1, actualHome, actualAway)).toBe('exact');

      // Correct (draws with different scores)
      expect(calculatePredictionResult(0, 0, actualHome, actualAway)).toBe('correct');
      expect(calculatePredictionResult(2, 2, actualHome, actualAway)).toBe('correct');
      expect(calculatePredictionResult(3, 3, actualHome, actualAway)).toBe('correct');

      // Incorrect (home wins)
      expect(calculatePredictionResult(1, 0, actualHome, actualAway)).toBe('incorrect');
      expect(calculatePredictionResult(2, 0, actualHome, actualAway)).toBe('incorrect');

      // Incorrect (away wins)
      expect(calculatePredictionResult(0, 1, actualHome, actualAway)).toBe('incorrect');
      expect(calculatePredictionResult(0, 2, actualHome, actualAway)).toBe('incorrect');
    });
  });
});
