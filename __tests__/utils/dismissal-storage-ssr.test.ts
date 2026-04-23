// @vitest-environment node
// Tests for SSR behavior where window is genuinely undefined (Node environment)
import { describe, it, expect } from 'vitest';
import { getDismissalState, setDismissalState } from '../../app/utils/dismissal-storage';

describe('dismissal-storage SSR (Node environment)', () => {
  it('getDismissalState returns false when window is undefined', () => {
    expect(getDismissalState('test-key')).toBe(false);
  });

  it('setDismissalState does nothing when window is undefined', () => {
    expect(() => setDismissalState('test-key', true)).not.toThrow();
  });
});
