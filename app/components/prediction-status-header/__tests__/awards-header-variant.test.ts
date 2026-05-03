import { describe, it, expect } from 'vitest';
import { computeAwardsHeaderVariant, computeAwardsActionLabel, type AwardsHeaderInput } from '../awards-header-variant';

// Mock t function following the pattern specified
const mockT = (key: string, values?: Record<string, unknown>) => {
  if (values) return `${key}:${JSON.stringify(values)}`;
  return key;
};

// Helper to create a base input object
const baseInput = (overrides?: Partial<AwardsHeaderInput>): AwardsHeaderInput => ({
  isLocked: false,
  awardsLockAt: null,
  awardsCompleted: 0,
  awardsTotal: 5,
  decidedSoFar: 0,
  correctSoFar: 0,
  onFocusNextAward: () => {},
  tournamentId: 'test-tournament',
  locale: 'en',
  ...overrides,
});

describe('computeAwardsActionLabel', () => {
  it('should return ctaStart when awardsCompleted is 0', () => {
    const result = computeAwardsActionLabel(0, 5, mockT);
    expect(result).toBe('statusHeader.awards.preTournament.ctaStart');
  });

  it('should return ctaFinish when awardsCompleted is at N-1 (one before total)', () => {
    const result = computeAwardsActionLabel(4, 5, mockT);
    expect(result).toBe('statusHeader.awards.preTournament.ctaFinish');
  });

  it('should return ctaFinish when awardsCompleted equals awardsTotal', () => {
    const result = computeAwardsActionLabel(5, 5, mockT);
    expect(result).toBe('statusHeader.awards.preTournament.ctaFinish');
  });

  it('should return ctaContinue for mid-progress (1 to N-2)', () => {
    const result = computeAwardsActionLabel(2, 5, mockT);
    expect(result).toBe('statusHeader.awards.preTournament.ctaContinue');
  });

  it('should return ctaContinue when 1 award is completed out of many', () => {
    const result = computeAwardsActionLabel(1, 10, mockT);
    expect(result).toBe('statusHeader.awards.preTournament.ctaContinue');
  });

  it('should handle single award completion correctly', () => {
    const result = computeAwardsActionLabel(1, 2, mockT);
    expect(result).toBe('statusHeader.awards.preTournament.ctaFinish');
  });
});

