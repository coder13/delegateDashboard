import { getLocalStorage, localStorageKey, setLocalStorage } from '../lib/localStorage';
import { WCA_ORIGIN, WCA_OAUTH_CLIENT_ID } from '../lib/wca-env';
import { getMe } from '../lib/wcaAPI';
import { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Allows for use of staging api in production
 */
const oauthRedirectUri = () => {
  const appUri = window.location.origin;
  const searchParams = new URLSearchParams(window.location.search);
  const stagingParam = searchParams.has('staging');
  return stagingParam ? `${appUri}?staging=true` : appUri;
};

type User = {
  id: string;
  name: string;
  email: string;
};

interface IAuthContext {
  user: User | null;
  signIn: () => void;
  signOut: () => void;
  signedIn: () => boolean;
  userFetchError?: any;
}

const AuthContext = createContext<IAuthContext>({
  user: null,
  signIn: () => {},
  signOut: () => {},
  signedIn: () => false,
  userFetchError: undefined,
});

export default function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(getLocalStorage('accessToken'));
  const [expirationTime, setExpirationTime] = useState(() => {
    const expirationTime = getLocalStorage('expirationTime');
    return expirationTime ? new Date(expirationTime) : null;
  });
  const [user, setUser] = useState<User | null>(null);
  const [userFetchError, setUserFetchError] = useState(null);
  const [now, setNow] = useState(new Date());

  const location = useLocation();
  const navigate = useNavigate();

  const expired = useMemo(() => {
    return expirationTime && now >= new Date(expirationTime);
  }, [now]);

  useEffect(() => {
    const token = getLocalStorage('accessToken');
    if (token) {
      setAccessToken(token);
    }

    const interval = setInterval(() => {
      setNow(new Date());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (expired) {
      setAccessToken(null);
      setUser(null);
      setExpirationTime(null);
      localStorage.removeItem(localStorageKey('accessToken'));
      localStorage.removeItem(localStorageKey('expirationTime'));
    }
  }, [expired]);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');

    if (!hash) {
      return;
    }
    const hashParams = new URLSearchParams(hash);

    if (hashParams.has('access_token')) {
      const token = hashParams.get('access_token');
      if (token) {
        setLocalStorage('accessToken', token);
        setAccessToken(token);
      }
    }

    if (hashParams.has('expires_in')) {
      /* Expire the token 15 minutes before it actually does,
           this way it doesn't expire right after the user enters the page. */
      const expiresInSeconds = Number.parseInt(hashParams.get('expires_in') ?? '0', 10) - 15 * 60;
      const expirationTime = new Date(new Date().getTime() + expiresInSeconds * 1000);
      setLocalStorage('expirationTime', expirationTime.toISOString());
    }
    /* Clear the hash if there is a token. */
    if (hashParams.has('access_token')) {
      // history.replace({ ...history.location, hash: null });
      navigate({
        pathname: '/',
        hash: '',
      });
    }
  }, [location, navigate]);

  const signedIn = useCallback(() => !!accessToken, [accessToken]);

  useEffect(() => {
    if (user || !accessToken || expired) {
      return;
    }

    getMe()
      .then(({ me }) => {
        setUser(me);
      })
      .catch((err) => {
        console.error(err);
        setUserFetchError(err);
      });
  }, [accessToken]);

  const signIn = () => {
    const params = new URLSearchParams({
      client_id: WCA_OAUTH_CLIENT_ID,
      response_type: 'token',
      redirect_uri: oauthRedirectUri(),
      scope: 'public manage_competitions email',
    });

    window.location.href = `${WCA_ORIGIN}/oauth/authorize?${params.toString()}`;
  };

  const signOut = () => {
    setAccessToken(null);
    localStorage.removeItem(localStorageKey('accessToken'));
    setUser(null);
  };

  const value = { user, signIn, signOut, signedIn, userFetchError };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
