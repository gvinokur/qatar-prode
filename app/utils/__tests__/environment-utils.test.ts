import { describe, it, expect, vi } from 'vitest';

describe('environment-utils', () => {
  describe('isDevelopmentMode', () => {
    it('returns true when NODE_ENV is "development"', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const { isDevelopmentMode } = await import('../environment-utils');
      expect(isDevelopmentMode()).toBe(true);
      vi.unstubAllEnvs();
    });
  });
});
