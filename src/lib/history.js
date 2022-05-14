/* Customized history preserving `staging` query parameter on location change. */

export const preserveQueryParams = (history, location) => {
  const query = new URLSearchParams(history.location.search);
  const newQuery = new URLSearchParams(location.search);
  if (query.has('staging')) {
    newQuery.set('staging', 'true');
    location.search = newQuery.toString();
  }
  return location;
};

export const createLocationObject = (path, state) => {
  return typeof path === 'string' ? { pathname: path, state } : path;
};
