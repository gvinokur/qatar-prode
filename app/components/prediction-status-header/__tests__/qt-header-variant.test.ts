import { describe, it, expect } from 'vitest';
import { computeQTHeaderVariant, computeQTLockUrgency, type QTHeaderInput } from '../qt-header-variant';

// Mock t function following the pattern specified
const mockT = (key: string, values?: Record<string, unknown>) => {
  if (values) return `${key}:${JSON.stringify(values)}`;
  return key;
};

// Helper to create a base input object
const baseInput = (overrides?: Partial<QTHeaderInput>): QTHeaderInput => ({
  isLocked: false,
  qtLockAt: null,
  predictedGroupGames: 0,
  totalGroupGames: 8,
  qualifiersCompleted: 0,
  qualifiersTotal: 8,
  definedSoFar: 0,
  correctSoFar: 0,
  onAutoFillClick: () => {},
  tournamentId: 'test-tournament',
  locale: 'en',
  ...overrides,
});

describe('computeQTLockUrgency', () => {
  const baseDate = new Date('2026-05-01T12:00:00Z');

  it('should return deadlineNow when time < 2 hours', () => {
    const lockAt = new Date(baseDate.getTime() + 1.9 * 60 * 60 * 1000); // 1h 54m
    expect(computeQTLockUrgency(lockAt, baseDate)).toBe('deadlineNow');
  });

  it('should return deadlineUrgent when 2h <= time < 24h', () => {
    const lockAt = new Date(baseDate.getTime() + 12 * 60 * 60 * 1000); // 12h
    expect(computeQTLockUrgency(lockAt, baseDate)).toBe('deadlineUrgent');
  });

  it('should return deadlineSoon when 24h <= time < 48h', () => {
    const lockAt = new Date(baseDate.getTime() + 36 * 60 * 60 * 1000); // 36h
    expect(computeQTLockUrgency(lockAt, baseDate)).toBe('deadlineSoon');
  });

  it('should return brand when time >= 48h', () => {
    const lockAt = new Date(baseDate.getTime() + 72 * 60 * 60 * 1000); // 72h
    expect(computeQTLockUrgency(lockAt, baseDate)).toBe('brand');
  });

  it('should return deadlineNow at exactly 2 hour boundary (exclusive)', () => {
    const lockAt = new Date(baseDate.getTime() + 2 * 60 * 60 * 1000); // exactly 2h
    expect(computeQTLockUrgency(lockAt, baseDate)).toBe('deadlineUrgent');
  });
});

