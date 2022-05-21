import { createBrowserHistory } from 'history';
import { useLayoutEffect, useRef, useState } from 'react';
import { Router } from 'react-router-dom';
import { preserveQueryParams, createLocationObject } from '../lib/history';

function QueryParamPreservingRouter({ basename, children, window }) {
  let historyRef = useRef();
  if (historyRef.current == null) {
    historyRef.current = createBrowserHistory({ window });
    const originalPush = historyRef.current.push;
    historyRef.current.push = (path, state) => {
      return originalPush.apply(historyRef.current, [
        preserveQueryParams(historyRef.current, createLocationObject(path, state)),
      ]);
    };

    const originalReplace = historyRef.current.replace;
    historyRef.current.replace = (path, state) => {
      return originalReplace.apply(historyRef.current, [
        preserveQueryParams(historyRef.current, createLocationObject(path, state)),
      ]);
    };
  }

  let history = historyRef.current;
  let [state, setState] = useState({
    action: history.action,
    location: history.location,
  });

  useLayoutEffect(() => history.listen(setState), [history]);

  return (
    <Router
      basename={basename}
      children={children}
      location={state.location}
      navigationType={state.action}
      navigator={history}
    />
  );
}

export default QueryParamPreservingRouter;
