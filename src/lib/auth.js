import { WCA_OAUTH_CLIENT_ID } from './wca-env';

// /* Use separate set of keys for each OAuth client (e.g. for WCA production and staging). */
const localStorageKey = key => `groups.${WCA_OAUTH_CLIENT_ID}.${key}`;

// /**
//  * Checks the URL hash for presence of OAuth access token
//  * and saves it in the local storage if it's found.
//  * Should be called on application initialization (before any kind of router takes over the location).
//  */
// export const initializeAuth = () => {
//   const hash = window.location.hash.replace(/^#/, '');
//   const hashParams = new URLSearchParams(hash);
//   if (hashParams.has('access_token')) {
//     localStorage.setItem(
//       localStorageKey('accessToken'),
//       hashParams.get('access_token')
//     );
//   }
//   if (hashParams.has('expires_in')) {
//     /* Expire the token 15 minutes before it actually does,
//        this way it doesn't expire right after the user enters the page. */
//     const expiresInSeconds = hashParams.get('expires_in') - 15 * 60;
//     const expirationTime = new Date(
//       new Date().getTime() + expiresInSeconds * 1000
//     );
//     localStorage.setItem(
//       localStorageKey('expirationTime'),
//       expirationTime.toISOString()
//     );
//   }
//   /* If the token expired, sign the user out. */
//   const expirationTime = localStorage.getItem(
//     localStorageKey('expirationTime')
//   );
//   if (expirationTime && new Date() >= new Date(expirationTime)) {
//     signOut();
//   }
//   /* Clear the hash if there is a token. */
//   if (hashParams.has('access_token')) {
//     history.replace({ ...history.location, hash: null });
//   }

//   /* Check if we know what path to redirect to (after OAuth redirect). */
//   const redirectPath = localStorage.getItem(localStorageKey('redirectPath'));
//   if (redirectPath) {
//     history.replace(redirectPath);
//     localStorage.removeItem(localStorageKey('redirectPath'));
//   }
//   /* If non-signed in user tries accessing a competition path, redirect to OAuth sign in straightaway. */
//   const path = window.location.pathname;
//   if (path.startsWith('/competitions') && !isSignedIn()) {
//     localStorage.setItem(localStorageKey('redirectPath'), path);
//     signIn();
//   }
// };

export const wcaAccessToken = () =>
  localStorage.getItem(localStorageKey('accessToken'));

// export const signIn = () => {
//   const params = new URLSearchParams({
//     client_id: WCA_OAUTH_CLIENT_ID,
//     response_type: 'token',
//     redirect_uri: oauthRedirectUri(),
//     scope: 'public manage_competitions email',
//   });
//   window.location = `${WCA_ORIGIN}/oauth/authorize?${params.toString()}`;
// };

// const oauthRedirectUri = () => {
//   const appUri = window.location.origin;
//   const searchParams = new URLSearchParams(window.location.search);
//   const stagingParam = searchParams.has('staging');
//   return stagingParam ? `${appUri}?staging=true` : appUri;
// };

// export const signOut = () =>
//   localStorage.removeItem(localStorageKey('accessToken'));

// export const isSignedIn = () => !!wcaAccessToken();