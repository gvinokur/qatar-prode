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

// ─── Emoji regression tests ───────────────────────────────────────────────────

describe('Badge emoji updates', () => {
  it('rocket badge has emoji 🚀', () => {
    expect(BADGES['rocket'].emoji).toBe('🚀');
  });

  it('free-fall badge has emoji 🪂', () => {
    expect(BADGES['free-fall'].emoji).toBe('🪂');
  });
});

// ─── on-fire (🔥) ─────────────────────────────────────────────────────────────

describe('on-fire badge (🔥)', () => {
  it('suppressed when fewer than 3 snapshots exist for user', () => {
    const users = [
      makeUser({ userId: 'u1', rank: 2, rankHistory: [3, 2] }),
      makeUser({ userId: 'u2', rank: 3 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).not.toContain('on-fire');
  });

  it('awarded when last 3 ranks are strictly decreasing (rank# improving)', () => {
    const users = [
      makeUser({ userId: 'u1', rank: 2, rankHistory: [5, 4, 3, 2] }),
      makeUser({ userId: 'u2', rank: 3 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).toContain('on-fire');
  });

  it('not awarded when last two consecutive ranks are equal (strict required)', () => {
    const users = [
      makeUser({ userId: 'u1', rank: 2, rankHistory: [5, 3, 3, 2] }),
      makeUser({ userId: 'u2', rank: 3 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).not.toContain('on-fire');
  });

  it('not awarded when ranks are increasing (worsening)', () => {
    const users = [
      makeUser({ userId: 'u1', rank: 4, rankHistory: [2, 3, 4] }),
      makeUser({ userId: 'u2', rank: 3 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).not.toContain('on-fire');
  });
});

// ─── ice-cold (🧊) ────────────────────────────────────────────────────────────

describe('ice-cold badge (🧊)', () => {
  it('suppressed when fewer than 3 snapshots exist for user', () => {
    const users = [
      makeUser({ userId: 'u1', rank: 3, rankHistory: [1, 3] }),
      makeUser({ userId: 'u2', rank: 1 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).not.toContain('ice-cold');
  });

  it('awarded when last 3 ranks are strictly increasing (rank# worsening)', () => {
    const users = [
      makeUser({ userId: 'u1', rank: 3, rankHistory: [1, 2, 3] }),
      makeUser({ userId: 'u2', rank: 1 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).toContain('ice-cold');
  });

  it('not awarded when rank unchanged between consecutive pair', () => {
    const users = [
      makeUser({ userId: 'u1', rank: 3, rankHistory: [1, 2, 2, 3] }),
      makeUser({ userId: 'u2', rank: 1 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).not.toContain('ice-cold');
  });

  it('cannot be held simultaneously with on-fire (mutually exclusive)', () => {
    // A strictly decreasing sequence cannot also be strictly increasing
    const users = [
      makeUser({ userId: 'u1', rank: 2, rankHistory: [5, 4, 3, 2] }), // on-fire
      makeUser({ userId: 'u2', rank: 1 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).toContain('on-fire');
    expect(badges).not.toContain('ice-cold');
  });
});

// ─── trending-up (📈) ─────────────────────────────────────────────────────────

describe('trending-up badge (📈)', () => {
  it('suppressed when fewer than 5 snapshots exist for user', () => {
    const users = [
      makeUser({ userId: 'u1', rank: 2, rankHistory: [5, 4, 3, 2] }),
      makeUser({ userId: 'u2', rank: 3 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).not.toContain('trending-up');
  });

  it('awarded when rank improved vs 5 snapshots ago', () => {
    const users = [
      makeUser({ userId: 'u1', rank: 2, rankHistory: [5, 4, 3, 3, 2] }),
      makeUser({ userId: 'u2', rank: 3 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).toContain('trending-up');
  });

  it('not awarded when rank unchanged from 5 snapshots ago (flat trend)', () => {
    const users = [
      makeUser({ userId: 'u1', rank: 3, rankHistory: [3, 4, 2, 4, 3] }),
      makeUser({ userId: 'u2', rank: 2 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).not.toContain('trending-up');
  });

  it('not awarded when rank declined from 5 snapshots ago', () => {
    const users = [
      makeUser({ userId: 'u1', rank: 4, rankHistory: [2, 2, 3, 3, 4] }),
      makeUser({ userId: 'u2', rank: 2 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).not.toContain('trending-up');
  });
});

// ─── trending-down (📉) ───────────────────────────────────────────────────────

describe('trending-down badge (📉)', () => {
  it('suppressed when fewer than 5 snapshots exist for user', () => {
    const users = [
      makeUser({ userId: 'u1', rank: 4, rankHistory: [2, 3, 4] }),
      makeUser({ userId: 'u2', rank: 2 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).not.toContain('trending-down');
  });

  it('awarded when rank declined vs 5 snapshots ago', () => {
    const users = [
      makeUser({ userId: 'u1', rank: 4, rankHistory: [2, 2, 3, 3, 4] }),
      makeUser({ userId: 'u2', rank: 2 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).toContain('trending-down');
  });

  it('not awarded when rank unchanged from 5 snapshots ago (flat trend)', () => {
    const users = [
      makeUser({ userId: 'u1', rank: 3, rankHistory: [3, 2, 4, 2, 3] }),
      makeUser({ userId: 'u2', rank: 2 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).not.toContain('trending-down');
  });

  it('not awarded when rank improved from 5 snapshots ago', () => {
    const users = [
      makeUser({ userId: 'u1', rank: 2, rankHistory: [5, 4, 3, 3, 2] }),
      makeUser({ userId: 'u2', rank: 3 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).not.toContain('trending-down');
  });
});

// ─── comeback-kid (🎢) ────────────────────────────────────────────────────────

describe('comeback-kid badge (🎢)', () => {
  it('suppressed when group has 3 or fewer members', () => {
    const users = [
      makeUser({ userId: 'u1', rank: 1, rankHistory: [3, 1] }),
      makeUser({ userId: 'u2', rank: 2 }),
      makeUser({ userId: 'u3', rank: 3 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).not.toContain('comeback-kid');
  });

  it('suppressed when fewer than 2 snapshots exist for user', () => {
    const users = [
      makeUser({ userId: 'u1', rank: 1, rankHistory: [4] }),
      makeUser({ userId: 'u2', rank: 2 }),
      makeUser({ userId: 'u3', rank: 3 }),
      makeUser({ userId: 'u4', rank: 4 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).not.toContain('comeback-kid');
  });

  it('awarded when user was last place in a past snapshot and is now top 3', () => {
    const users = [
      makeUser({ userId: 'u1', rank: 2, rankHistory: [4, 4, 2] }),
      makeUser({ userId: 'u2', rank: 1 }),
      makeUser({ userId: 'u3', rank: 3 }),
      makeUser({ userId: 'u4', rank: 4 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).toContain('comeback-kid');
  });

  it('not awarded when user is currently outside top 3 (rank > 3)', () => {
    const users = [
      makeUser({ userId: 'u1', rank: 4, rankHistory: [4, 4, 4] }),
      makeUser({ userId: 'u2', rank: 1 }),
      makeUser({ userId: 'u3', rank: 2 }),
      makeUser({ userId: 'u4', rank: 3 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).not.toContain('comeback-kid');
  });

  it('not awarded when user never had rank equal to group size in past snapshots', () => {
    const users = [
      makeUser({ userId: 'u1', rank: 2, rankHistory: [3, 3, 2] }),
      makeUser({ userId: 'u2', rank: 1 }),
      makeUser({ userId: 'u3', rank: 3 }),
      makeUser({ userId: 'u4', rank: 4 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).not.toContain('comeback-kid');
  });

  it('can be held simultaneously with on-fire (independent conditions)', () => {
    // User was last, now rank 1, with strictly decreasing last 3 snapshots
    const users = [
      makeUser({ userId: 'u1', rank: 1, rankHistory: [4, 3, 2, 1] }),
      makeUser({ userId: 'u2', rank: 2 }),
      makeUser({ userId: 'u3', rank: 3 }),
      makeUser({ userId: 'u4', rank: 4 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).toContain('comeback-kid');
    expect(badges).toContain('on-fire');
  });
});

// ─── calculateBadges with no rankHistory ─────────────────────────────────────

describe('calculateBadges with no rankHistory', () => {
  it('static badges are unaffected when all users have rankHistory undefined', () => {
    const users = [
      makeUser({ userId: 'u1', rank: 1 }), // no rankHistory
      makeUser({ userId: 'u2', rank: 2 }),
    ];
    const badges = getBadgeIds(users, defaultConfig, 'u1');
    expect(badges).toContain('crack');
    // No crash and time badges simply absent
    expect(badges).not.toContain('on-fire');
    expect(badges).not.toContain('ice-cold');
    expect(badges).not.toContain('trending-up');
    expect(badges).not.toContain('trending-down');
    expect(badges).not.toContain('comeback-kid');
  });

  it('time badges produce no recipients when tournamentStarted is false', () => {
    const notStartedConfig: TournamentBadgeConfig = { ...defaultConfig, tournamentStarted: false };
    const users = [
      makeUser({ userId: 'u1', rank: 2, rankHistory: [5, 4, 3, 2] }),
      makeUser({ userId: 'u2', rank: 3 }),
    ];
    const map = calculateBadges(users, notStartedConfig);
    const u1Badges = (map.get('u1') ?? []).map((b) => b.id);
    expect(u1Badges).toHaveLength(0);
  });
});
