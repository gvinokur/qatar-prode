import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isDevelopmentMode } from '../../app/utils/environment-utils';

describe('environment-utils', () => {
  describe('isDevelopmentMode', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('should return true when NODE_ENV is development', () => {
      vi.stubEnv('NODE_ENV', 'development');
      expect(isDevelopmentMode()).toBe(true);
    });

    it('should return false when NODE_ENV is production', () => {
      vi.stubEnv('NODE_ENV', 'production');
      expect(isDevelopmentMode()).toBe(false);
    });

    it('should return false when NODE_ENV is test', () => {
      vi.stubEnv('NODE_ENV', 'test');
      expect(isDevelopmentMode()).toBe(false);
    });

    it('should return false when NODE_ENV is undefined', () => {
      vi.stubEnv('NODE_ENV', undefined);
      expect(isDevelopmentMode()).toBe(false);
    });

    it('should return false when NODE_ENV is empty string', () => {
      vi.stubEnv('NODE_ENV', '');
      expect(isDevelopmentMode()).toBe(false);
    });

    it('should return false when NODE_ENV is any other value', () => {
      vi.stubEnv('NODE_ENV', 'staging');
      expect(isDevelopmentMode()).toBe(false);
    });
  });
}); 