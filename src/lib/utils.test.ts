import {
  updateIn,
  setIn,
  mapIn,
  getIn,
  mergeIn,
  isPresentDeep,
  pluralize,
  pluralizeWord,
  scaleToOne,
  firstResult,
  flatMap,
  flatten,
  groupBy,
  zip,
  findLast,
  intersection,
  difference,
  partition,
  sortBy,
  sortByArray,
  chunk,
  times,
  uniq,
  pick,
  omit,
  inRange,
  addMilliseconds,
  isoTimeDiff,
  shortTime,
  sum,
  byName,
} from './utils';
import { describe, it, expect } from 'vitest';

describe('updateIn', () => {
  it('updates a top-level property', () => {
    const obj = { a: 1, b: 2 };
    const result = updateIn(obj, ['a'], (val) => val + 10);

    expect(result).toEqual({ a: 11, b: 2 });
    expect(obj).toEqual({ a: 1, b: 2 }); // Original unchanged
  });

  it('updates a nested property immutably', () => {
    const obj = { a: { b: { c: 1 } } };
    const result = updateIn(obj, ['a', 'b', 'c'], (val) => val + 1);

    expect(result.a.b.c).toBe(2);
    expect(obj.a.b.c).toBe(1); // Original unchanged
    expect(result).not.toBe(obj); // New reference
    expect(result.a).not.toBe(obj.a); // Nested references changed
  });

  it('handles deep nesting', () => {
    const obj = { a: { b: { c: { d: 'test' } } } };
    const result = updateIn(obj, ['a', 'b', 'c', 'd'], (val) => val.toUpperCase());

    expect(result.a.b.c.d).toBe('TEST');
  });
});

describe('setIn', () => {
  it('sets a nested value', () => {
    const obj = { a: { b: 1 } };
    const result = setIn(obj, ['a', 'b'], 42);

    expect(result.a.b).toBe(42);
    expect(obj.a.b).toBe(1); // Original unchanged
  });

  it('sets a top-level value', () => {
    const obj = { name: 'old' };
    const result = setIn(obj, ['name'], 'new');

    expect(result.name).toBe('new');
  });
});

describe('mapIn', () => {
  it('maps over a nested array', () => {
    const obj = { items: [1, 2, 3] };
    const result = mapIn(obj, ['items'], (x) => x * 2);

    expect(result.items).toEqual([2, 4, 6]);
    expect(obj.items).toEqual([1, 2, 3]); // Original unchanged
  });

  it('handles deeply nested arrays', () => {
    const obj = { a: { b: { list: ['a', 'b', 'c'] } } };
    const result = mapIn(obj, ['a', 'b', 'list'], (x) => x.toUpperCase());

    expect(result.a.b.list).toEqual(['A', 'B', 'C']);
  });

  it('handles null or undefined arrays', () => {
    const obj = { items: null };
    const result = mapIn(obj, ['items'], (x) => x * 2);

    expect(result.items).toBeNull();
  });
});

describe('getIn', () => {
  it('retrieves a nested value', () => {
    const obj = { a: { b: { c: 42 } } };
    expect(getIn(obj, ['a', 'b', 'c'])).toBe(42);
  });

  it('returns default value for missing path', () => {
    const obj = { a: { b: 1 } };
    expect(getIn(obj, ['a', 'x', 'y'], 'default')).toBe('default');
  });

  it('returns null as default when no default provided', () => {
    const obj = { a: 1 };
    expect(getIn(obj, ['missing'])).toBeNull();
  });

  it('handles null object gracefully', () => {
    expect(getIn(null, ['a', 'b'], 'fallback')).toBe('fallback');
  });

  it('distinguishes between missing and falsy values', () => {
    const obj = { a: 0, b: false, c: null };
    expect(getIn(obj, ['a'])).toBe(0);
    expect(getIn(obj, ['b'])).toBe(false);
    expect(getIn(obj, ['c'])).toBeNull();
  });
});

describe('mergeIn', () => {
  it('merges objects at a nested path', () => {
    const obj = { a: { x: 1, y: 2 } };
    const result = mergeIn(obj, ['a'], { y: 20, z: 30 });

    expect(result.a).toEqual({ x: 1, y: 20, z: 30 });
    expect(obj.a).toEqual({ x: 1, y: 2 }); // Original unchanged
  });
});

