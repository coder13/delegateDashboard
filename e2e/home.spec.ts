import { test, expect } from '@playwright/test';
import { fixtures } from './fixtures';
import { createWcaApiState, registerWcaApiRoutes, seedAuth } from './mocks/wcaApi';

test.beforeEach(async ({ page }) => {
  await seedAuth(page);
  const state = createWcaApiState(fixtures);
  await registerWcaApiRoutes(page, state, fixtures);
});

test('loads competitions and opens a competition', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('My Competitions')).toBeVisible();
  await expect(page.getByText('Upcoming Competitions')).toBeVisible();
  await page.getByText('Test Competition 2026').click();

  await expect(page).toHaveURL(/\/competitions\/TestComp2026/);

  await expect(page.getByText('Test Competition 2026').first()).toBeVisible();
  await expect(page.getByText('3x3x3 Cube, Round 1')).toBeVisible();
});
