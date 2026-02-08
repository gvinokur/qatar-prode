import { describe, it, expect } from 'vitest';
import { calculateRanks, calculateRanksWithChange } from '../../app/utils/rank-calculator';

describe('rank-calculator', () => {
  describe('calculateRanks', () => {
    it('should assign rank 1 to highest scorer', () => {
      const users = [
        { userId: 'user1', totalPoints: 100 },
        { userId: 'user2', totalPoints: 90 },
        { userId: 'user3', totalPoints: 80 },
      ];

      const result = calculateRanks(users, 'totalPoints');

      expect(result[0].currentRank).toBe(1);
      expect(result[0].userId).toBe('user1');
    });

    it('should handle ties with competition ranking (1-2-2-4)', () => {
      const users = [
        { userId: 'user1', totalPoints: 100 },
        { userId: 'user2', totalPoints: 90 },
        { userId: 'user3', totalPoints: 90 },
        { userId: 'user4', totalPoints: 80 },
      ];

      const result = calculateRanks(users, 'totalPoints');

      expect(result[0].currentRank).toBe(1); // 100 points
      expect(result[1].currentRank).toBe(2); // 90 points (tied)
      expect(result[2].currentRank).toBe(2); // 90 points (tied)
      expect(result[3].currentRank).toBe(4); // 80 points (skips rank 3)
    });

    it('should handle all users with same score', () => {
      const users = [
        { userId: 'user1', totalPoints: 100 },
        { userId: 'user2', totalPoints: 100 },
        { userId: 'user3', totalPoints: 100 },
      ];

      const result = calculateRanks(users, 'totalPoints');

      expect(result[0].currentRank).toBe(1);
      expect(result[1].currentRank).toBe(1);
      expect(result[2].currentRank).toBe(1);
    });

    it('should handle empty array', () => {
      const result = calculateRanks([], 'totalPoints');

      expect(result).toEqual([]);
    });

    it('should handle single user', () => {
      const users = [{ userId: 'user1', totalPoints: 100 }];

      const result = calculateRanks(users, 'totalPoints');

      expect(result).toHaveLength(1);
      expect(result[0].currentRank).toBe(1);
    });

    it('should treat undefined scores as 0', () => {
      const users = [
        { userId: 'user1', totalPoints: 100 },
        { userId: 'user2', totalPoints: undefined },
        { userId: 'user3', totalPoints: 50 },
      ];

      const result = calculateRanks(users, 'totalPoints');

      expect(result[0].currentRank).toBe(1); // 100
      expect(result[1].currentRank).toBe(2); // 50
      expect(result[2].currentRank).toBe(3); // 0 (undefined)
    });

    it('should preserve original user data', () => {
      const users = [
        { userId: 'user1', totalPoints: 100, name: 'Alice' },
        { userId: 'user2', totalPoints: 90, name: 'Bob' },
      ];

      const result = calculateRanks(users, 'totalPoints');

      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
    });
  });

  describe('calculateRanksWithChange', () => {
    it('should calculate positive rank change (moved up)', () => {
      const users = [
        { userId: 'user1', totalPoints: 100, yesterdayTotalPoints: 80, currentRank: 1 },
        { userId: 'user2', totalPoints: 90, yesterdayTotalPoints: 100, currentRank: 2 },
      ];

      const result = calculateRanksWithChange(users, 'yesterdayTotalPoints');

      expect(result[0].rankChange).toBe(1); // Was rank 2, now rank 1 (moved up)
      expect(result[1].rankChange).toBe(-1); // Was rank 1, now rank 2 (moved down)
    });

    it('should calculate zero rank change (no movement)', () => {
      const users = [
        { userId: 'user1', totalPoints: 100, yesterdayTotalPoints: 100, currentRank: 1 },
        { userId: 'user2', totalPoints: 90, yesterdayTotalPoints: 90, currentRank: 2 },
      ];

      const result = calculateRanksWithChange(users, 'yesterdayTotalPoints');

      expect(result[0].rankChange).toBe(0);
      expect(result[1].rankChange).toBe(0);
    });

    it('should calculate negative rank change (moved down)', () => {
      const users = [
        { userId: 'user1', totalPoints: 90, yesterdayTotalPoints: 100, currentRank: 2 },
        { userId: 'user2', totalPoints: 100, yesterdayTotalPoints: 90, currentRank: 1 },
      ];

      const result = calculateRanksWithChange(users, 'yesterdayTotalPoints');

      expect(result[0].rankChange).toBe(-1); // Was rank 1, now rank 2
      expect(result[1].rankChange).toBe(1); // Was rank 2, now rank 1
    });

    it('should handle missing yesterday data (all tied at 0)', () => {
      const users = [
        { userId: 'user1', totalPoints: 100, currentRank: 1 },
        { userId: 'user2', totalPoints: 90, currentRank: 2 },
      ];

      const result = calculateRanksWithChange(users, 'yesterdayTotalPoints');

      // When yesterday data is missing (undefined), treated as 0 points
      // Both were tied at rank 1 yesterday with 0 points
      expect(result[0].rankChange).toBe(0); // Stayed at rank 1
      expect(result[1].rankChange).toBe(-1); // Moved down from rank 1 to rank 2
    });

    it('should handle ties in yesterday ranks', () => {
      const users = [
        { userId: 'user1', totalPoints: 100, yesterdayTotalPoints: 90, currentRank: 1 },
        { userId: 'user2', totalPoints: 95, yesterdayTotalPoints: 90, currentRank: 2 },
        { userId: 'user3', totalPoints: 90, yesterdayTotalPoints: 90, currentRank: 3 },
      ];

      const result = calculateRanksWithChange(users, 'yesterdayTotalPoints');

      // All were tied at rank 1 yesterday with 90 points
      // user1 moved to rank 1 (no change from rank 1)
      // user2 moved to rank 2 (down from rank 1)
      // user3 moved to rank 3 (down from rank 1)
      expect(result[0].rankChange).toBe(0);
      expect(result[1].rankChange).toBe(-1);
      expect(result[2].rankChange).toBe(-2);
    });

    it('should work with different user ID field names', () => {
      const users = [
        { user_id: 'user1', totalPoints: 100, yesterdayTotalPoints: 90, currentRank: 1 },
        { user_id: 'user2', totalPoints: 90, yesterdayTotalPoints: 100, currentRank: 2 },
      ];

      const result = calculateRanksWithChange(users, 'yesterdayTotalPoints');

      expect(result[0].rankChange).toBe(1);
      expect(result[1].rankChange).toBe(-1);
    });
  });
});
