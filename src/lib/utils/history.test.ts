import { describe, expect, it } from 'vitest';
import { createLocationObject, preserveQueryParams } from './history';

describe('history utilities', () => {
  it('preserves the staging query parameter when present', () => {
    const history = { location: { search: 'staging=true' } } as any;
    const updated = preserveQueryParams(history, { pathname: '/dashboard', search: '' });

    expect(updated.search).toBe('staging=true');
  });

  it('does not alter search params when staging is absent', () => {
    const history = { location: { search: '' } } as any;
    const updated = preserveQueryParams(history, { pathname: '/dashboard', search: 'foo=bar' });

    expect(updated.search).toBe('foo=bar');
  });

  it('creates a location object from a path string', () => {
    const location = createLocationObject('/profile', { from: 'home' });

    expect(location).toEqual({ pathname: '/profile', state: { from: 'home' } });
  });

  it('returns location objects unchanged', () => {
    const existingLocation = { pathname: '/profile', search: '?q=1', state: { from: 'home' } };

    expect(createLocationObject(existingLocation)).toBe(existingLocation);
  });
});