describe('isPresentDeep', () => {
  it('returns true for non-null primitives', () => {
    expect(isPresentDeep(5)).toBe(true);
    expect(isPresentDeep('test')).toBe(true);
    expect(isPresentDeep(false)).toBe(true);
  });

  it('returns false for null or undefined', () => {
    expect(isPresentDeep(null)).toBe(false);
    expect(isPresentDeep(undefined)).toBe(false);
  });

  it('returns true for objects with all present values', () => {
    expect(isPresentDeep({ a: 1, b: 'test' })).toBe(true);
  });

  it('returns false for objects with any null values', () => {
    expect(isPresentDeep({ a: 1, b: null })).toBe(false);
  });

  it('checks nested objects deeply', () => {
    expect(isPresentDeep({ a: { b: { c: 1 } } })).toBe(true);
    expect(isPresentDeep({ a: { b: { c: null } } })).toBe(false);
  });
});

describe('pluralize', () => {
  it('uses singular form for count of 1', () => {
    expect(pluralize(1, 'item')).toBe('1 item');
  });

  it('uses default plural form for count !== 1', () => {
    expect(pluralize(0, 'item')).toBe('0 items');
    expect(pluralize(2, 'item')).toBe('2 items');
  });

  it('uses custom plural form when provided', () => {
    expect(pluralize(2, 'person', 'people')).toBe('2 people');
  });
});

describe('pluralizeWord', () => {
  it('returns singular form for count of 1', () => {
    expect(pluralizeWord(1, 'item')).toBe('item');
  });

  it('returns default plural form for count !== 1', () => {
    expect(pluralizeWord(0, 'item')).toBe('items');
    expect(pluralizeWord(2, 'item')).toBe('items');
  });

  it('uses custom plural form when provided', () => {
    expect(pluralizeWord(2, 'person', 'people')).toBe('people');
  });
});

describe('scaleToOne', () => {
  it('scales array elements to sum to 1', () => {
    const result = scaleToOne([1, 2, 3]);
    expect(sum(result)).toBeCloseTo(1);
    expect(result).toEqual([1 / 6, 2 / 6, 3 / 6]);
  });

  it('handles empty array', () => {
    expect(scaleToOne([])).toEqual([]);
  });

  it('handles array summing to 0 by distributing evenly', () => {
    const result = scaleToOne([0, 0, 0]);
    expect(result).toEqual([1 / 3, 1 / 3, 1 / 3]);
  });
});

describe('firstResult', () => {
  it('returns first truthy result', () => {
    const result = firstResult([1, 2, 3], (x) => (x > 2 ? x * 10 : null));
    expect(result).toBe(30);
  });

  it('returns null if no truthy results', () => {
    const result = firstResult([1, 2, 3], () => null);
    expect(result).toBeNull();
  });
});

describe('flatMap', () => {
  it('flattens mapped results', () => {
    const result = flatMap([1, 2, 3], (x) => [x, x * 2]);
    expect(result).toEqual([1, 2, 2, 4, 3, 6]);
  });

  it('handles empty arrays', () => {
    expect(flatMap([], (x) => [x])).toEqual([]);
  });
});

