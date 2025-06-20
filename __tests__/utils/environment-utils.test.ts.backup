import { isDevelopmentMode } from '../../app/utils/environment-utils';

describe('environment-utils', () => {
  describe('isDevelopmentMode', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true
      });
    });

    it('should return true when NODE_ENV is development', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      });
      expect(isDevelopmentMode()).toBe(true);
    });

    it('should return false when NODE_ENV is production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true
      });
      expect(isDevelopmentMode()).toBe(false);
    });

    it('should return false when NODE_ENV is test', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        writable: true,
        configurable: true
      });
      expect(isDevelopmentMode()).toBe(false);
    });

    it('should return false when NODE_ENV is undefined', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: undefined,
        writable: true,
        configurable: true
      });
      expect(isDevelopmentMode()).toBe(false);
    });

    it('should return false when NODE_ENV is empty string', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: '',
        writable: true,
        configurable: true
      });
      expect(isDevelopmentMode()).toBe(false);
    });

    it('should return false when NODE_ENV is any other value', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'staging',
        writable: true,
        configurable: true
      });
      expect(isDevelopmentMode()).toBe(false);
    });
  });
}); 