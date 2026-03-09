import { test, expect } from '@playwright/test';
import { fixtures } from './fixtures';
import { createWcaApiState, registerWcaApiRoutes, seedAuth } from './mocks/wcaApi';

test.beforeEach(async ({ page }) => {
  await seedAuth(page);
  const state = createWcaApiState(fixtures);
  await registerWcaApiRoutes(page, state, fixtures);
});

test('checks first-timers and shows matches', async ({ page }) => {
  await page.goto('/competitions/TestComp2026/checks/first-timers');

  await expect(page.getByRole('button', { name: 'Check All First-Timers' })).toBeVisible();
  await page.getByRole('button', { name: 'Check All First-Timers' }).click();

  await expect(page.getByText('Matches')).toBeVisible();
  await expect(page.getByText('Jamie Example (2024JAM01)')).toBeVisible();
});
