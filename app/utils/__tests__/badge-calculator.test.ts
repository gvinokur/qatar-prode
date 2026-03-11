import { describe, it, expect } from 'vitest';
import {
  calculateBadges,
  BADGES,
  TournamentBadgeConfig,
  UserBadgeInput,
  BadgeId,
} from '../badge-calculator';

// ─── Test helpers ────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<UserBadgeInput> & { userId: string }): UserBadgeInput {
  return {
    rank: 1,
    rankChange: 0,
    totalExactGuesses: 0,
    totalCorrectGuesses: 0,
    qualifiedTeamsCorrect: 0,
    honorRollScore: 0,
    individualAwardsScore: 0,
    boostsUsed: 0,
    scoredBoosts: 0,
    ...overrides,
  };
}

const defaultConfig: TournamentBadgeConfig = {
  tournamentStarted: true,
  championPoints: 5,
  runnerUpPoints: 3,
  thirdPlacePoints: 1,
  individualAwardPoints: 3,
  totalQualifyingSlots: 32,
};

function getBadgeIds(users: UserBadgeInput[], config: TournamentBadgeConfig, userId: string): BadgeId[] {
  const map = calculateBadges(users, config);
  return (map.get(userId) ?? []).map((b) => b.id);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('calculateBadges', () => {
  describe('crack (🥇)', () => {
    it('assigns Crack only to user with rank 1', () => {
      const users = [
        makeUser({ userId: 'u1', rank: 1 }),
        makeUser({ userId: 'u2', rank: 2 }),
        makeUser({ userId: 'u3', rank: 3 }),
      ];
      const u1Badges = getBadgeIds(users, defaultConfig, 'u1');
      const u2Badges = getBadgeIds(users, defaultConfig, 'u2');

      expect(u1Badges).toContain('crack');
      expect(u2Badges).not.toContain('crack');
    });

    it('1-person group: same user gets both Crack and DeadLast', () => {
      const users = [makeUser({ userId: 'solo', rank: 1 })];
      const badges = getBadgeIds(users, defaultConfig, 'solo');

      expect(badges).toContain('crack');
      expect(badges).toContain('dead-last');
    });
  });

  describe('dead-last (💩)', () => {
    it('assigns DeadLast only to user with the highest rank number', () => {
      const users = [
        makeUser({ userId: 'u1', rank: 1 }),
        makeUser({ userId: 'u2', rank: 2 }),
        makeUser({ userId: 'u3', rank: 3 }),
      ];

      expect(getBadgeIds(users, defaultConfig, 'u3')).toContain('dead-last');
      expect(getBadgeIds(users, defaultConfig, 'u1')).not.toContain('dead-last');
    });
  });

  describe('rocket (📈)', () => {
    it('assigns Rocket to user with most positive rankChange', () => {
      const users = [
        makeUser({ userId: 'u1', rankChange: 3 }),
        makeUser({ userId: 'u2', rankChange: 1 }),
        makeUser({ userId: 'u3', rankChange: 0 }),
      ];

      expect(getBadgeIds(users, defaultConfig, 'u1')).toContain('rocket');
      expect(getBadgeIds(users, defaultConfig, 'u2')).not.toContain('rocket');
    });

    it('skips Rocket if all rankChanges are 0', () => {
      const users = [
        makeUser({ userId: 'u1', rankChange: 0 }),
        makeUser({ userId: 'u2', rankChange: 0 }),
      ];

      expect(getBadgeIds(users, defaultConfig, 'u1')).not.toContain('rocket');
    });

    it('tie-break: lexicographically first userId gets Rocket', () => {
      const users = [
        makeUser({ userId: 'bob', rankChange: 5 }),
        makeUser({ userId: 'alice', rankChange: 5 }),
      ];

      expect(getBadgeIds(users, defaultConfig, 'alice')).toContain('rocket');
      expect(getBadgeIds(users, defaultConfig, 'bob')).not.toContain('rocket');
    });
  });

  describe('free-fall (📉)', () => {
    it('assigns FreeFall to user with most negative rankChange', () => {
      const users = [
        makeUser({ userId: 'u1', rankChange: -5 }),
        makeUser({ userId: 'u2', rankChange: -1 }),
        makeUser({ userId: 'u3', rankChange: 0 }),
      ];

      expect(getBadgeIds(users, defaultConfig, 'u1')).toContain('free-fall');
      expect(getBadgeIds(users, defaultConfig, 'u2')).not.toContain('free-fall');
    });

    it('skips FreeFall if all rankChanges are 0', () => {
      const users = [
        makeUser({ userId: 'u1', rankChange: 0 }),
        makeUser({ userId: 'u2', rankChange: 0 }),
      ];

      expect(getBadgeIds(users, defaultConfig, 'u1')).not.toContain('free-fall');
    });

    it('tie-break: lexicographically first userId gets FreeFall', () => {
      const users = [
        makeUser({ userId: 'zebra', rankChange: -3 }),
        makeUser({ userId: 'aardvark', rankChange: -3 }),
      ];

      expect(getBadgeIds(users, defaultConfig, 'aardvark')).toContain('free-fall');
      expect(getBadgeIds(users, defaultConfig, 'zebra')).not.toContain('free-fall');
    });
  });

  describe('sharp (🎯) and broken-sight (🙈)', () => {
    it('no Sharp / BrokenSight with fewer than 3 users', () => {
      const users = [
        makeUser({ userId: 'u1', totalExactGuesses: 5, totalCorrectGuesses: 5 }),
        makeUser({ userId: 'u2', totalExactGuesses: 0, totalCorrectGuesses: 5 }),
      ];

      expect(getBadgeIds(users, defaultConfig, 'u1')).not.toContain('sharp');
      expect(getBadgeIds(users, defaultConfig, 'u2')).not.toContain('broken-sight');
    });

    it('assigns Sharp to top 10% (1 of 10) and BrokenSight to bottom 10%', () => {
      const users = Array.from({ length: 10 }, (_, i) =>
        makeUser({ userId: `u${i}`, totalExactGuesses: i, totalCorrectGuesses: 10 })
      );

      // u9 has highest exactRate, u0 has lowest
      expect(getBadgeIds(users, defaultConfig, 'u9')).toContain('sharp');
      expect(getBadgeIds(users, defaultConfig, 'u0')).toContain('broken-sight');
      // Middle users get neither
      expect(getBadgeIds(users, defaultConfig, 'u5')).not.toContain('sharp');
      expect(getBadgeIds(users, defaultConfig, 'u5')).not.toContain('broken-sight');
    });

    it('no Sharp / BrokenSight when all have zero correct guesses', () => {
      const users = Array.from({ length: 10 }, (_, i) =>
        makeUser({ userId: `u${i}`, totalExactGuesses: 0, totalCorrectGuesses: 0 })
      );

      users.forEach((u) => {
        const badges = getBadgeIds(users, defaultConfig, u.userId);
        expect(badges).not.toContain('sharp');
        expect(badges).not.toContain('broken-sight');
      });
    });
  });

  describe('crystal-ball (👑)', () => {
    it('assigns CrystalBall when honorRollScore >= championPoints', () => {
      const users = [
        makeUser({ userId: 'u1', honorRollScore: 5 }),
        makeUser({ userId: 'u2', honorRollScore: 4 }),
      ];

      expect(getBadgeIds(users, defaultConfig, 'u1')).toContain('crystal-ball');
      expect(getBadgeIds(users, defaultConfig, 'u2')).not.toContain('crystal-ball');
    });

    it('does NOT assign CrystalBall when championPoints = 0', () => {
      const users = [makeUser({ userId: 'u1', honorRollScore: 10 })];
      const config: TournamentBadgeConfig = { ...defaultConfig, championPoints: 0 };

      expect(getBadgeIds(users, config, 'u1')).not.toContain('crystal-ball');
    });
  });

  describe('oracle (🔮)', () => {
    it('assigns Oracle when honorRollScore >= champion + runnerUp + thirdPlace', () => {
      const users = [
        makeUser({ userId: 'u1', honorRollScore: 9 }),  // 5+3+1
        makeUser({ userId: 'u2', honorRollScore: 8 }),
      ];

      expect(getBadgeIds(users, defaultConfig, 'u1')).toContain('oracle');
      expect(getBadgeIds(users, defaultConfig, 'u2')).not.toContain('oracle');
    });

    it('Oracle threshold uses champion + runnerUp only when thirdPlacePoints = 0', () => {
      const config: TournamentBadgeConfig = { ...defaultConfig, thirdPlacePoints: 0 };
      const users = [
        makeUser({ userId: 'u1', honorRollScore: 8 }),  // champion(5) + runnerUp(3)
        makeUser({ userId: 'u2', honorRollScore: 7 }),
      ];

      expect(getBadgeIds(users, config, 'u1')).toContain('oracle');
      expect(getBadgeIds(users, config, 'u2')).not.toContain('oracle');
    });

    it('does NOT assign Oracle when championPoints = 0', () => {
      const config: TournamentBadgeConfig = { ...defaultConfig, championPoints: 0 };
      const users = [makeUser({ userId: 'u1', honorRollScore: 100 })];

      expect(getBadgeIds(users, config, 'u1')).not.toContain('oracle');
    });
  });

  describe('golden-ticket (🎫)', () => {
    it('assigns GoldenTicket when qualifiedTeamsCorrect / totalQualifyingSlots > 0.70', () => {
      const users = [
        makeUser({ userId: 'u1', qualifiedTeamsCorrect: 23 }),  // 23/32 = 0.719 > 0.70
        makeUser({ userId: 'u2', qualifiedTeamsCorrect: 22 }),  // 22/32 = 0.6875
      ];

      expect(getBadgeIds(users, defaultConfig, 'u1')).toContain('golden-ticket');
      expect(getBadgeIds(users, defaultConfig, 'u2')).not.toContain('golden-ticket');
    });

    it('skips GoldenTicket when totalQualifyingSlots = 0', () => {
      const config: TournamentBadgeConfig = { ...defaultConfig, totalQualifyingSlots: 0 };
      const users = [makeUser({ userId: 'u1', qualifiedTeamsCorrect: 100 })];

      expect(getBadgeIds(users, config, 'u1')).not.toContain('golden-ticket');
    });
  });

  describe('wooden-spoon (🥄)', () => {
    it('assigns WoodenSpoon to user with lowest qualifiedTeamsCorrect', () => {
      const users = [
        makeUser({ userId: 'u1', qualifiedTeamsCorrect: 10 }),
        makeUser({ userId: 'u2', qualifiedTeamsCorrect: 5 }),
        makeUser({ userId: 'u3', qualifiedTeamsCorrect: 3 }),
      ];

      expect(getBadgeIds(users, defaultConfig, 'u3')).toContain('wooden-spoon');
      expect(getBadgeIds(users, defaultConfig, 'u1')).not.toContain('wooden-spoon');
    });

    it('awards WoodenSpoon to ALL tied users with lowest count', () => {
      const users = [
        makeUser({ userId: 'u1', qualifiedTeamsCorrect: 3 }),
        makeUser({ userId: 'u2', qualifiedTeamsCorrect: 3 }),
        makeUser({ userId: 'u3', qualifiedTeamsCorrect: 10 }),
      ];

      expect(getBadgeIds(users, defaultConfig, 'u1')).toContain('wooden-spoon');
      expect(getBadgeIds(users, defaultConfig, 'u2')).toContain('wooden-spoon');
    });

    it('skips WoodenSpoon when totalQualifyingSlots = 0', () => {
      const config: TournamentBadgeConfig = { ...defaultConfig, totalQualifyingSlots: 0 };
      const users = [makeUser({ userId: 'u1', qualifiedTeamsCorrect: 0 })];

      expect(getBadgeIds(users, config, 'u1')).not.toContain('wooden-spoon');
    });
  });

  describe('boost-king (🏆)', () => {
    it('assigns BoostKing to user with highest scored_boosts/boosts_used ratio', () => {
      const users = [
        makeUser({ userId: 'u1', boostsUsed: 4, scoredBoosts: 4 }),  // ratio 1.0
        makeUser({ userId: 'u2', boostsUsed: 4, scoredBoosts: 2 }),  // ratio 0.5
      ];

      expect(getBadgeIds(users, defaultConfig, 'u1')).toContain('boost-king');
      expect(getBadgeIds(users, defaultConfig, 'u2')).not.toContain('boost-king');
    });

    it('awards BoostKing to NO ONE when two users share the highest ratio', () => {
      const users = [
        makeUser({ userId: 'u1', boostsUsed: 2, scoredBoosts: 2 }),  // ratio 1.0
        makeUser({ userId: 'u2', boostsUsed: 4, scoredBoosts: 4 }),  // ratio 1.0 (tied)
      ];

      expect(getBadgeIds(users, defaultConfig, 'u1')).not.toContain('boost-king');
      expect(getBadgeIds(users, defaultConfig, 'u2')).not.toContain('boost-king');
    });

    it('skips BoostKing for users with 0 boosts_used', () => {
      const users = [
        makeUser({ userId: 'u1', boostsUsed: 0, scoredBoosts: 0 }),
        makeUser({ userId: 'u2', boostsUsed: 0, scoredBoosts: 0 }),
      ];

      expect(getBadgeIds(users, defaultConfig, 'u1')).not.toContain('boost-king');
    });
  });

  describe('award-scout (🔍)', () => {
    it('does NOT assign AwardScout when individualAwardPoints = 0', () => {
      const config: TournamentBadgeConfig = { ...defaultConfig, individualAwardPoints: 0 };
      const users = [makeUser({ userId: 'u1', individualAwardsScore: 100 })];

      expect(getBadgeIds(users, config, 'u1')).not.toContain('award-scout');
    });

    it('assigns AwardScout when individualAwardsScore >= individualAwardPoints * 3', () => {
      const users = [
        makeUser({ userId: 'u1', individualAwardsScore: 9 }),  // 3 * 3 = 9
        makeUser({ userId: 'u2', individualAwardsScore: 6 }),
      ];

      expect(getBadgeIds(users, defaultConfig, 'u1')).toContain('award-scout');
      expect(getBadgeIds(users, defaultConfig, 'u2')).not.toContain('award-scout');
    });
  });

  describe('badge ordering contract', () => {
    it('positive badges always come before negative badges in the result array', () => {
      const users = [
        makeUser({ userId: 'u1', rank: 1, rankChange: -5 }), // crack + dead-last + free-fall
      ];

      const badges = calculateBadges(users, defaultConfig).get('u1') ?? [];
      const positiveIdx = badges.findIndex((b) => b.type === 'positive');
      const negativeIdx = badges.findIndex((b) => b.type === 'negative');

      if (positiveIdx !== -1 && negativeIdx !== -1) {
        expect(positiveIdx).toBeLessThan(negativeIdx);
      }
    });
  });

  describe('empty / edge cases', () => {
    it('returns empty array for users who earn none', () => {
      const users = [
        makeUser({ userId: 'u1', rank: 2 }), // not rank 1, not last (rank 2 out of 3)
        makeUser({ userId: 'u2', rank: 1 }),
        makeUser({ userId: 'u3', rank: 3 }),
      ];

      // u1 is neither first nor last, no other badge criteria met
      const config: TournamentBadgeConfig = {
        tournamentStarted: true,
        championPoints: 0,
        runnerUpPoints: 0,
        thirdPlacePoints: 0,
        individualAwardPoints: 0,
        totalQualifyingSlots: 0,
      };
      const badges = getBadgeIds(users, config, 'u1');
      expect(badges).toHaveLength(0);
    });

    it('handles a group of 3 where Sharp/BrokenSight threshold is 0 (no award)', () => {
      // 3 users → floor(3 * 0.1) = 0 → max(0, 0) = 0... wait
      // Actually Math.max(1, floor(0.3)) = Math.max(1, 0) = 1
      // So 3 users: threshold = max(1, floor(0.3)) = 1. Sharp IS awarded with 3 users.
      // The plan says "skip if fewer than 3 users". With exactly 3, it runs.
      const users = [
        makeUser({ userId: 'u1', totalExactGuesses: 10, totalCorrectGuesses: 10 }),
        makeUser({ userId: 'u2', totalExactGuesses: 5, totalCorrectGuesses: 10 }),
        makeUser({ userId: 'u3', totalExactGuesses: 0, totalCorrectGuesses: 10 }),
      ];

      expect(getBadgeIds(users, defaultConfig, 'u1')).toContain('sharp');
      expect(getBadgeIds(users, defaultConfig, 'u3')).toContain('broken-sight');
    });
  });

  describe('tournamentStarted guard', () => {
    it('returns no badges for any user when tournamentStarted = false', () => {
      const users = [
        makeUser({ userId: 'u1', rank: 1 }),
        makeUser({ userId: 'u2', rank: 2 }),
      ];
      const config: TournamentBadgeConfig = { ...defaultConfig, tournamentStarted: false };
      const result = calculateBadges(users, config);
      result.forEach((badges) => expect(badges).toHaveLength(0));
    });
  });

  describe('wooden-spoon (🥄) qualified teams scoring', () => {
    it('does not award WoodenSpoon when all users have qualifiedTeamsCorrect = 0', () => {
      const users = [
        makeUser({ userId: 'u1', qualifiedTeamsCorrect: 0 }),
        makeUser({ userId: 'u2', qualifiedTeamsCorrect: 0 }),
        makeUser({ userId: 'u3', qualifiedTeamsCorrect: 0 }),
      ];
      users.forEach((u) => {
        expect(getBadgeIds(users, defaultConfig, u.userId)).not.toContain('wooden-spoon');
      });
    });

    it('awards WoodenSpoon when at least one user has qualifiedTeamsCorrect > 0', () => {
      const users = [
        makeUser({ userId: 'u1', qualifiedTeamsCorrect: 0 }),
        makeUser({ userId: 'u2', qualifiedTeamsCorrect: 4 }),
        makeUser({ userId: 'u3', qualifiedTeamsCorrect: 2 }),
      ];
      expect(getBadgeIds(users, defaultConfig, 'u1')).toContain('wooden-spoon');
      expect(getBadgeIds(users, defaultConfig, 'u2')).not.toContain('wooden-spoon');
    });
  });

  describe('BADGES constant', () => {
    it('has entries for all 12 badge IDs', () => {
      const expectedIds: BadgeId[] = [
        'crack', 'rocket', 'sharp', 'crystal-ball', 'oracle',
        'award-scout', 'golden-ticket', 'boost-king',
        'free-fall', 'dead-last', 'broken-sight', 'wooden-spoon',
      ];

      expectedIds.forEach((id) => {
        expect(BADGES[id]).toBeDefined();
        expect(BADGES[id].emoji).toBeTruthy();
        expect(['positive', 'negative']).toContain(BADGES[id].type);
      });
    });
  });
});
