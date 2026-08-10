import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  localStorage.clear();
  vi.resetModules();
});

describe('localStorage helpers', () => {
  it('prefixes keys with the OAuth client id', async () => {
    // Ensure staging values are used for deterministic keys
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: '?staging=true' },
      writable: true,
    });
    await import('./wca-env');
    const { localStorageKey } = await import('./localStorage');

    expect(localStorageKey('token')).toContain('delegate-dashboard.example-application-id.token');
  });

  it('sets and retrieves data consistently', async () => {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: '?staging=true' },
      writable: true,
    });
    await import('./wca-env');
    const { getLocalStorage, setLocalStorage } = await import('./localStorage');

    setLocalStorage('token', 'abc123');
    expect(getLocalStorage('token')).toBe('abc123');
  });
});
