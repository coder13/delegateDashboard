import { afterEach, describe, expect, it, vi } from 'vitest';

const setLocationSearch = (search: string) => {
  Object.defineProperty(window, 'location', {
    value: { ...window.location, search },
    writable: true,
  });
};

afterEach(() => {
  vi.resetModules();
});

describe('wca env helpers', () => {
  it('prefers staging configuration when staging query is present', async () => {
    setLocationSearch('?staging=true');
    const env = await import('./wca-env');

    expect(env.STAGING_QUERY_PARAMS).toBe(true);
    expect(env.WCA_ORIGIN).toBe('https://staging.worldcubeassociation.org');
    expect(env.WCA_OAUTH_CLIENT_ID).toBe('example-application-id');
  });

  it('falls back to environment variables when staging is absent', async () => {
    process.env.VITE_WCA_ORIGIN = 'https://prod.example';
    process.env.VITE_WCA_OAUTH_CLIENT_ID = 'prod-client';
    setLocationSearch('');

    const env = await import('./wca-env');

    expect(env.STAGING_QUERY_PARAMS).toBe(false);
    expect(env.WCA_ORIGIN).toBe('https://prod.example');
    expect(env.WCA_OAUTH_CLIENT_ID).toBe('prod-client');
  });
});
