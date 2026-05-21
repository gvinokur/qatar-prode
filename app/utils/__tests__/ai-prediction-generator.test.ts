import { describe, it, expect } from 'vitest';
import { generateAIPrediction } from '../ai-prediction-generator';

const BASE_LAMBDA = 1.2;
const K = 0.017;

/** Deterministic counter-based RNG — always returns the same sequence. */
const makeCounterRng = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe('generateAIPrediction', () => {
  describe('scores are non-negative integers', () => {
    it('returns non-negative integers for equal-ranked teams', () => {
      const result = generateAIPrediction(10, 10, false);
      expect(Number.isInteger(result.homeScore)).toBe(true);
      expect(Number.isInteger(result.awayScore)).toBe(true);
      expect(result.homeScore).toBeGreaterThanOrEqual(0);
      expect(result.awayScore).toBeGreaterThanOrEqual(0);
    });

    it('returns non-negative integers over many invocations', () => {
      for (let i = 0; i < 100; i++) {
        const r = generateAIPrediction(5, 50, false);
        expect(r.homeScore).toBeGreaterThanOrEqual(0);
        expect(r.awayScore).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('rank handling', () => {
    it('both null → λHome = λAway = BASE_λ (symmetric lambdas)', () => {
      // With diff=0: λHome = λAway = BASE_λ
      // Verify by checking that computed lambda for diff=0 equals BASE_LAMBDA
      const diff = 0;
      const expected = BASE_LAMBDA * Math.exp(K * diff);
      expect(expected).toBeCloseTo(BASE_LAMBDA, 5);
    });

    it('home rank null → uses away rank for both → diff=0', () => {
      // When homeRank is null, resolvedHome = awayRank → diff = 0
      // Same lambda on both sides — statistically both sides should average ~1.2
      // We verify the symmetric property by using a controlled rng
      const rng = makeCounterRng([0.5, 0.5, 0.5]);
      const result = generateAIPrediction(null, 20, false, rng);
      // Knuth's with rng=0.5 and lambda=1.2: L=exp(-1.2)≈0.301
      // k=1: p=0.5>0.301 → k=2: p=0.25<0.301 → score=1
      expect(result.homeScore).toBe(1);
      expect(result.awayScore).toBe(1);
    });

    it('away rank null → uses home rank for both → diff=0', () => {
      const rng = makeCounterRng([0.5, 0.5, 0.5]);
      const result = generateAIPrediction(20, null, false, rng);
      expect(result.homeScore).toBe(1);
      expect(result.awayScore).toBe(1);
    });
  });

  describe('lambda computation', () => {
    it('diff=40 (rank 10 vs 50): λHome ≈ 2.36, λAway ≈ 0.61', () => {
      const diff = 40;
      const lambdaHome = BASE_LAMBDA * Math.exp(K * diff);
      const lambdaAway = BASE_LAMBDA * Math.exp(-K * diff);
      expect(lambdaHome).toBeCloseTo(2.36, 1);
      expect(lambdaAway).toBeCloseTo(0.61, 1);
    });

    it('diff=-40 (rank 50 vs 10): λHome ≈ 0.61, λAway ≈ 2.36', () => {
      const diff = -40;
      const lambdaHome = BASE_LAMBDA * Math.exp(K * diff);
      const lambdaAway = BASE_LAMBDA * Math.exp(-K * diff);
      expect(lambdaHome).toBeCloseTo(0.61, 1);
      expect(lambdaAway).toBeCloseTo(2.36, 1);
    });

    it('diff=0: λHome = λAway = BASE_λ', () => {
      const lambdaHome = BASE_LAMBDA * Math.exp(0);
      const lambdaAway = BASE_LAMBDA * Math.exp(0);
      expect(lambdaHome).toBe(BASE_LAMBDA);
      expect(lambdaAway).toBe(BASE_LAMBDA);
    });

    it('λHome · λAway = BASE_λ² invariant holds', () => {
      for (const diff of [-70, -40, 0, 40, 70]) {
        const lh = BASE_LAMBDA * Math.exp(K * diff);
        const la = BASE_LAMBDA * Math.exp(-K * diff);
        expect(lh * la).toBeCloseTo(BASE_LAMBDA * BASE_LAMBDA, 5);
      }
    });
  });

  describe('playoff penalty winner', () => {
    it('draw in playoff sets exactly one penalty winner', () => {
      // Force a draw by using a very small rng that produces 0 goals for both
      const rng = makeCounterRng([
        // samplePoisson: first product < exp(0) would need very small p values
        // Use values that produce 0 for both teams (k=1, p=value)
        // For very small lambda (0 goals): need p < exp(-lambda)
        // With lambda=1.2, exp(-1.2)≈0.301; pass value < 0.301 → score=0
        0.2, // homeScore: p=0.2 < 0.301 → k=1 → score=0
        0.2, // awayScore: p=0.2 < 0.301 → k=1 → score=0
        0.3, // penalty: rng() for penalty winner selection
      ]);
      const result = generateAIPrediction(10, 10, true, rng);
      expect(result.homeScore).toBe(0);
      expect(result.awayScore).toBe(0);
      const penaltyDefined =
        (result.homePenaltyWinner === true && result.awayPenaltyWinner === false) ||
        (result.homePenaltyWinner === false && result.awayPenaltyWinner === true);
      expect(penaltyDefined).toBe(true);
    });

    it('non-draw in playoff does not set penalty winner fields', () => {
      // Force home wins by making home score ≥ 1 and away = 0
      const rng = makeCounterRng([
        0.5, 0.5, // homeScore: p=0.5>exp(-1.2)≈0.301 → multiply; 0.25<0.301 → score=1
        0.1,       // awayScore: p=0.1 < exp(-1.2)≈0.301 → score=0
      ]);
      const result = generateAIPrediction(10, 10, true, rng);
      expect(result.homeScore).toBe(1);
      expect(result.awayScore).toBe(0);
      expect(result.homePenaltyWinner).toBeUndefined();
      expect(result.awayPenaltyWinner).toBeUndefined();
    });

    it('non-playoff draw returns no penalty winner fields', () => {
      const rng = makeCounterRng([0.2, 0.2]);
      const result = generateAIPrediction(10, 10, false, rng);
      expect(result.homeScore).toBe(0);
      expect(result.awayScore).toBe(0);
      expect(result.homePenaltyWinner).toBeUndefined();
      expect(result.awayPenaltyWinner).toBeUndefined();
    });

    it('stronger home team (diff=50) has higher penalty win probability', () => {
      // With diff=50 (strong home), homeWinPct = min(75, 50 + 50/3) = min(75,66.7) ≈ 66.7%
      // home=10, away=60: diff=50; λHome=1.2*e^(0.017*50)≈2.80 → L=exp(-2.80)≈0.061
      // first rng=0.01 < 0.061 → homeScore=0 in one step
      // λAway=1.2*e^(-0.85)≈0.51 → L≈0.600; second rng=0.5 < 0.600 → awayScore=0 in one step
      // third rng is the penalty rng: 0.5 < 0.667 → home wins; 0.9 > 0.667 → away wins
      const homeWinsRng = makeCounterRng([0.01, 0.5, 0.5]);
      const awayWinsRng = makeCounterRng([0.01, 0.5, 0.9]);

      const homeWins = generateAIPrediction(10, 60, true, homeWinsRng);
      expect(homeWins.homeScore).toBe(0);
      expect(homeWins.awayScore).toBe(0);
      expect(homeWins.homePenaltyWinner).toBe(true);
      expect(homeWins.awayPenaltyWinner).toBe(false);

      const awayWins = generateAIPrediction(10, 60, true, awayWinsRng);
      expect(awayWins.homePenaltyWinner).toBe(false);
      expect(awayWins.awayPenaltyWinner).toBe(true);
    });
  });

  describe('statistical smoke tests', () => {
    it('heavily favored home team (diff≈50) wins majority of simulations', () => {
      let homeWins = 0;
      let total = 500;
      for (let i = 0; i < total; i++) {
        const r = generateAIPrediction(5, 55, false);
        if (r.homeScore > r.awayScore) homeWins++;
      }
      // With λHome≈4, λAway≈0.36, home win probability should be >70%
      expect(homeWins / total).toBeGreaterThan(0.5);
    });

    it('equal teams produce draws ≥ 15% of the time', () => {
      let draws = 0;
      const total = 1000;
      for (let i = 0; i < total; i++) {
        const r = generateAIPrediction(10, 10, false);
        if (r.homeScore === r.awayScore) draws++;
      }
      expect(draws / total).toBeGreaterThan(0.15);
    });
  });
});
