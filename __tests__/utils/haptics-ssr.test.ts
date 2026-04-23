// @vitest-environment node
// Tests for SSR behavior where window is genuinely undefined (Node environment)
import { describe, it, expect } from 'vitest';
import { triggerRankUpHaptic, isHapticSupported } from '../../app/utils/haptics';

describe('haptics SSR (Node environment)', () => {
  it('triggerRankUpHaptic does not throw when window is undefined', () => {
    expect(() => triggerRankUpHaptic()).not.toThrow();
  });

  it('isHapticSupported returns false when window is undefined', () => {
    expect(isHapticSupported()).toBe(false);
  });
});
