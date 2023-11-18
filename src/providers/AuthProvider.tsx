import {
  getLocalStorage,
  localStorageKey,
  setLocalStorage,
} from '../lib/localStorage';
import { WCA_ORIGIN, WCA_OAUTH_CLIENT_ID } from '../lib/wca-env';
import { getMe } from '../lib/wcaAPI';
import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
  useMemo,
} from 'react';
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
  const [accessToken, setAccessToken] = useState(
    getLocalStorage('accessToken')
  );
  const [user, setUser] = useState<User | null>(null);
  const [userFetchError, setUserFetchError] = useState(null);
  const [now, setNow] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();

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

  const expired = useMemo(() => {
    const expirationTime = getLocalStorage('expirationTime');
    return expirationTime && now >= new Date(expirationTime);
  }, [now]);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');

    const hashParams = new URLSearchParams(hash);

    if (hashParams.has('access_token')) {
      setLocalStorage('accessToken', hashParams.get('access_token'));

      setAccessToken(hashParams.get('access_token'));
    }

    if (hashParams.has('expires_in')) {
      /* Expire the token 15 minutes before it actually does,
         this way it doesn't expire right after the user enters the page. */
      const expiresInSeconds =
        Number.parseInt(hashParams.get('expires_in') ?? '0', 10) - 15 * 60;
      const expirationTime = new Date(
        new Date().getTime() + expiresInSeconds * 1000
      );
      setLocalStorage('expirationTime', expirationTime.toISOString());
    }

    /* If the token expired, sign the user out. */
    const expirationTime = getLocalStorage('expirationTime');
    if (expirationTime && new Date() >= new Date(expirationTime)) {
      signOut();
    }

    /* Clear the hash if there is a token. */
    if (hashParams.has('access_token')) {
      // history.replace({ ...history.location, hash: null });
      navigate({
        pathname: '/',
        hash: '',
      });
    }

    // /* Check if we know what path to redirect to (after OAuth redirect). */
    // const redirectPath = localStorage.getItem(localStorageKey('redirectPath'));
    // if (redirectPath) {
    //   history.replace(redirectPath);
    //   localStorage.removeItem(localStorageKey('redirectPath'));
    // }
  }, [location, navigate]);

  const signedIn = useCallback(() => !!accessToken, [accessToken]);

  useEffect(() => {
    if (!accessToken || !getLocalStorage('accessToken') || expired) {
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
