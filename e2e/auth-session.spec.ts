import { test, expect } from '@playwright/test';
import { fixtures } from './fixtures';
import { createWcaApiState, registerWcaApiRoutes, seedAuth } from './mocks/wcaApi';

test('shows sign in when no session', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
});

test('shows competitions when session is valid', async ({ page }) => {
  await seedAuth(page);
  const state = createWcaApiState(fixtures);
  await registerWcaApiRoutes(page, state, fixtures);

  await page.goto('/');

  await expect(page.getByText('My Competitions')).toBeVisible();
  await expect(page.getByText('Test Competition 2026')).toBeVisible();
});

test('clears expired session and shows sign in', async ({ page }) => {
  const expiredTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  await seedAuth(page, { expirationTime: expiredTime });

  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
  await expect(page.getByText('My Competitions')).toHaveCount(0);
});
