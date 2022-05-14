import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { WCA_ORIGIN, WCA_OAUTH_CLIENT_ID } from '../../lib/wca-env';
import { getMe } from '../../lib/wcaAPI';

const localStorageKey = key => `groups.${WCA_OAUTH_CLIENT_ID}.${key}`;

const getLocalStorage = (key) => localStorage.getItem(localStorageKey(key));
const setLocalStorage = (key, value) => localStorage.setItem(localStorageKey(key), value);

/**
 * Allows for use of staging api in production
 */
const oauthRedirectUri = () => {
  const appUri = window.location.origin;
  const searchParams = new URLSearchParams(window.location.search);
  const stagingParam = searchParams.has('staging');
  return stagingParam ? `${appUri}?staging=true` : appUri;
};

const AuthContext = createContext(null);


export default function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(getLocalStorage('accessToken'));
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setLocalStorage('accessToken', accessToken), [accessToken]);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    const hashParams = new URLSearchParams(hash);

    if (hashParams.has('access_token')) {
      setAccessToken(hashParams.get('access_token'));
    }

    if (hashParams.has('expires_in')) {
      /* Expire the token 15 minutes before it actually does,
         this way it doesn't expire right after the user enters the page. */
      const expiresInSeconds = hashParams.get('expires_in') - 15 * 60;
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
        to: {
          replace: '/',
          hash: null,
          state: location.state,
        },
      })
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
    if (signedIn()) {
      getMe()
        .then(({ me }) => {
          setUser(me);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [signedIn])

  const signIn = (newUser, callback) => {
    const params = new URLSearchParams({
      client_id: WCA_OAUTH_CLIENT_ID,
      response_type: 'token',
      redirect_uri: oauthRedirectUri(),
      scope: 'public manage_competitions email',
    });
    window.location = `${WCA_ORIGIN}/oauth/authorize?${params.toString()}`;
  };

  const signOut = (callback) => {
    setAccessToken(null);
    localStorage.removeItem(localStorageKey('accessToken'));
    setUser(null);
  };

  const value = { user, signIn, signOut, signedIn };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
