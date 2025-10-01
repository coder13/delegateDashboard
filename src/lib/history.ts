/* Customized history preserving `staging` query parameter on location change. */

interface Location {
  pathname?: string;
  search?: string;
  state?: any;
}

interface History {
  location: {
    search: string;
  };
}

export const preserveQueryParams = (history: History, location: Location): Location => {
  const query = new URLSearchParams(history.location.search);
  const newQuery = new URLSearchParams(location.search);
  if (query.has('staging')) {
    newQuery.set('staging', 'true');
    location.search = newQuery.toString();
  }
  return location;
};

export const createLocationObject = (path: string | Location, state?: any): Location => {
  return typeof path === 'string' ? { pathname: path, state } : path;
};
