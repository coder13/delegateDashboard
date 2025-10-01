import { WCA_OAUTH_CLIENT_ID } from './wca-env';

export const localStorageKey = (key: string): string =>
  `delegate-dashboard.${WCA_OAUTH_CLIENT_ID}.${key}`;

export const getLocalStorage = (key: string): string | null =>
  localStorage.getItem(localStorageKey(key));

export const setLocalStorage = (key: string, value: string): void =>
  localStorage.setItem(localStorageKey(key), value);
