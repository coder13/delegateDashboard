const searchParams = new URLSearchParams(window.location.search);
export const PRODUCTION = process.env.NODE_ENV === 'production' && !searchParams.has('staging');

// export const WCA_ORIGIN = PRODUCTION
//   ? 'https://www.worldcubeassociation.org'
//   : 'https://staging.worldcubeassociation.org';
export const WCA_ORIGIN = 'https://www.worldcubeassociation.org';

// export const WCA_OAUTH_CLIENT_ID = PRODUCTION
//   ? process.env.REACT_APP_WCA_OAUTH_CLIENT_ID
//   : 'example-application-id';
export const WCA_OAUTH_CLIENT_ID = process.env.REACT_APP_WCA_OAUTH_CLIENT_ID;

const foo = 2;
