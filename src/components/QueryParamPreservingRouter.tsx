import { preserveQueryParams, createLocationObject } from '../lib/utils/history';
import { BrowserHistory, createBrowserHistory } from 'history';
import { Action, Location } from 'history';
import { useLayoutEffect, useRef, useState } from 'react';
import { Router } from 'react-router-dom';

interface QueryParamPreservingRouterProps {
  basename?: string;
  children?: React.ReactNode;
}

function QueryParamPreservingRouter({ basename = '', children }: QueryParamPreservingRouterProps) {
  const historyRef = useRef<BrowserHistory | null>(null);
  if (historyRef.current == null) {
    historyRef.current = createBrowserHistory();
    const originalPush = historyRef.current.push;
    historyRef.current.push = function (path, state) {
      if (historyRef.current) {
        return originalPush.apply(historyRef.current, [
          preserveQueryParams(historyRef.current, createLocationObject(path, state)),
        ]);
      }
    };

    const originalReplace = historyRef.current.replace;
    historyRef.current.replace = function (path, state) {
      if (historyRef.current) {
        return originalReplace.apply(historyRef.current, [
          preserveQueryParams(historyRef.current, createLocationObject(path, state)),
        ]);
      }
    };
  }

  const history = historyRef.current;
  const [state, setState] = useState<{
    action: Action;
    location: Location;
  }>({
    action: history.action,
    location: history.location,
  });

  useLayoutEffect(() => history.listen(setState), [history]);

  return (
    <Router
      basename={basename}
      location={state.location}
      navigationType={state.action}
      navigator={history}>
      {children}
    </Router>
  );
}

export default QueryParamPreservingRouter;
