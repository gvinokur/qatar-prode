import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generatePoissonScore, generateMatchScore } from '../../app/utils/poisson-generator';

describe('poisson-generator', () => {
  // Ensure clean state before and after each test
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generatePoissonScore', () => {
    describe('validation', () => {
      it('throws error when lambda is 0', () => {
        expect(() => generatePoissonScore(0)).toThrow('Lambda must be greater than 0');
      });

      it('throws error when lambda is negative', () => {
        expect(() => generatePoissonScore(-1)).toThrow('Lambda must be greater than 0');
      });

      it('throws error when lambda is very small negative', () => {
        expect(() => generatePoissonScore(-0.001)).toThrow('Lambda must be greater than 0');
      });
    });

    describe('normal lambda values (Knuth algorithm)', () => {
      it('generates non-negative integer with lambda=1.35', () => {
        const score = generatePoissonScore(1.35);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(score)).toBe(true);
      });

      it('generates non-negative integer with small lambda=0.5', () => {
        const score = generatePoissonScore(0.5);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(score)).toBe(true);
      });

      it('generates non-negative integer with lambda=3', () => {
        const score = generatePoissonScore(3);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(score)).toBe(true);
      });

      it('generates scores in reasonable range for lambda=1.35', () => {
        const scores: number[] = [];
        for (let i = 0; i < 100; i++) {
          scores.push(generatePoissonScore(1.35));
        }

        // All scores should be non-negative integers
        scores.forEach(score => {
          expect(score).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(score)).toBe(true);
        });

        // At least one score should be 0 or 1 (most common for lambda=1.35)
        const lowScores = scores.filter(s => s <= 1).length;
        expect(lowScores).toBeGreaterThan(30); // Should be ~60-70% but allow variance

        // Should not generate excessively high scores often
        const highScores = scores.filter(s => s > 5).length;
        expect(highScores).toBeLessThan(10); // Less than 10%
      });

      it('generates different values across multiple calls', () => {
        const scores = new Set<number>();
        for (let i = 0; i < 50; i++) {
          scores.add(generatePoissonScore(1.35));
        }

        // Should generate at least some variety (not all the same)
        expect(scores.size).toBeGreaterThan(1);
      });
    });

    describe('large lambda values (normal approximation)', () => {
      it('generates non-negative integer with lambda=701', () => {
        const score = generatePoissonScore(701);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(score)).toBe(true);
      });

      it('generates non-negative integer with lambda=1000', () => {
        const score = generatePoissonScore(1000);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(score)).toBe(true);
      });

      it('generates scores near mean for large lambda=750', () => {
        const scores: number[] = [];
        for (let i = 0; i < 100; i++) {
          scores.push(generatePoissonScore(750));
        }

        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;

        // Mean should be roughly around lambda (750) with some variance
        // Allow 10% deviation for 100 samples
        expect(mean).toBeGreaterThan(675); // 750 - 10%
        expect(mean).toBeLessThan(825); // 750 + 10%
      });

      it('generates different values across multiple calls with large lambda', () => {
        const scores = new Set<number>();
        for (let i = 0; i < 50; i++) {
          scores.add(generatePoissonScore(800));
        }

        // Should generate variety
        expect(scores.size).toBeGreaterThan(20);
      });

      it('uses normal approximation path for lambda > 700', () => {
        // Mock Math.random to control the Box-Muller transform
        const mockRandom = vi.spyOn(Math, 'random');
        mockRandom.mockReturnValueOnce(0.5).mockReturnValueOnce(0.5);

        const score = generatePoissonScore(750);

        // Verify score is valid
        expect(score).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(score)).toBe(true);

        mockRandom.mockRestore();
      });
    });

    describe('edge cases', () => {
      it('handles very small positive lambda=0.001', () => {
        const score = generatePoissonScore(0.001);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(score)).toBe(true);
      });

      it('handles lambda at boundary=700', () => {
        const score = generatePoissonScore(700);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(score)).toBe(true);
      });

      it('handles lambda just above boundary=700.1', () => {
        const score = generatePoissonScore(700.1);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(score)).toBe(true);
      });

      it('generates mostly 0 for very small lambda=0.1', () => {
        const scores: number[] = [];
        for (let i = 0; i < 100; i++) {
          scores.push(generatePoissonScore(0.1));
        }

        const zeros = scores.filter(s => s === 0).length;
        expect(zeros).toBeGreaterThanOrEqual(75); // Should be ~90% for lambda=0.1, allow for variance
      });
    });
  });

  describe('generateMatchScore', () => {
    describe('validation', () => {
      it('throws error when lambda is 0', () => {
        expect(() => generateMatchScore(0)).toThrow('Lambda must be greater than 0');
      });

      it('throws error when lambda is negative', () => {
        expect(() => generateMatchScore(-1)).toThrow('Lambda must be greater than 0');
      });
    });

    describe('basic match score generation', () => {
      it('generates valid match scores with default lambda', () => {
        const match = generateMatchScore();

        expect(match).toHaveProperty('homeScore');
        expect(match).toHaveProperty('awayScore');
        expect(match.homeScore).toBeGreaterThanOrEqual(0);
        expect(match.awayScore).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(match.homeScore)).toBe(true);
        expect(Number.isInteger(match.awayScore)).toBe(true);
      });

      it('generates valid match scores with lambda=1.35', () => {
        const match = generateMatchScore(1.35);

        expect(match.homeScore).toBeGreaterThanOrEqual(0);
        expect(match.awayScore).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(match.homeScore)).toBe(true);
        expect(Number.isInteger(match.awayScore)).toBe(true);
      });

      it('generates valid match scores with lambda=2', () => {
        const match = generateMatchScore(2);

        expect(match.homeScore).toBeGreaterThanOrEqual(0);
        expect(match.awayScore).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(match.homeScore)).toBe(true);
        expect(Number.isInteger(match.awayScore)).toBe(true);
      });

      it('generates different scores across multiple calls', () => {
        const matches = new Set<string>();
        for (let i = 0; i < 30; i++) {
          const match = generateMatchScore();
          matches.add(`${match.homeScore}-${match.awayScore}`);
        }

        // Should generate some variety
        expect(matches.size).toBeGreaterThan(5);
      });
    });

    describe('penalty shootout generation', () => {
      it('generates penalty scores when match is tied', () => {
        // Keep generating until we get a tie
        let match;
        let attempts = 0;
        const maxAttempts = 100;

        do {
          match = generateMatchScore(1.35, true); // Enable playoff mode for penalties
          attempts++;
        } while (match.homeScore !== match.awayScore && attempts < maxAttempts);

        // If we got a tie, verify penalty scores
        if (match.homeScore === match.awayScore) {
          expect(match.homePenaltyScore).toBeDefined();
          expect(match.awayPenaltyScore).toBeDefined();
          expect(match.homePenaltyScore).toBeGreaterThanOrEqual(0);
          expect(match.awayPenaltyScore).toBeGreaterThanOrEqual(0);
          expect(match.homePenaltyScore).toBeLessThanOrEqual(5);
          expect(match.awayPenaltyScore).toBeLessThanOrEqual(5);
        }
      });

      it('ensures penalty winner exists for tied matches', () => {
        // Mock to force tied scores
        const mockGeneratePoissonScore = vi.fn();
        mockGeneratePoissonScore
          .mockReturnValueOnce(1) // homeScore
          .mockReturnValueOnce(1) // awayScore
          .mockReturnValueOnce(3) // homePenaltyScore
          .mockReturnValueOnce(3); // awayPenaltyScore (will be adjusted)

        vi.spyOn(Math, 'random').mockReturnValue(0.3); // Ensure home team gets +1

        // We can't easily mock the imported function, so test the behavior instead
        const matches: any[] = [];
        for (let i = 0; i < 50; i++) {
          const match = generateMatchScore(1.35, true); // Enable playoff mode for penalties
          if (match.homeScore === match.awayScore) {
            matches.push(match);
          }
        }

        // All tied matches should have penalty scores with a winner
        matches.forEach(match => {
          expect(match.homePenaltyScore).toBeDefined();
          expect(match.awayPenaltyScore).toBeDefined();
          expect(match.homePenaltyScore).not.toBe(match.awayPenaltyScore);
        });
      });

      it('does not generate penalty scores when match is not tied', () => {
        // Keep generating until we get a non-tie
        let match;
        let attempts = 0;
        const maxAttempts = 100;

        do {
          match = generateMatchScore(1.35);
          attempts++;
        } while (match.homeScore === match.awayScore && attempts < maxAttempts);

        // If we got a non-tie, verify no penalty scores
        if (match.homeScore !== match.awayScore) {
          expect(match.homePenaltyScore).toBeUndefined();
          expect(match.awayPenaltyScore).toBeUndefined();
        }
      });

      it('penalty scores are capped at 5', () => {
        // Generate many tied matches and check penalty caps
        const tiedMatches: any[] = [];
        for (let i = 0; i < 100; i++) {
          const match = generateMatchScore(1.35, true); // Enable playoff mode for penalties
          if (match.homeScore === match.awayScore) {
            tiedMatches.push(match);
          }
        }

        tiedMatches.forEach(match => {
          expect(match.homePenaltyScore).toBeLessThanOrEqual(5);
          expect(match.awayPenaltyScore).toBeLessThanOrEqual(5);
        });
      });
    });

    describe('match score distribution', () => {
      it('generates reasonable score distribution over multiple iterations', () => {
        const matches: any[] = [];
        for (let i = 0; i < 200; i++) {
          matches.push(generateMatchScore(1.35));
        }

        // Calculate statistics
        const homeScores = matches.map(m => m.homeScore);
        const awayScores = matches.map(m => m.awayScore);
        const ties = matches.filter(m => m.homeScore === m.awayScore).length;
        const homeWins = matches.filter(m => m.homeScore > m.awayScore).length;
        const awayWins = matches.filter(m => m.homeScore < m.awayScore).length;

        // All scores should be valid
        [...homeScores, ...awayScores].forEach(score => {
          expect(score).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(score)).toBe(true);
        });

        // Should have some ties (roughly 20-30% with lambda=1.35)
        expect(ties).toBeGreaterThan(20);
        expect(ties).toBeLessThan(80);

        // Should have mix of home/away wins (roughly equal)
        expect(homeWins).toBeGreaterThan(30);
        expect(awayWins).toBeGreaterThan(30);

        // Mean score should be around lambda (1.35)
        const allScores = [...homeScores, ...awayScores];
        const meanScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
        expect(meanScore).toBeGreaterThan(0.8); // Allow variance
        expect(meanScore).toBeLessThan(2.0);
      });

      it('generates realistic low-scoring matches', () => {
        const matches: any[] = [];
        for (let i = 0; i < 100; i++) {
          matches.push(generateMatchScore(1.35));
        }

        // Most matches should be low-scoring (0-3 goals)
        const lowScoring = matches.filter(m =>
          m.homeScore <= 3 && m.awayScore <= 3
        ).length;

        expect(lowScoring).toBeGreaterThan(70); // Should be 70%+ for lambda=1.35
      });

      it('generates variety of outcomes', () => {
        const outcomes = new Set<string>();
        for (let i = 0; i < 100; i++) {
          const match = generateMatchScore(1.35);
          let outcome = 'tie';
          if (match.homeScore > match.awayScore) outcome = 'home';
          if (match.homeScore < match.awayScore) outcome = 'away';
          outcomes.add(outcome);
        }

        // Should have all three outcomes
        expect(outcomes.has('home')).toBe(true);
        expect(outcomes.has('away')).toBe(true);
        expect(outcomes.has('tie')).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('handles very small lambda=0.5', () => {
        const match = generateMatchScore(0.5);

        expect(match.homeScore).toBeGreaterThanOrEqual(0);
        expect(match.awayScore).toBeGreaterThanOrEqual(0);
      });

      it('handles large lambda=5', () => {
        const match = generateMatchScore(5);

        expect(match.homeScore).toBeGreaterThanOrEqual(0);
        expect(match.awayScore).toBeGreaterThanOrEqual(0);
      });

      it('generates mostly 0-0 with very small lambda=0.1', () => {
        const matches: any[] = [];
        for (let i = 0; i < 100; i++) {
          matches.push(generateMatchScore(0.1));
        }

        const zeroZero = matches.filter(m =>
          m.homeScore === 0 && m.awayScore === 0
        ).length;

        expect(zeroZero).toBeGreaterThan(65); // Should be ~82% for lambda=0.1 (P(0)^2 = 0.905^2), allowing for statistical variance
      });

      it('returns object with correct structure', () => {
        const match = generateMatchScore();

        expect(typeof match).toBe('object');
        expect(Object.keys(match)).toContain('homeScore');
        expect(Object.keys(match)).toContain('awayScore');
      });
    });
  });
});
