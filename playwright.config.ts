import { defineConfig } from '@playwright/test';

const port = 4173;

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `yarn dev --host --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_WCA_ORIGIN: 'http://wca.test',
      VITE_WCA_OAUTH_CLIENT_ID: 'e2e-client',
      VITE_GA_MEASUREMENT_ID: '',
    },
  },
});
