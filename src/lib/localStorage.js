import { WCA_OAUTH_CLIENT_ID } from "./wca-env";

export const localStorageKey = (key) => `groups.${WCA_OAUTH_CLIENT_ID}.${key}`;
export const getLocalStorage = (key) => localStorage.getItem(localStorageKey(key));
export const setLocalStorage = (key, value) => localStorage.setItem(localStorageKey(key), value);
