import { describe, it, expect, afterEach, vi } from 'vitest';

describe('environment-utils', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_HUB_ENABLED;
    vi.resetModules();
  });

  describe('isHubEnabled', () => {
    it('returns true when NEXT_PUBLIC_HUB_ENABLED is "true"', async () => {
      process.env.NEXT_PUBLIC_HUB_ENABLED = 'true';
      const { isHubEnabled } = await import('../environment-utils');
      expect(isHubEnabled()).toBe(true);
    });

    it('returns false when NEXT_PUBLIC_HUB_ENABLED is "false"', async () => {
      process.env.NEXT_PUBLIC_HUB_ENABLED = 'false';
      const { isHubEnabled } = await import('../environment-utils');
      expect(isHubEnabled()).toBe(false);
    });

    it('returns false when NEXT_PUBLIC_HUB_ENABLED is undefined', async () => {
      delete process.env.NEXT_PUBLIC_HUB_ENABLED;
      const { isHubEnabled } = await import('../environment-utils');
      expect(isHubEnabled()).toBe(false);
    });
  });
});
