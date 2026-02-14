import { describe, it, expect, beforeEach, vi } from 'vitest';

// Stub VAPID key before any imports to prevent web-push initialization errors
vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'test-vapid-public-key');

import { generateMetadata } from './layout';

describe('generateMetadata', () => {
  beforeEach(() => {
    // Clear env mocks before each test (except VAPID key which is needed globally)
    vi.unstubAllEnvs();
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'test-vapid-public-key');
  });

  it('uses environment variables when set', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_NAME', 'Test App');
    vi.stubEnv('NEXT_PUBLIC_APP_DESCRIPTION', 'Test Description');

    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Test App');
    expect(metadata.description).toBe('Test Description');
    expect(metadata.appleWebApp?.title).toBe('Test App');
  });

  it('uses fallback values when env vars are missing', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Prode Mundial');
    expect(metadata.description).toBe('Plataforma de pronósticos deportivos');
    expect(metadata.appleWebApp?.title).toBe('Prode Mundial');
  });

  it('includes manifest and icons', async () => {
    const metadata = await generateMetadata();

    expect(metadata.manifest).toBe('/manifest.json');
    expect(metadata.icons).toBeDefined();
    expect(Array.isArray(metadata.icons)).toBe(true);
    expect(metadata.icons?.length).toBeGreaterThan(0);
  });

  it('includes appleWebApp configuration', async () => {
    const metadata = await generateMetadata();

    expect(metadata.appleWebApp).toBeDefined();
    expect(metadata.appleWebApp?.capable).toBe(true);
    expect(metadata.appleWebApp?.statusBarStyle).toBe('default');
  });
});