describe('computeAwardsHeaderVariant', () => {
  const now = new Date('2026-05-01T12:00:00Z');

  describe('Variant 1: never-filled-locked', () => {
    it('should return locked tone with lock icon when isLocked=true and awardsCompleted=0', () => {
      const input = baseInput({
        isLocked: true,
        awardsCompleted: 0,
        awardsTotal: 5,
        now,
      });

      const result = computeAwardsHeaderVariant(input, mockT);

      expect(result.tone).toBe('locked');
      expect(result.leadIcon).toBe('lock');
      expect(result.statusText).toBe('statusHeader.awards.neverFilled.status');
      expect(result.message).toBe('statusHeader.awards.neverFilled.detail');
      expect(result.chip).toBeUndefined();
    });
  });

  describe('Variant 2: locked-with-results complete', () => {
    it('should return locked tone with actions and pointsBadge when all results decided', () => {
      const input = baseInput({
        isLocked: true,
        awardsCompleted: 5,
        awardsTotal: 5,
        decidedSoFar: 5,
        correctSoFar: 3,
        awardsPointsEarned: 15,
        locale: 'en',
        tournamentId: 'test-tournament',
        now,
      });

      const result = computeAwardsHeaderVariant(input, mockT);

      expect(result.tone).toBe('locked');
      expect(result.leadIcon).toBe('lock');
      expect(result.pointsBadge).toBe('15 pts');
      expect(result.statusText).toContain('statusHeader.awards.lockedComplete.status');
      expect(result.message).toBe('statusHeader.awards.lockedComplete.message');
      expect(result.action).toBeDefined();
      expect(result.action?.href).toContain('/tournaments/test-tournament/stats');
      expect(result.secondaryAction).toBeDefined();
      expect(result.secondaryAction?.href).toContain('/friend-groups');
    });

    it('should not include pointsBadge when awardsPointsEarned is undefined', () => {
      const input = baseInput({
        isLocked: true,
        awardsCompleted: 5,
        awardsTotal: 5,
        decidedSoFar: 5,
        correctSoFar: 2,
        now,
      });

      const result = computeAwardsHeaderVariant(input, mockT);

      expect(result.pointsBadge).toBeUndefined();
      expect(result.action).toBeDefined();
      expect(result.secondaryAction).toBeDefined();
    });
  });

  describe('Variant 3: locked-partial', () => {
    it('should return locked tone with chip when decidedSoFar is between 0 and total', () => {
      const input = baseInput({
        isLocked: true,
        awardsCompleted: 3,
        awardsTotal: 5,
        decidedSoFar: 2,
        correctSoFar: 1,
        now,
      });

      const result = computeAwardsHeaderVariant(input, mockT);

      expect(result.tone).toBe('locked');
      expect(result.leadIcon).toBe('lock');
      expect(result.statusText).toContain('statusHeader.awards.lockedPartial.status');
      expect(result.chip).toBeDefined();
      expect(result.chip?.label).toContain('statusHeader.chipLabel.premios');
      expect(result.action).toBeUndefined();
      expect(result.secondaryAction).toBeUndefined();
    });
  });

  describe('Variant 4: locked-pending', () => {
    it('should return locked tone with chip when no results decided yet', () => {
      const input = baseInput({
        isLocked: true,
        awardsCompleted: 3,
        awardsTotal: 5,
        decidedSoFar: 0,
        correctSoFar: 0,
        now,
      });

      const result = computeAwardsHeaderVariant(input, mockT);

      expect(result.tone).toBe('locked');
      expect(result.leadIcon).toBe('lock');
      expect(result.statusText).toBe('statusHeader.awards.lockedPending.status');
      expect(result.chip).toBeDefined();
      expect(result.action).toBeUndefined();
    });
  });

  describe('Variant 5: completed-pre-lock', () => {
    it('should return success tone with check icon when all awards completed before lock', () => {
      const lockTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h away
      const input = baseInput({
        isLocked: false,
        awardsCompleted: 5,
        awardsTotal: 5,
        awardsLockAt: lockTime,
        now,
      });

      const result = computeAwardsHeaderVariant(input, mockT);

      expect(result.tone).toBe('success');
      expect(result.leadIcon).toBe('check');
      expect(result.statusText).toContain('statusHeader.awards.completedPreLock.status');
      expect(result.chip).toBeDefined();
      expect(result.action).toBeUndefined();
    });
  });

  describe('Variant 6: pre-tournament with urgency escalation', () => {
    it('should return deadlineNow tone when lock < 2h away', () => {
      const lockTime = new Date(now.getTime() + 1.5 * 60 * 60 * 1000); // 1.5h
      const input = baseInput({
        isLocked: false,
        awardsCompleted: 2,
        awardsTotal: 5,
        awardsLockAt: lockTime,
        now,
      });

      const result = computeAwardsHeaderVariant(input, mockT);

      expect(result.tone).toBe('deadlineNow');
      expect(result.leadIcon).toBe('error');
      expect(result.statusText).toContain('statusHeader.awards.preTournament.status');
      expect(result.message).toBe('statusHeader.awards.preTournament.message');
      expect(result.chip).toBeDefined();
      expect(result.action).toBeDefined();
    });

    it('should return deadlineUrgent tone when 2h <= lock < 24h', () => {
      const lockTime = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12h
      const input = baseInput({
        isLocked: false,
        awardsCompleted: 1,
        awardsTotal: 5,
        awardsLockAt: lockTime,
        now,
      });

      const result = computeAwardsHeaderVariant(input, mockT);

      expect(result.tone).toBe('deadlineUrgent');
      expect(result.leadIcon).toBe('warning');
      expect(result.action?.label).toBe('statusHeader.awards.preTournament.ctaContinue');
    });

    it('should return deadlineSoon tone when 24h <= lock < 48h', () => {
      const lockTime = new Date(now.getTime() + 36 * 60 * 60 * 1000); // 36h
      const input = baseInput({
        isLocked: false,
        awardsCompleted: 0,
        awardsTotal: 5,
        awardsLockAt: lockTime,
        now,
      });

      const result = computeAwardsHeaderVariant(input, mockT);

      expect(result.tone).toBe('deadlineSoon');
      expect(result.leadIcon).toBe('info');
    });

    it('should return brand tone when lock >= 48h away', () => {
      const lockTime = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72h
      const input = baseInput({
        isLocked: false,
        awardsCompleted: 2,
        awardsTotal: 5,
        awardsLockAt: lockTime,
        now,
      });

      const result = computeAwardsHeaderVariant(input, mockT);

      expect(result.tone).toBe('brand');
      expect(result.leadIcon).toBe('rocket');
    });
  });

  describe('Action label integration in pre-tournament variant', () => {
    it('should use ctaStart label when awardsCompleted is 0', () => {
      const input = baseInput({
        isLocked: false,
        awardsCompleted: 0,
        awardsTotal: 5,
        awardsLockAt: null,
        now,
      });

      const result = computeAwardsHeaderVariant(input, mockT);

      expect(result.action?.label).toBe('statusHeader.awards.preTournament.ctaStart');
    });

    it('should use ctaFinish label when awardsCompleted is at N-1', () => {
      const input = baseInput({
        isLocked: false,
        awardsCompleted: 4,
        awardsTotal: 5,
        awardsLockAt: null,
        now,
      });

      const result = computeAwardsHeaderVariant(input, mockT);

      expect(result.action?.label).toBe('statusHeader.awards.preTournament.ctaFinish');
    });

    it('should use ctaContinue label for mid-progress', () => {
      const input = baseInput({
        isLocked: false,
        awardsCompleted: 2,
        awardsTotal: 5,
        awardsLockAt: null,
        now,
      });

      const result = computeAwardsHeaderVariant(input, mockT);

      expect(result.action?.label).toBe('statusHeader.awards.preTournament.ctaContinue');
    });
  });

  describe('Edge cases and priority ordering', () => {
    it('should prioritize never-filled-locked over pre-tournament', () => {
      const input = baseInput({
        isLocked: true,
        awardsCompleted: 0,
        awardsTotal: 5,
        decidedSoFar: 0,
        awardsLockAt: new Date(now.getTime() + 1 * 60 * 60 * 1000),
        now,
      });

      const result = computeAwardsHeaderVariant(input, mockT);

      expect(result.tone).toBe('locked');
      expect(result.statusText).toBe('statusHeader.awards.neverFilled.status');
    });

    it('should prioritize completed-pre-lock over pre-tournament urgency', () => {
      const input = baseInput({
        isLocked: false,
        awardsCompleted: 5,
        awardsTotal: 5,
        awardsLockAt: new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1h, would be deadlineNow
        now,
      });

      const result = computeAwardsHeaderVariant(input, mockT);

      expect(result.tone).toBe('success');
      expect(result.leadIcon).toBe('check');
    });

    it('should handle zero total awards gracefully', () => {
      const input = baseInput({
        isLocked: false,
        awardsCompleted: 0,
        awardsTotal: 0,
        decidedSoFar: 0,
        awardsLockAt: null,
        now,
      });

      const result = computeAwardsHeaderVariant(input, mockT);

      expect(result.tone).toBe('brand');
      expect(result.leadIcon).toBe('rocket');
      expect(result.action).toBeDefined();
    });

    it('should include correct and total in status text when locked with results', () => {
      const input = baseInput({
        isLocked: true,
        awardsCompleted: 5,
        awardsTotal: 5,
        decidedSoFar: 5,
        correctSoFar: 4,
        now,
      });

      const result = computeAwardsHeaderVariant(input, mockT);

      expect(result.statusText).toContain('correct');
      expect(result.statusText).toContain('4');
      expect(result.statusText).toContain('5');
    });
  });

  describe('Locale and tournament ID handling', () => {
    it('should use onClick action for pre-tournament CTA (scroll within page)', () => {
      const onFocusNextAward = () => {};
      const input = baseInput({
        isLocked: false,
        awardsCompleted: 1,
        awardsTotal: 5,
        awardsLockAt: null,
        locale: 'es',
        tournamentId: 'copa-america',
        onFocusNextAward,
        now,
      });

      const result = computeAwardsHeaderVariant(input, mockT);

      expect(result.action?.onClick).toBe(onFocusNextAward);
      expect(result.action?.href).toBeUndefined();
    });

    it('should use correct locale in locked complete secondary action', () => {
      const input = baseInput({
        isLocked: true,
        awardsCompleted: 5,
        awardsTotal: 5,
        decidedSoFar: 5,
        correctSoFar: 4,
        locale: 'es',
        tournamentId: 'euro-2026',
        now,
      });

      const result = computeAwardsHeaderVariant(input, mockT);

      expect(result.secondaryAction?.href).toContain('/es/');
      expect(result.secondaryAction?.href).toContain('friend-groups');
    });
  });

  describe('Countdown label in status text', () => {
    it('should include countdown in pre-tournament status text', () => {
      const lockTime = new Date(now.getTime() + 36 * 60 * 60 * 1000); // 36h
      const input = baseInput({
        isLocked: false,
        awardsCompleted: 2,
        awardsTotal: 5,
        awardsLockAt: lockTime,
        now,
      });

      const result = computeAwardsHeaderVariant(input, mockT);

      expect(result.statusText).toContain('statusHeader.awards.preTournament.status');
      // The countdown should be in the statusText parameter
      expect(result.statusText).toContain('countdown');
    });

    it('should include countdown in completed-pre-lock status text', () => {
      const lockTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h
      const input = baseInput({
        isLocked: false,
        awardsCompleted: 5,
        awardsTotal: 5,
        awardsLockAt: lockTime,
        now,
      });

      const result = computeAwardsHeaderVariant(input, mockT);

      expect(result.statusText).toContain('statusHeader.awards.completedPreLock.status');
    });
  });
});
