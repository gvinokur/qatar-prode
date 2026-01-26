import { describe, it, expect } from 'vitest';
import { calculateFinalPoints, formatBoostText, BoostType } from '../../app/utils/point-calculator';

describe('point-calculator', () => {
  describe('calculateFinalPoints', () => {
    describe('without boost', () => {
      it('should calculate 0 points for missed prediction', () => {
        const result = calculateFinalPoints(0, null);

        expect(result.baseScore).toBe(0);
        expect(result.multiplier).toBe(1);
        expect(result.finalScore).toBe(0);
        expect(result.description).toBe('Miss');
      });

      it('should calculate 1 point for correct winner', () => {
        const result = calculateFinalPoints(1, null);

        expect(result.baseScore).toBe(1);
        expect(result.multiplier).toBe(1);
        expect(result.finalScore).toBe(1);
        expect(result.description).toBe('Correct winner');
      });

      it('should calculate 2 points for exact score', () => {
        const result = calculateFinalPoints(2, null);

        expect(result.baseScore).toBe(2);
        expect(result.multiplier).toBe(1);
        expect(result.finalScore).toBe(2);
        expect(result.description).toBe('Exact score');
      });

      it('should default to no boost when boostType is undefined', () => {
        const result = calculateFinalPoints(2);

        expect(result.multiplier).toBe(1);
        expect(result.finalScore).toBe(2);
      });
    });

    describe('with silver boost', () => {
      it('should calculate 0 points for missed prediction with silver boost', () => {
        const result = calculateFinalPoints(0, 'silver');

        expect(result.baseScore).toBe(0);
        expect(result.multiplier).toBe(2);
        expect(result.finalScore).toBe(0);
        expect(result.description).toBe('Miss');
      });

      it('should calculate 2 points (1 x 2) for correct winner with silver boost', () => {
        const result = calculateFinalPoints(1, 'silver');

        expect(result.baseScore).toBe(1);
        expect(result.multiplier).toBe(2);
        expect(result.finalScore).toBe(2);
        expect(result.description).toBe('Correct winner');
      });

      it('should calculate 4 points (2 x 2) for exact score with silver boost', () => {
        const result = calculateFinalPoints(2, 'silver');

        expect(result.baseScore).toBe(2);
        expect(result.multiplier).toBe(2);
        expect(result.finalScore).toBe(4);
        expect(result.description).toBe('Exact score');
      });
    });

    describe('with golden boost', () => {
      it('should calculate 0 points for missed prediction with golden boost', () => {
        const result = calculateFinalPoints(0, 'golden');

        expect(result.baseScore).toBe(0);
        expect(result.multiplier).toBe(3);
        expect(result.finalScore).toBe(0);
        expect(result.description).toBe('Miss');
      });

      it('should calculate 3 points (1 x 3) for correct winner with golden boost', () => {
        const result = calculateFinalPoints(1, 'golden');

        expect(result.baseScore).toBe(1);
        expect(result.multiplier).toBe(3);
        expect(result.finalScore).toBe(3);
        expect(result.description).toBe('Correct winner');
      });

      it('should calculate 6 points (2 x 3) for exact score with golden boost', () => {
        const result = calculateFinalPoints(2, 'golden');

        expect(result.baseScore).toBe(2);
        expect(result.multiplier).toBe(3);
        expect(result.finalScore).toBe(6);
        expect(result.description).toBe('Exact score');
      });
    });

    describe('edge cases', () => {
      it('should handle negative base scores', () => {
        const result = calculateFinalPoints(-1, null);

        expect(result.baseScore).toBe(-1);
        expect(result.multiplier).toBe(1);
        expect(result.finalScore).toBe(-1);
        expect(result.description).toBe('Unknown');
      });

      it('should handle scores greater than 2', () => {
        const result = calculateFinalPoints(5, 'golden');

        expect(result.baseScore).toBe(5);
        expect(result.multiplier).toBe(3);
        expect(result.finalScore).toBe(15);
        expect(result.description).toBe('Unknown');
      });
    });
  });

  describe('formatBoostText', () => {
    it('should format golden boost text', () => {
      expect(formatBoostText('golden')).toBe('Dorado');
    });

    it('should format silver boost text', () => {
      expect(formatBoostText('silver')).toBe('Plateado');
    });

    it('should format no boost text', () => {
      expect(formatBoostText(null)).toBe('Sin Multiplicador');
    });
  });
});
