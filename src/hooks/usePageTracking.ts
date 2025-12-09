import { useAuth } from '../providers/AuthProvider';
import { useEffect, useState } from 'react';
import ReactGA from 'react-ga';
import { useLocation } from 'react-router-dom';

const usePageTracking = (trackingCode: string) => {
  const location = useLocation();
  const { user } = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    ReactGA.initialize(trackingCode, {
      debug: window.location.href.includes('localhost'),
      gaOptions: {
        name: user?.name,
        ...(user?.id ? { userId: user?.id?.toString() } : {}),
      },
    });
    setInitialized(true);
  }, [user?.id, trackingCode, user?.name]);

  useEffect(() => {
    if (initialized) {
      ReactGA.pageview(location.pathname + location.search);
    }
  }, [initialized, location]);
};

export default usePageTracking;
