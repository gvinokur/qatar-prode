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

  describe('Goal Difference tier', () => {
    it('returns "goal_difference" when home wins with same margin (different scores)', () => {
      expect(calculatePredictionResult(2, 0, 3, 1)).toBe('goal_difference'); // margin +2 vs +2
      expect(calculatePredictionResult(3, 1, 2, 0)).toBe('goal_difference'); // margin +2 vs +2
    });

    it('returns "goal_difference" when away wins with same margin (different scores)', () => {
      expect(calculatePredictionResult(0, 2, 1, 3)).toBe('goal_difference'); // margin -2 vs -2
      expect(calculatePredictionResult(1, 3, 0, 2)).toBe('goal_difference'); // margin -2 vs -2
    });

    it('returns "goal_difference" for draws with different scores (margin always 0)', () => {
      expect(calculatePredictionResult(1, 1, 0, 0)).toBe('goal_difference');
      expect(calculatePredictionResult(0, 0, 2, 2)).toBe('goal_difference');
      expect(calculatePredictionResult(2, 2, 3, 3)).toBe('goal_difference');
    });
  });

  describe('Correct Winner - Home Win', () => {
    it('returns "correct" when both predicted and actual are home wins with different margins', () => {
      expect(calculatePredictionResult(1, 0, 2, 0)).toBe('correct'); // margin +1 vs +2
      expect(calculatePredictionResult(2, 0, 3, 0)).toBe('correct'); // margin +2 vs +3
    });
  });

  describe('Correct Winner - Away Win', () => {
    it('returns "correct" when both predicted and actual are away wins with different margins', () => {
      expect(calculatePredictionResult(0, 1, 0, 2)).toBe('correct'); // margin -1 vs -2
      expect(calculatePredictionResult(0, 2, 0, 3)).toBe('correct'); // margin -2 vs -3
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
      expect(calculatePredictionResult(5, 3, 6, 2)).toBe('correct'); // margin +2 vs +4
      expect(calculatePredictionResult(10, 0, 0, 10)).toBe('incorrect');
    });

    it('handles one-goal differences', () => {
      expect(calculatePredictionResult(1, 0, 1, 0)).toBe('exact');
      expect(calculatePredictionResult(1, 0, 2, 1)).toBe('goal_difference'); // margin +1 vs +1
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

  describe('Playoff penalty winner', () => {
    it('returns "exact" when scores match and no penaltyOptions provided (non-playoff, backward compat)', () => {
      expect(calculatePredictionResult(1, 1, 1, 1)).toBe('exact');
      expect(calculatePredictionResult(2, 0, 2, 0)).toBe('exact');
    });

    it('returns "exact" when scores match and penaltyOptions has no penalty scores (game did not go to penalties)', () => {
      expect(calculatePredictionResult(1, 1, 1, 1, {})).toBe('exact');
      expect(calculatePredictionResult(1, 1, 1, 1, { actualHomePenaltyScore: null, actualAwayPenaltyScore: null })).toBe('exact');
    });

    it('returns "exact" when scores match, game went to penalties, and predicted home penalty winner correctly', () => {
      expect(calculatePredictionResult(1, 1, 1, 1, {
        predictedHomePenaltyWinner: true,
        actualHomePenaltyScore: 4,
        actualAwayPenaltyScore: 2,
      })).toBe('exact');
    });

    it('returns "exact" when scores match, game went to penalties, and predicted away penalty winner correctly', () => {
      expect(calculatePredictionResult(1, 1, 1, 1, {
        predictedAwayPenaltyWinner: true,
        actualHomePenaltyScore: 2,
        actualAwayPenaltyScore: 4,
      })).toBe('exact');
    });

    it('returns "incorrect" when scores match, game went to penalties, and predicted home winner but away actually won', () => {
      expect(calculatePredictionResult(1, 1, 1, 1, {
        predictedHomePenaltyWinner: true,
        actualHomePenaltyScore: 2,
        actualAwayPenaltyScore: 4,
      })).toBe('incorrect');
    });

    it('returns "incorrect" when scores match, game went to penalties, and predicted away winner but home actually won', () => {
      expect(calculatePredictionResult(1, 1, 1, 1, {
        predictedAwayPenaltyWinner: true,
        actualHomePenaltyScore: 4,
        actualAwayPenaltyScore: 2,
      })).toBe('incorrect');
    });

    it('returns "incorrect" when scores match, game went to penalties, and neither penalty winner was predicted (incomplete prediction)', () => {
      expect(calculatePredictionResult(1, 1, 1, 1, {
        actualHomePenaltyScore: 4,
        actualAwayPenaltyScore: 2,
      })).toBe('incorrect');
    });

    // Non-exact draw (predicted draw, different score, game went to penalties)
    it('returns "goal_difference" when draw predicted (different score), game went to penalties, and predicted home penalty winner correctly', () => {
      expect(calculatePredictionResult(0, 0, 1, 1, {
        predictedHomePenaltyWinner: true,
        actualHomePenaltyScore: 4,
        actualAwayPenaltyScore: 2,
      })).toBe('goal_difference');
    });

    it('returns "goal_difference" when draw predicted (different score), game went to penalties, and predicted away penalty winner correctly', () => {
      expect(calculatePredictionResult(0, 0, 1, 1, {
        predictedAwayPenaltyWinner: true,
        actualHomePenaltyScore: 2,
        actualAwayPenaltyScore: 4,
      })).toBe('goal_difference');
    });

    it('returns "incorrect" when draw predicted (different score), game went to penalties, and predicted home winner but away actually won', () => {
      expect(calculatePredictionResult(0, 0, 1, 1, {
        predictedHomePenaltyWinner: true,
        actualHomePenaltyScore: 2,
        actualAwayPenaltyScore: 4,
      })).toBe('incorrect');
    });

    it('returns "incorrect" when draw predicted (different score), game went to penalties, and predicted away winner but home actually won', () => {
      expect(calculatePredictionResult(0, 0, 1, 1, {
        predictedAwayPenaltyWinner: true,
        actualHomePenaltyScore: 4,
        actualAwayPenaltyScore: 2,
      })).toBe('incorrect');
    });

    it('returns "incorrect" when draw predicted (different score), game went to penalties, and neither penalty winner was predicted', () => {
      expect(calculatePredictionResult(0, 0, 1, 1, {
        actualHomePenaltyScore: 4,
        actualAwayPenaltyScore: 2,
      })).toBe('incorrect');
    });

    it('returns "goal_difference" when draw predicted (different score) and game did not go to penalties', () => {
      expect(calculatePredictionResult(0, 0, 1, 1)).toBe('goal_difference');
      expect(calculatePredictionResult(0, 0, 1, 1, {})).toBe('goal_difference');
    });

    it('non-playoff home win with penaltyOptions — exact match is unaffected; same-margin win is goal_difference', () => {
      expect(calculatePredictionResult(2, 1, 2, 1, {
        predictedHomePenaltyWinner: true,
        actualHomePenaltyScore: 4,
        actualAwayPenaltyScore: 2,
      })).toBe('exact');
      expect(calculatePredictionResult(1, 0, 2, 1, {
        predictedHomePenaltyWinner: true,
        actualHomePenaltyScore: 4,
        actualAwayPenaltyScore: 2,
      })).toBe('goal_difference'); // margin +1 vs +1
    });
  });

  describe('Comprehensive Scenarios', () => {
    it('correctly classifies all possible outcomes for 2-1 actual score', () => {
      const actualHome = 2;
      const actualAway = 1;

      // Exact
      expect(calculatePredictionResult(2, 1, actualHome, actualAway)).toBe('exact');

      // Goal difference (same +1 margin)
      expect(calculatePredictionResult(1, 0, actualHome, actualAway)).toBe('goal_difference');
      expect(calculatePredictionResult(3, 2, actualHome, actualAway)).toBe('goal_difference');

      // Correct (home wins with different margin)
      expect(calculatePredictionResult(3, 0, actualHome, actualAway)).toBe('correct'); // margin +3 vs +1

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

      // Goal difference (draws with different scores — all margin=0)
      expect(calculatePredictionResult(0, 0, actualHome, actualAway)).toBe('goal_difference');
      expect(calculatePredictionResult(2, 2, actualHome, actualAway)).toBe('goal_difference');
      expect(calculatePredictionResult(3, 3, actualHome, actualAway)).toBe('goal_difference');

      // Incorrect (home wins)
      expect(calculatePredictionResult(1, 0, actualHome, actualAway)).toBe('incorrect');
      expect(calculatePredictionResult(2, 0, actualHome, actualAway)).toBe('incorrect');

      // Incorrect (away wins)
      expect(calculatePredictionResult(0, 1, actualHome, actualAway)).toBe('incorrect');
      expect(calculatePredictionResult(0, 2, actualHome, actualAway)).toBe('incorrect');
    });
  });
});
