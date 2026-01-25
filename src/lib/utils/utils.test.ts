import { describe, expect, it, vi } from 'vitest';

vi.mock('@wca/helpers', async () => {
  const actual = await vi.importActual<typeof import('@wca/helpers')>('@wca/helpers');
  return {
    ...actual,
    formatCentiseconds: vi.fn(() => 'formatted'),
  };
});

import {
  byName,
  mapIn,
  pluralize,
  pluralizeWord,
  renderResultByEventId,
  setIn,
  shortTime,
  updateIn,
} from './utils';
import { formatCentiseconds } from '@wca/helpers';

describe('utils helpers', () => {
  it('updateIn replaces a property immutably', () => {
    const original = { count: 1, label: 'A' };
    const updated = updateIn(original, 'count', (value) => value + 1);

    expect(updated).toEqual({ count: 2, label: 'A' });
    expect(updated).not.toBe(original);
  });

  it('setIn replaces a property with a fixed value', () => {
    const original = { count: 1 };
    const updated = setIn(original, 'count', 10);

    expect(updated.count).toBe(10);
    expect(updated).not.toBe(original);
  });

  it('mapIn maps arrays and keeps non-arrays unchanged', () => {
    const original = { items: [1, 2, 3], label: 'ok' };
    const mapped = mapIn(original, 'items', (value) => value * 2);

    expect(mapped.items).toEqual([2, 4, 6]);
    expect(mapped).not.toBe(original);

    const notArray = mapIn({ value: 'nope' }, 'value', () => 'ignored');
    expect(notArray.value).toBe('nope');
  });

  it('pluralize returns singular or plural forms with counts', () => {
    expect(pluralize(1, 'item')).toBe('1 item');
    expect(pluralize(2, 'item')).toBe('2 items');
    expect(pluralize(2, 'item', 'items!')).toBe('2 items!');
  });

  it('pluralizeWord returns singular or plural forms without counts', () => {
    expect(pluralizeWord(1, 'match')).toBe('match');
    expect(pluralizeWord(2, 'match')).toBe('matchs');
    expect(pluralizeWord(2, 'match', 'matchers')).toBe('matchers');
  });

  it('shortTime formats a time using the provided time zone', () => {
    const spy = vi.spyOn(Date.prototype, 'toLocaleTimeString');
    spy.mockReturnValue('10:00 AM');

    expect(shortTime('2024-01-01T10:00:00Z', 'America/Los_Angeles')).toBe('10:00 AM');
    expect(spy).toHaveBeenCalledWith('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      minute: 'numeric',
    });
  });

  it('byName sorts by the name property', () => {
    const items = [{ name: 'Beta' }, { name: 'Alpha' }];
    const sorted = [...items].sort(byName);

    expect(sorted[0].name).toBe('Alpha');
  });

  it('renders 333fm averages with two decimals', () => {
    expect(renderResultByEventId('333fm', 'average', 1234)).toBe('12.34');
  });

  it('renders 333fm singles without formatting', () => {
    expect(renderResultByEventId('333fm', 'single', 34)).toBe(34);
  });

  it('delegates to formatCentiseconds for other events', () => {
    expect(renderResultByEventId('333', 'single', 1200)).toBe('formatted');
    expect(formatCentiseconds).toHaveBeenCalledWith(1200);
  });
});