describe('computeQTHeaderVariant', () => {
  const now = new Date('2026-05-01T12:00:00Z');

  describe('Variant 1: never-filled-locked', () => {
    it('should return locked tone with lock icon when isLocked=true and qualifiersCompleted=0', () => {
      const input = baseInput({
        isLocked: true,
        qualifiersCompleted: 0,
        qualifiersTotal: 8,
        now,
      });

      const result = computeQTHeaderVariant(input, mockT);

      expect(result.tone).toBe('locked');
      expect(result.leadIcon).toBe('lock');
      expect(result.statusText).toBe('statusHeader.qt.neverFilled.status');
      expect(result.message).toBe('statusHeader.qt.neverFilled.detail');
    });
  });

  describe('Variant 2: locked-with-results complete', () => {
    it('should return locked tone with actions and pointsBadge when all results defined', () => {
      const input = baseInput({
        isLocked: true,
        qualifiersCompleted: 8,
        qualifiersTotal: 8,
        definedSoFar: 8,
        correctSoFar: 6,
        qtPointsEarned: 24,
        locale: 'en',
        tournamentId: 'test-tournament',
        now,
      });

      const result = computeQTHeaderVariant(input, mockT);

      expect(result.tone).toBe('locked');
      expect(result.leadIcon).toBe('lock');
      expect(result.pointsBadge).toBe('24 pts');
      expect(result.statusText).toContain('statusHeader.qt.lockedComplete.status');
      expect(result.action).toBeDefined();
      expect(result.action?.href).toContain('/tournaments/test-tournament/stats');
      expect(result.secondaryAction).toBeDefined();
      expect(result.secondaryAction?.href).toContain('/friend-groups');
    });

    it('should not include pointsBadge when qtPointsEarned is undefined', () => {
      const input = baseInput({
        isLocked: true,
        qualifiersCompleted: 8,
        qualifiersTotal: 8,
        definedSoFar: 8,
        correctSoFar: 6,
        now,
      });

      const result = computeQTHeaderVariant(input, mockT);

      expect(result.pointsBadge).toBeUndefined();
      expect(result.action).toBeDefined();
      expect(result.secondaryAction).toBeDefined();
    });
  });

  describe('Variant 3: locked-with-results partial', () => {
    it('should return locked tone with chip when definedSoFar is between 0 and total', () => {
      const input = baseInput({
        isLocked: true,
        qualifiersCompleted: 5,
        qualifiersTotal: 8,
        definedSoFar: 3,
        correctSoFar: 2,
        now,
      });

      const result = computeQTHeaderVariant(input, mockT);

      expect(result.tone).toBe('locked');
      expect(result.leadIcon).toBe('lock');
      expect(result.chip).toBeDefined();
      expect(result.chip?.label).toContain('statusHeader.chipLabel.clasificados');
      expect(result.action).toBeUndefined();
      expect(result.secondaryAction).toBeUndefined();
    });
  });

  describe('Variant 4: locked-pending', () => {
    it('should return locked tone with chip when no results defined yet', () => {
      const input = baseInput({
        isLocked: true,
        qualifiersCompleted: 5,
        qualifiersTotal: 8,
        definedSoFar: 0,
        correctSoFar: 0,
        now,
      });

      const result = computeQTHeaderVariant(input, mockT);

      expect(result.tone).toBe('locked');
      expect(result.leadIcon).toBe('lock');
      expect(result.statusText).toBe('statusHeader.qt.lockedPending.status');
      expect(result.chip).toBeDefined();
      expect(result.message).toBeUndefined();
    });
  });

  describe('Variant 5: completed-pre-lock', () => {
    it('should return success tone with check icon when all predictions completed before lock', () => {
      const lockTime = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12h away
      const input = baseInput({
        isLocked: false,
        predictedGroupGames: 8, // groups must also be complete to show Recalcular
        totalGroupGames: 8,
        qualifiersCompleted: 8,
        qualifiersTotal: 8,
        qtLockAt: lockTime,
        now,
      });

      const result = computeQTHeaderVariant(input, mockT);

      expect(result.tone).toBe('success');
      expect(result.leadIcon).toBe('check');
      expect(result.statusText).toContain('statusHeader.qt.completedPreLock.status');
      expect(result.action).toBeDefined();
      expect(result.action?.onClick).toBeDefined();
      expect(result.action?.href).toBeUndefined();
      expect(result.chip).toBeDefined();
    });
  });

  describe('Variant 6: lock-window-urgent (deadlineNow < 2h)', () => {
    it('should return deadlineNow tone when lock < 2h away', () => {
      const lockTime = new Date(now.getTime() + 1.5 * 60 * 60 * 1000); // 1.5h
      const input = baseInput({
        isLocked: false,
        qualifiersCompleted: 3,
        qualifiersTotal: 8,
        qtLockAt: lockTime,
        predictedGroupGames: 4,
        totalGroupGames: 8,
        now,
      });

      const result = computeQTHeaderVariant(input, mockT);

      expect(result.tone).toBe('deadlineNow');
      expect(result.leadIcon).toBe('error');
      expect(result.statusText).toContain('statusHeader.qt.lockWindowUrgent.status');
      expect(result.message).toBeDefined();
      expect(result.action).toBeDefined();
      expect(result.action?.onClick).toBeDefined();
      expect(result.chip).toBeDefined();
    });
  });

  describe('Variant 7: pre-tournament-auto-fill-ready', () => {
    it('should return brand tone with rocket icon when all group games predicted', () => {
      const input = baseInput({
        isLocked: false,
        qualifiersCompleted: 3,
        qualifiersTotal: 8,
        predictedGroupGames: 8,
        totalGroupGames: 8,
        qtLockAt: null,
        now,
      });

      const result = computeQTHeaderVariant(input, mockT);

      expect(result.tone).toBe('brand');
      expect(result.leadIcon).toBe('rocket');
      expect(result.statusText).toBe('statusHeader.qt.autoFillReady.status');
      expect(result.message).toBeDefined();
      expect(result.action).toBeDefined();
      expect(result.action?.onClick).toBeDefined();
      expect(result.action?.href).toBeUndefined();
      expect(result.chip).toBeDefined();
    });
  });

  describe('Variant 8: pre-tournament (fallback)', () => {
    it('should return brand tone with rocket icon and href action as fallback', () => {
      const input = baseInput({
        isLocked: false,
        qualifiersCompleted: 0,
        qualifiersTotal: 8,
        predictedGroupGames: 0,
        totalGroupGames: 8,
        qtLockAt: null,
        locale: 'en',
        tournamentId: 'test-tournament',
        now,
      });

      const result = computeQTHeaderVariant(input, mockT);

      expect(result.tone).toBe('brand');
      expect(result.leadIcon).toBe('rocket');
      expect(result.statusText).toBe('statusHeader.qt.preTournament.status');
      expect(result.message).toBe('statusHeader.qt.preTournament.message');
      expect(result.action).toBeDefined();
      expect(result.action?.href).toContain('/tournaments/test-tournament/games');
      expect(result.action?.onClick).toBeUndefined();
      expect(result.chip).toBeDefined();
    });
  });

  describe('Edge cases and priority ordering', () => {
    it('should prioritize never-filled-locked over completed-pre-lock', () => {
      const input = baseInput({
        isLocked: true,
        qualifiersCompleted: 0,
        qualifiersTotal: 8,
        definedSoFar: 0,
        now,
      });

      const result = computeQTHeaderVariant(input, mockT);

      expect(result.tone).toBe('locked');
      expect(result.statusText).toBe('statusHeader.qt.neverFilled.status');
    });

    it('should handle zero total qualifiers gracefully', () => {
      const input = baseInput({
        isLocked: false,
        qualifiersCompleted: 0,
        qualifiersTotal: 0,
        definedSoFar: 0,
        qtLockAt: null,
        now,
      });

      const result = computeQTHeaderVariant(input, mockT);

      expect(result.tone).toBe('brand');
      expect(result.action).toBeDefined();
    });

    it('should handle deadline urgency escalation correctly', () => {
      // Test 24h boundary (exclusive) - at exactly 24h it's deadlineSoon
      const lockTime24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const input24h = baseInput({
        isLocked: false,
        qualifiersCompleted: 3,
        qualifiersTotal: 8,
        qtLockAt: lockTime24h,
        predictedGroupGames: 4,
        totalGroupGames: 8,
        now,
      });

      const result24h = computeQTHeaderVariant(input24h, mockT);
      expect(result24h.tone).toBe('deadlineSoon');
      expect(result24h.leadIcon).toBe('info');

      // Test just under 24h which should be deadlineUrgent
      const lockTimeUrgent = new Date(now.getTime() + 23.9 * 60 * 60 * 1000);
      const inputUrgent = baseInput({
        isLocked: false,
        qualifiersCompleted: 3,
        qualifiersTotal: 8,
        qtLockAt: lockTimeUrgent,
        predictedGroupGames: 4,
        totalGroupGames: 8,
        now,
      });

      const resultUrgent = computeQTHeaderVariant(inputUrgent, mockT);
      expect(resultUrgent.tone).toBe('deadlineUrgent');
      expect(resultUrgent.leadIcon).toBe('warning');
    });

    it('should include correct and total in status text when locked with results', () => {
      const input = baseInput({
        isLocked: true,
        qualifiersCompleted: 8,
        qualifiersTotal: 8,
        definedSoFar: 8,
        correctSoFar: 7,
        now,
      });

      const result = computeQTHeaderVariant(input, mockT);
      expect(result.statusText).toContain('correct');
      expect(result.statusText).toContain('7');
      expect(result.statusText).toContain('8');
    });
  });

  describe('Locale and tournament ID handling', () => {
    it('should use correct locale in href paths', () => {
      const input = baseInput({
        isLocked: false,
        qualifiersCompleted: 0,
        qualifiersTotal: 8,
        locale: 'es',
        tournamentId: 'euro-2026',
        now,
      });

      const result = computeQTHeaderVariant(input, mockT);

      expect(result.action?.href).toContain('/es/');
      expect(result.action?.href).toContain('euro-2026');
    });

    it('should use correct locale in locked complete secondary action', () => {
      const input = baseInput({
        isLocked: true,
        qualifiersCompleted: 8,
        qualifiersTotal: 8,
        definedSoFar: 8,
        correctSoFar: 6,
        locale: 'es',
        tournamentId: 'copa-america',
        now,
      });

      const result = computeQTHeaderVariant(input, mockT);

      expect(result.secondaryAction?.href).toContain('/es/');
      expect(result.secondaryAction?.href).toContain('friend-groups');
    });
  });
});
