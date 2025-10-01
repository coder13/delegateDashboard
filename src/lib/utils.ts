import { AttemptResult, EventId, RankingType, formatCentiseconds } from '@wca/helpers';

/**
 * Returns a copy of the object with the value at the specified path transformed by the update function.
 */
export const updateIn = <T>(object: T, [property, ...properyChain]: string[], updater: (value: unknown) => unknown): T =>
  properyChain.length === 0
    ? { ...object, [property]: updater((object as Record<string, unknown>)[property]) }
    : {
      ...object,
      [property]: updateIn((object as Record<string, unknown>)[property], properyChain, updater),
    };

/**
 * Returns a copy of the object with the value at the specified path set to the given one.
 */
export const setIn = <T>(object: T, properyChain: string[], value: unknown): T => 
  updateIn(object, properyChain, () => value);

/**
 * Returns a copy of the object with the value at the specified path merged with the given one.
 */
export const mergeIn = <T>(object: T, properyChain: string[], newValue: Record<string, unknown>): T =>
  updateIn(object, properyChain, (currentValue) => ({
    ...(currentValue as Record<string, unknown>),
    ...newValue,
  }));

/**
 * Returns a copy of the object with the array at the specified path mapped with the given function.
 */
export const mapIn = <T>(object: T, properyChain: string[], mapper: (item: unknown) => unknown): T =>
  updateIn(object, properyChain, (array) => (array as unknown[])?.map(mapper));

/**
 * Returns object's value at the specified path or the default value if it doesn't exist.
 */
export const getIn = (object: Record<string, unknown> | null | undefined, [property, ...propertyChain]: string[], defaultValue: unknown = null): unknown =>
  object
    ? propertyChain.length === 0
      ? object.hasOwnProperty(property)
        ? object[property]
        : defaultValue
      : getIn(object[property] as Record<string, unknown>, propertyChain, defaultValue)
    : defaultValue;

/**
 * Checks if the given value is an object.
 */
const isObject = (obj: unknown): obj is Record<string, unknown> => obj === Object(obj);

/**
 * When given an object, deeply checks if it doesn't contain null values.
 * Otherwise, checks if the given value is not null.
 */
export const isPresentDeep = (value: unknown): boolean =>
  isObject(value) ? Object.values(value).every(isPresentDeep) : value != null;

/**
 * Pluralizes a word according to the given number.
 * When no plural form given, uses singular form with an 's' appended.
 */
export const pluralize = (count: number, singular: string, plural?: string): string =>
  `${count} ${count === 1 ? singular : plural || singular + 's'}`;

/**
 * Pluralizes a word according to the given number.
 * When no plural form given, uses singular form with an 's' appended.
 */
export const pluralizeWord = (count: number, singular: string, plural?: string): string =>
  `${count === 1 ? singular : plural || singular + 's'}`;

/**
 * Returns a new array with items summing up to 1, preserving elements proportionality.
 * When the given array is empty, returns an empty array.
 */
export const scaleToOne = (arr: number[]): number[] => {
  if (arr.length === 0) return [];
  const arrSum = sum(arr);
  return arr.map((x) => (arrSum !== 0 ? x / arrSum : 1 / arr.length));
};

/**
 * Applies the given function to the elements and returns the first truthy value of these calls.
 */
export const firstResult = <T, R>(arr: T[], fn: (item: T) => R): R | null => 
  arr.reduce((result: R | null, x) => result || fn(x), null);

export const flatMap = <T, R>(arr: T[], fn: (item: T) => R[]): R[] => 
  arr.reduce((xs: R[], x) => xs.concat(fn(x)), []);

export const flatten = <T>(arr: T[][]): T[] => arr.reduce((xs, x) => xs.concat(x), []);

/**
 * Groups array elements by a given function
 */
export const groupBy = <T, K extends string | number>(arr: T[], fn: (item: T) => K): Record<K, T[]> =>
  arr.reduce((obj, x) => updateIn(obj, [String(fn(x))], (xs) => ((xs as T[]) || []).concat(x)), {} as Record<K, T[]>);

export const zip = <T>(...arrs: T[][]): T[][] =>
  arrs.length === 0 ? [] : arrs[0].map((_, i) => arrs.map((arr) => arr[i]));

export const findLast = <T>(arr: T[], predicate: (item: T) => boolean): T | undefined =>
  arr.reduceRight(
    (found, x) => (found !== undefined ? found : predicate(x) ? x : undefined),
    undefined as T | undefined
  );

export const intersection = <T>(xs: T[], ys: T[]): T[] => xs.filter((x) => ys.includes(x));

export const difference = <T>(xs: T[], ys: T[]): T[] => xs.filter((x) => !ys.includes(x));

export const partition = <T>(xs: T[], fn: (item: T) => boolean): [T[], T[]] => 
  [xs.filter(fn), xs.filter((x) => !fn(x))];

const sortCompare = (x: unknown, y: unknown): number => (x < y ? -1 : x > y ? 1 : 0);

export const sortBy = <T>(arr: T[], fn: (item: T) => unknown): T[] => 
  arr.slice().sort((x, y) => sortCompare(fn(x), fn(y)));

export const sortByArray = <T>(arr: T[], fn: (item: T) => unknown[]): T[] => {
  const values = new Map(arr.map((x) => [x, fn(x)])); /* Compute every value once. */
  const firstResult = <R>(pairs: unknown[][], fn: (pair: [unknown, unknown]) => R | 0): R | 0 => {
    for (const pair of pairs) {
      const result = fn(pair as [unknown, unknown]);
      if (result !== 0) return result;
    }
    return 0;
  };
  return arr
    .slice()
    .sort((x, y) => firstResult(zip(values.get(x) as unknown[], values.get(y) as unknown[]), ([a, b]) => sortCompare(a, b)));
};

export const chunk = <T>(arr: T[], size: number): T[][] =>
  arr.length <= size ? [arr] : [arr.slice(0, size), ...chunk(arr.slice(size), size)];

export const times = <T>(n: number, fn: (index: number) => T): T[] => 
  Array.from({ length: n }, (_, index) => fn(index));

export const uniq = <T>(arr: T[]): T[] => [...new Set(arr)];

export const pick = <T extends Record<string, unknown>>(obj: T, keys: (keyof T)[]): Partial<T> =>
  keys.reduce((newObj, key) => ({ ...newObj, [key]: obj[key] }), {} as Partial<T>);

export const omit = <T extends object, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K> => {
  const _ = { ...obj }
  keys.forEach((key) => delete _[key])
  return _
}

// Date utils

export const inRange = (x: Date, start: Date, end: Date) =>
  start.getTime() <= x.getTime() && x.getTime() <= end.getTime();

export const addMilliseconds = (isoString: string, milliseconds: number) =>
  new Date(new Date(isoString).getTime() + milliseconds).toISOString();

export const isoTimeDiff = (first: string, second: string) =>
  Math.abs(new Date(first).getTime() - new Date(second).getTime());

export const shortTime = (isoString: string, timeZone = 'UTC') =>
  new Date(isoString).toLocaleTimeString('en-US', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
  });

// Reduction utils

export const sum = (arr: number[]) => arr.reduce((x, y) => x + y, 0);

// Sorting utils

export const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

export const renderResultByEventId = (
  eventId: EventId,
  rankingType: RankingType,
  result: AttemptResult
) => {
  if (eventId === '333fm') {
    return rankingType === 'average' ? ((result as number) / 100).toFixed(2).toString() : result;
  }

  // if (eventId === '333mbf') {
  //   return formatMultiResult(decodeMultiResult('0' + (result as number).toString()));
  // }

  return formatCentiseconds(result as number);
};
