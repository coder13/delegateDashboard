/**
 * Returns a copy of the object with the value at the specified path transformed by the update function.
 *
 * @param {Object} object
 * @param {Array} propertyChain
 * @param {Function} updater
 * @returns {Object}
 */
export const updateIn = (object, [property, ...properyChain], updater) =>
  properyChain.length === 0
    ? { ...object, [property]: updater(object[property]) }
    : {
        ...object,
        [property]: updateIn(object[property], properyChain, updater),
      };

/**
 * Returns a copy of the object with the value at the specified path set to the given one.
 *
 * @param {Object} object
 * @param {Array} propertyChain
 * @param {*} value
 * @returns {Object}
 */
export const setIn = (object, properyChain, value) =>
  updateIn(object, properyChain, () => value);

/**
 * Returns a copy of the object with the value at the specified path merged with the given one.
 *
 * @param {Object} object
 * @param {Array} propertyChain
 * @param {Object} newValue
 * @returns {Object}
 */
export const mergeIn = (object, properyChain, newValue) =>
  updateIn(object, properyChain, currentValue => ({
    ...currentValue,
    ...newValue,
  }));

/**
 * Returns a copy of the object with the array at the specified path mapped with the given function.
 *
 * @param {Object} object
 * @param {Array} propertyChain
 * @param {Object} mapper
 * @returns {Object}
 */
export const mapIn = (object, properyChain, mapper) =>
  updateIn(object, properyChain, array => array && array.map(mapper));

/**
 * Returns object's value at the specified path or the default value if it doesn't exist.
 *
 * @param {Object} object
 * @param {Array} propertyChain
 * @param {*} defaultValue
 * @returns {*}
 */
export const getIn = (
  object,
  [property, ...propertyChain],
  defaultValue = null
) =>
  object
    ? propertyChain.length === 0
      ? object.hasOwnProperty(property)
        ? object[property]
        : defaultValue
      : getIn(object[property], propertyChain, defaultValue)
    : defaultValue;

/**
 * Checks if the given value is an object.
 *
 * @param {*} value
 * @returns {boolean}
 */
const isObject = obj => obj === Object(obj);

/**
 * When given an object, deeply checks if it doesn't contain null values.
 * Otherwise, checks if the given value is not null.
 *
 * @param {*} value
 * @returns {boolean}
 */
export const isPresentDeep = value =>
  isObject(value) ? Object.values(value).every(isPresentDeep) : value != null;

/**
 * Pluralizes a word according to the given number.
 * When no plural form given, uses singular form with an 's' appended.
 *
 * @param {number} count
 * @param {string} singular
 * @param {string} plural
 * @returns {string}
 */
export const pluralize = (count, singular, plural) =>
  `${count} ${count === 1 ? singular : plural || singular + 's'}`;

/**
 * Returns a new array with items summing up to 1, preserving elements proportionality.
 * When the given array is empty, returns an empty array.
 *
 * @param {Array} arr
 * @returns {Array}
 */
export const scaleToOne = arr => {
  if (arr.length === 0) return [];
  const arrSum = sum(arr);
  return arr.map(x => (arrSum !== 0 ? x / arrSum : 1 / arr.length));
};

/**
 * Applies the given function to the elements and returns the first truthy value of these calls.
 *
 * @param {Array} arr
 * @returns {*}
 */
export const firstResult = (arr, fn) =>
  arr.reduce((result, x) => result || fn(x), null);

export const flatMap = (arr, fn) => arr.reduce((xs, x) => xs.concat(fn(x)), []);

export const groupBy = (arr, fn) =>
  arr.reduce(
    (obj, x) => updateIn(obj, [fn(x)], xs => (xs || []).concat(x)),
    {}
  );

export const zip = (...arrs) =>
  arrs.length === 0 ? [] : arrs[0].map((_, i) => arrs.map(arr => arr[i]));

export const findLast = (arr, predicate) =>
  arr.reduceRight(
    (found, x) => (found !== undefined ? found : predicate(x) ? x : undefined),
    undefined
  );

export const intersection = (xs, ys) => xs.filter(x => ys.includes(x));

export const difference = (xs, ys) => xs.filter(x => !ys.includes(x));

export const partition = (xs, fn) => [xs.filter(fn), xs.filter(x => !fn(x))];

const sortCompare = (x, y) => (x < y ? -1 : x > y ? 1 : 0);

export const sortBy = (arr, fn) =>
  arr.slice().sort((x, y) => sortCompare(fn(x), fn(y)));

export const sortByArray = (arr, fn) => {
  const values = new Map(
    arr.map(x => [x, fn(x)])
  ); /* Compute every value once. */
  return arr
    .slice()
    .sort((x, y) =>
      firstResult(zip(values.get(x), values.get(y)), ([a, b]) =>
        sortCompare(a, b)
      )
    );
};

export const chunk = (arr, size) =>
  arr.length <= size
    ? [arr]
    : [arr.slice(0, size), ...chunk(arr.slice(size), size)];

export const times = (n, fn) =>
  Array.from({ length: n }, (_, index) => fn(index));

export const uniq = arr => [...new Set(arr)];

export const sum = arr => arr.reduce((x, y) => x + y, 0);

export const pick = (obj, keys) =>
  keys.reduce((newObj, key) => ({ ...newObj, [key]: obj[key] }), {});

export const inRange = (x, a, b) => a <= x && x <= b;

export const addMilliseconds = (isoString, milliseconds) =>
  new Date(new Date(isoString).getTime() + milliseconds).toISOString();

export const isoTimeDiff = (first, second) =>
  Math.abs(new Date(first) - new Date(second));

export const shortTime = (isoString, timeZone = 'UTC') =>
  new Date(isoString).toLocaleTimeString('en-US', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
  });
