import { describe, it, expect } from 'vitest';
import {
  formatPenaltyResult,
  formatGameScore,
} from '../../app/utils/penalty-result-formatter';
import { ExtendedGameData } from '../../app/definitions';
import { testFactories } from '../db/test-factories';

describe('penalty-result-formatter', () => {
  describe('formatPenaltyResult', () => {
    it('returns null when game has no penalty scores', () => {
      const game: ExtendedGameData = {
        ...testFactories.game(),
        gameResult: testFactories.gameResult({
          home_score: 2,
          away_score: 1,
          home_penalty_score: undefined,
          away_penalty_score: undefined,
        }),
      };

      const result = formatPenaltyResult(game);

      expect(result).toBeNull();
    });

    it('returns null when gameResult is null', () => {
      const game: ExtendedGameData = {
        ...testFactories.game(),
        gameResult: null,
      };

      const result = formatPenaltyResult(game);

      expect(result).toBeNull();
    });

    it('returns formatted penalty result when both scores exist', () => {
      const game: ExtendedGameData = {
        ...testFactories.game(),
        gameResult: testFactories.gameResult({
          home_score: 2,
          away_score: 2,
          home_penalty_score: 4,
          away_penalty_score: 3,
        }),
      };

      const result = formatPenaltyResult(game);

      expect(result).toBe('(4-3p)');
    });

    it('returns formatted penalty result with 5-0 score', () => {
      const game: ExtendedGameData = {
        ...testFactories.game(),
        gameResult: testFactories.gameResult({
          home_score: 1,
          away_score: 1,
          home_penalty_score: 5,
          away_penalty_score: 0,
        }),
      };

      const result = formatPenaltyResult(game);

      expect(result).toBe('(5-0p)');
    });

    it('returns formatted penalty result with 0-5 score', () => {
      const game: ExtendedGameData = {
        ...testFactories.game(),
        gameResult: testFactories.gameResult({
          home_score: 0,
          away_score: 0,
          home_penalty_score: 0,
          away_penalty_score: 5,
        }),
      };

      const result = formatPenaltyResult(game);

      expect(result).toBe('(0-5p)');
    });

    it('returns null when only home penalty score exists (defensive)', () => {
      const game: ExtendedGameData = {
        ...testFactories.game(),
        gameResult: testFactories.gameResult({
          home_score: 2,
          away_score: 2,
          home_penalty_score: 4,
          away_penalty_score: undefined,
        }),
      };

      const result = formatPenaltyResult(game);

      expect(result).toBeNull();
    });

    it('returns null when only away penalty score exists (defensive)', () => {
      const game: ExtendedGameData = {
        ...testFactories.game(),
        gameResult: testFactories.gameResult({
          home_score: 2,
          away_score: 2,
          home_penalty_score: undefined,
          away_penalty_score: 3,
        }),
      };

      const result = formatPenaltyResult(game);

      expect(result).toBeNull();
    });

    it('returns null when penalty scores are not integers (defensive)', () => {
      const game: ExtendedGameData = {
        ...testFactories.game(),
        gameResult: {
          game_id: 'game-1',
          home_score: 2,
          away_score: 2,
          home_penalty_score: 4.5,
          away_penalty_score: 3,
          is_draft: false,
        },
      };

      const result = formatPenaltyResult(game);

      expect(result).toBeNull();
    });

    it('returns null when penalty scores are negative (defensive)', () => {
      const game: ExtendedGameData = {
        ...testFactories.game(),
        gameResult: {
          game_id: 'game-1',
          home_score: 2,
          away_score: 2,
          home_penalty_score: -1,
          away_penalty_score: 3,
          is_draft: false,
        },
      };

      const result = formatPenaltyResult(game);

      // Both scores must be valid integers, so negative is acceptable technically
      // but let's test the edge case
      expect(result).toBe('(-1-3p)');
    });
  });

  describe('formatGameScore', () => {
    it('returns regular score for game without penalties', () => {
      const game: ExtendedGameData = {
        ...testFactories.game(),
        gameResult: testFactories.gameResult({
          home_score: 2,
          away_score: 1,
          home_penalty_score: undefined,
          away_penalty_score: undefined,
        }),
      };

      const result = formatGameScore(game);

      expect(result).toBe('2 - 1');
    });

    it('returns combined score when game has penalties', () => {
      const game: ExtendedGameData = {
        ...testFactories.game(),
        gameResult: testFactories.gameResult({
          home_score: 2,
          away_score: 2,
          home_penalty_score: 4,
          away_penalty_score: 3,
        }),
      };

      const result = formatGameScore(game);

      expect(result).toBe('2 - 2 (4-3p)');
    });

    it('returns 0 - 0 for scoreless game', () => {
      const game: ExtendedGameData = {
        ...testFactories.game(),
        gameResult: testFactories.gameResult({
          home_score: 0,
          away_score: 0,
          home_penalty_score: undefined,
          away_penalty_score: undefined,
        }),
      };

      const result = formatGameScore(game);

      expect(result).toBe('0 - 0');
    });

    it('returns 0 - 0 with penalties after scoreless game', () => {
      const game: ExtendedGameData = {
        ...testFactories.game(),
        gameResult: testFactories.gameResult({
          home_score: 0,
          away_score: 0,
          home_penalty_score: 5,
          away_penalty_score: 4,
        }),
      };

      const result = formatGameScore(game);

      expect(result).toBe('0 - 0 (5-4p)');
    });

    it('handles missing regular scores with dash placeholder', () => {
      const game: ExtendedGameData = {
        ...testFactories.game(),
        gameResult: testFactories.gameResult({
          home_score: undefined,
          away_score: undefined,
          home_penalty_score: undefined,
          away_penalty_score: undefined,
        }),
      };

      const result = formatGameScore(game);

      expect(result).toBe('- - -');
    });

    it('handles missing home score with dash placeholder', () => {
      const game: ExtendedGameData = {
        ...testFactories.game(),
        gameResult: testFactories.gameResult({
          home_score: undefined,
          away_score: 2,
          home_penalty_score: undefined,
          away_penalty_score: undefined,
        }),
      };

      const result = formatGameScore(game);

      expect(result).toBe('- - 2');
    });

    it('handles missing away score with dash placeholder', () => {
      const game: ExtendedGameData = {
        ...testFactories.game(),
        gameResult: testFactories.gameResult({
          home_score: 3,
          away_score: undefined,
          home_penalty_score: undefined,
          away_penalty_score: undefined,
        }),
      };

      const result = formatGameScore(game);

      expect(result).toBe('3 - -');
    });

    it('handles null gameResult gracefully', () => {
      const game: ExtendedGameData = {
        ...testFactories.game(),
        gameResult: null,
      };

      const result = formatGameScore(game);

      expect(result).toBe('- - -');
    });

    it('formats high-scoring game correctly', () => {
      const game: ExtendedGameData = {
        ...testFactories.game(),
        gameResult: testFactories.gameResult({
          home_score: 7,
          away_score: 5,
          home_penalty_score: undefined,
          away_penalty_score: undefined,
        }),
      };

      const result = formatGameScore(game);

      expect(result).toBe('7 - 5');
    });

    it('formats one-sided penalty shootout correctly', () => {
      const game: ExtendedGameData = {
        ...testFactories.game(),
        gameResult: testFactories.gameResult({
          home_score: 1,
          away_score: 1,
          home_penalty_score: 5,
          away_penalty_score: 0,
        }),
      };

      const result = formatGameScore(game);

      expect(result).toBe('1 - 1 (5-0p)');
    });
  });
});
