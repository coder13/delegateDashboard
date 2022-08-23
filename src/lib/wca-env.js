const searchParams = new URLSearchParams(window.location.search);
export const PRODUCTION = process.env.NODE_ENV === 'production' && !searchParams.has('staging');

export const WCA_ORIGIN = PRODUCTION
  ? 'https://www.worldcubeassociation.org'
  : process.env.REACT_APP_DEV_WCA_OAUTH_WCA_ORIGIN || 'https://staging.worldcubeassociation.org';

export const WCA_OAUTH_CLIENT_ID = PRODUCTION
  ? process.env.REACT_APP_WCA_OAUTH_CLIENT_ID
  : process.env.REACT_APP_DEV_WCA_OAUTH_CLIENT_ID || 'example-application-id';
