console.log('env', import.meta.env);
const searchParams = new URLSearchParams(window.location.search);
export const STAGING_QUERY_PARAMS = searchParams.has('staging');

const STAGING_URL = 'https://staging.worldcubeassociation.org';
const STAGING_APP_ID = 'example-application-id';

export const WCA_ORIGIN: string = STAGING_QUERY_PARAMS
  ? STAGING_URL
  : import.meta.env.VITE_WCA_ORIGIN || STAGING_URL;
export const WCA_OAUTH_CLIENT_ID: string = STAGING_QUERY_PARAMS
  ? STAGING_APP_ID
  : import.meta.env.VITE_WCA_OAUTH_CLIENT_ID || STAGING_APP_ID;
