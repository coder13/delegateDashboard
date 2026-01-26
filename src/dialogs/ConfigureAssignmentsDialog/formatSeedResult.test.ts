import { formatSeedResult } from './formatSeedResult';
import { encodeMultiResult } from '@wca/helpers';
import { describe, expect, it } from 'vitest';

describe('formatSeedResult', () => {
  it('formats multiblind results', () => {
    const result = encodeMultiResult({ solved: 10, attempted: 12, centiseconds: 6000 });

    expect(formatSeedResult('333mbf', 'single', result)).toBe('10/12 1:00');
  });

  it('formats multiblind DNF', () => {
    expect(formatSeedResult('333mbf', 'average', -1)).toBe('DNF');
  });

  it('formats fewest moves based on ranking type', () => {
    expect(formatSeedResult('333fm', 'average', 334)).toBe('3.34');
    expect(formatSeedResult('333fm', 'single', 40)).toBe('40');
  });

  it('formats standard events in centiseconds', () => {
    expect(formatSeedResult('333', 'average', 1234)).toBe('12.34');
  });

  it('returns undefined for empty or invalid results', () => {
    expect(formatSeedResult('333', 'single', undefined)).toBe('-');
    expect(formatSeedResult('333', 'single', NaN as number)).toBe('-');
  });
});
