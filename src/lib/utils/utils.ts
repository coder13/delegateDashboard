import {
  type AttemptResult,
  type EventId,
  type RankingType,
  formatCentiseconds,
} from '@wca/helpers';

/**
 * Returns a copy of the object with the value at the specified path transformed by the update function.
 *
 * @param {Object} object
 * @param {Array} propertyChain
 * @param {Function} updater
 * @returns {Object}
 */
export const updateIn = <T extends object, S extends keyof T, U>(
  object: T,
  property: S,
  updater: (value: T[S]) => U
): T => ({
  ...object,
  [property]: updater(object[property]),
});

/**
 * Returns a copy of the object with the value at the specified path set to the given one.
 *
 * @param {Object} object
 * @param {Array} propertyChain
 * @param {*} value
 * @returns {Object}
 */
export const setIn = <T extends object, S extends keyof T>(
  object: T,
  properyChain: S,
  value: T[S]
): T => updateIn(object, properyChain, () => value);


/**
 * Returns a copy of the object with the array at the specified path mapped with the given function.
 *
 * @param {Object} object
 * @param {Array<string>} propertyChain
 * @param {Object} mapper
 * @returns {Object}
 */
export const mapIn = <T extends object, S extends keyof T, U>(
  object: T,
  properyChain: S,
  mapper: (foo: T[S] extends Array<infer U> ? U : never) => U
): T =>
  updateIn(object, properyChain, (array) => (Array.isArray(array) ? array.map(mapper) : array));

// ============================================================================
// DEPRECATED FUNCTIONS - Use native JS or lodash instead
// ============================================================================

/**
 * Pluralizes a word according to the given number.
 * When no plural form given, uses singular form with an 's' appended.
 */
export const pluralize = (count: number, singular: string, plural?: string) =>
  `${count} ${count === 1 ? singular : plural || singular + 's'}`;

/**
 * @deprecated Use inline function or Intl.PluralRules instead
 * Pluralizes a word according to the given number.
 * When no plural form given, uses singular form with an 's' appended.
 */
export const pluralizeWord = (count: number, singular: string, plural?: string) =>
  `${count === 1 ? singular : plural || singular + 's'}`;

// ============================================================================
// KEEP THESE - Domain-specific helpers
// ============================================================================

export const shortTime = (isoString: string, timeZone = 'UTC') =>
  new Date(isoString).toLocaleTimeString('en-US', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
  });

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