describe('flatten', () => {
  it('flattens one level deep', () => {
    const result = flatten([[1, 2], [3, 4], [5]]);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it('does not flatten recursively', () => {
    const result = flatten([[1, [2]], [3]]);
    expect(result).toEqual([1, [2], 3]);
  });
});

describe('groupBy', () => {
  it('groups elements by function result', () => {
    const items = [
      { type: 'a', value: 1 },
      { type: 'b', value: 2 },
      { type: 'a', value: 3 },
    ];
    const result = groupBy(items, (x) => x.type);

    expect(result).toEqual({
      a: [
        { type: 'a', value: 1 },
        { type: 'a', value: 3 },
      ],
      b: [{ type: 'b', value: 2 }],
    });
  });
});

describe('zip', () => {
  it('zips multiple arrays together', () => {
    const result = zip([1, 2, 3], ['a', 'b', 'c'], [true, false, true]);
    expect(result).toEqual([
      [1, 'a', true],
      [2, 'b', false],
      [3, 'c', true],
    ]);
  });

  it('handles empty input', () => {
    expect(zip()).toEqual([]);
  });
});

describe('findLast', () => {
  it('finds the last matching element', () => {
    const result = findLast([1, 2, 3, 4, 3, 2], (x) => x === 3);
    expect(result).toBe(3);
  });

  it('returns undefined when no match', () => {
    const result = findLast([1, 2, 3], (x) => x > 10);
    expect(result).toBeUndefined();
  });
});

describe('intersection', () => {
  it('returns common elements', () => {
    expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
  });

  it('returns empty for no overlap', () => {
    expect(intersection([1, 2], [3, 4])).toEqual([]);
  });
});

describe('difference', () => {
  it('returns elements in first array but not second', () => {
    expect(difference([1, 2, 3], [2, 4])).toEqual([1, 3]);
  });
});

describe('partition', () => {
  it('splits array by predicate', () => {
    const [evens, odds] = partition([1, 2, 3, 4, 5], (x) => x % 2 === 0);
    expect(evens).toEqual([2, 4]);
    expect(odds).toEqual([1, 3, 5]);
  });
});

describe('sortBy', () => {
  it('sorts by function result', () => {
    const items = [{ age: 30 }, { age: 20 }, { age: 25 }];
    const result = sortBy(items, (x) => x.age);
    expect(result.map((x) => x.age)).toEqual([20, 25, 30]);
  });

  it('does not mutate original array', () => {
    const items = [3, 1, 2];
    const result = sortBy(items, (x) => x);
    expect(result).toEqual([1, 2, 3]);
    expect(items).toEqual([3, 1, 2]);
  });
});

describe('sortByArray', () => {
  it('sorts by multiple criteria', () => {
    const items = [
      { lastName: 'Smith', firstName: 'John' },
      { lastName: 'Doe', firstName: 'Jane' },
      { lastName: 'Doe', firstName: 'Alice' },
    ];
    const result = sortByArray(items, (x) => [x.lastName, x.firstName]);
    expect(result).toEqual([
      { lastName: 'Doe', firstName: 'Alice' },
      { lastName: 'Doe', firstName: 'Jane' },
      { lastName: 'Smith', firstName: 'John' },
    ]);
  });
});

describe('chunk', () => {
  it('splits array into chunks of specified size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns single chunk when size >= array length', () => {
    expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
  });
});

describe('times', () => {
  it('executes function n times', () => {
    const result = times(3, (i) => i * 2);
    expect(result).toEqual([0, 2, 4]);
  });
});

describe('uniq', () => {
  it('removes duplicates', () => {
    expect(uniq([1, 2, 2, 3, 1, 4])).toEqual([1, 2, 3, 4]);
  });

  it('works with strings', () => {
    expect(uniq(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
  });
});

describe('pick', () => {
  it('picks specified keys from object', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });
});

describe('omit', () => {
  it('omits specified keys from object', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(omit(obj, 'b')).toEqual({ a: 1, c: 3 });
  });

  it('omits multiple keys', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 };
    expect(omit(obj, 'a', 'c')).toEqual({ b: 2, d: 4 });
  });
});

describe('Date utilities', () => {
  describe('inRange', () => {
    it('returns true when date is in range', () => {
      const date = new Date('2025-06-15');
      const start = new Date('2025-06-01');
      const end = new Date('2025-06-30');
      expect(inRange(date, start, end)).toBe(true);
    });

    it('returns false when date is outside range', () => {
      const date = new Date('2025-07-01');
      const start = new Date('2025-06-01');
      const end = new Date('2025-06-30');
      expect(inRange(date, start, end)).toBe(false);
    });

    it('returns true for boundary dates', () => {
      const start = new Date('2025-06-01');
      const end = new Date('2025-06-30');
      expect(inRange(start, start, end)).toBe(true);
      expect(inRange(end, start, end)).toBe(true);
    });
  });

  describe('addMilliseconds', () => {
    it('adds milliseconds to ISO string', () => {
      const result = addMilliseconds('2025-06-01T12:00:00.000Z', 3600000);
      expect(result).toBe('2025-06-01T13:00:00.000Z');
    });

    it('handles negative values', () => {
      const result = addMilliseconds('2025-06-01T12:00:00.000Z', -3600000);
      expect(result).toBe('2025-06-01T11:00:00.000Z');
    });
  });

  describe('isoTimeDiff', () => {
    it('calculates difference between ISO strings', () => {
      const diff = isoTimeDiff('2025-06-01T12:00:00.000Z', '2025-06-01T13:00:00.000Z');
      expect(diff).toBe(3600000); // 1 hour in ms
    });

    it('returns absolute difference', () => {
      const diff1 = isoTimeDiff('2025-06-01T12:00:00.000Z', '2025-06-01T13:00:00.000Z');
      const diff2 = isoTimeDiff('2025-06-01T13:00:00.000Z', '2025-06-01T12:00:00.000Z');
      expect(diff1).toBe(diff2);
    });
  });

  describe('shortTime', () => {
    it('formats time in short format', () => {
      const result = shortTime('2025-06-01T12:30:00.000Z', 'UTC');
      expect(result).toMatch(/12:30/);
    });
  });
});

describe('sum', () => {
  it('sums array of numbers', () => {
    expect(sum([1, 2, 3, 4])).toBe(10);
  });

  it('returns 0 for empty array', () => {
    expect(sum([])).toBe(0);
  });
});

describe('byName', () => {
  it('sorts by name property', () => {
    const items = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
    items.sort(byName);
    expect(items.map((x) => x.name)).toEqual(['Alice', 'Bob', 'Charlie']);
  });
});
