/* Customized history preserving `staging` query parameter on location change. */

import { createBrowserHistory } from 'history';

const preserveQueryParams = (history, location) => {
  const query = new URLSearchParams(history.location.search);
  const newQuery = new URLSearchParams(location.search);
  if (query.has('staging')) {
    newQuery.set('staging', 'true');
    location.search = newQuery.toString();
  }
  return location;
};

const createLocationObject = (path, state) => {
  return typeof path === 'string' ? { pathname: path, state } : path;
};

const history = createBrowserHistory();

const originalPush = history.push;
history.push = (path, state) => {
  return originalPush.apply(history, [
    preserveQueryParams(history, createLocationObject(path, state)),
  ]);
};

const originalReplace = history.replace;
history.replace = (path, state) => {
  return originalReplace.apply(history, [
    preserveQueryParams(history, createLocationObject(path, state)),
  ]);
};

export default history;