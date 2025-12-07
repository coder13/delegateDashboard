import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLocalStorage, localStorageKey, setLocalStorage } from './localStorage';

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

    expect(localStorageKey('token')).toContain('delegate-dashboard.example-application-id.token');
  });

  it('sets and retrieves data consistently', async () => {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: '?staging=true' },
      writable: true,
    });
    await import('./wca-env');

    setLocalStorage('token', 'abc123');
    expect(getLocalStorage('token')).toBe('abc123');
  });
});
