import { describe, it, expect } from 'vitest';
import robots from '../robots';

describe('robots', () => {
  it('returns a rule for all user agents', () => {
    const result = robots();
    expect(result.rules).toMatchObject({ userAgent: '*' });
  });

  it('allows all public content via allow "/"', () => {
    const result = robots();
    expect((result.rules as any).allow).toBe('/');
  });

  it('disallows all required admin and auth paths', () => {
    const result = robots();
    const disallow = (result.rules as any).disallow as string[];
    expect(disallow).toContain('/*/backoffice');
    expect(disallow).toContain('/*/delete-account');
    expect(disallow).toContain('/*/verify-email');
    expect(disallow).toContain('/*/reset-password');
    expect(disallow).toContain('/api/');
  });

  it('points sitemap to the correct URL', () => {
    const result = robots();
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/);
  });
});
