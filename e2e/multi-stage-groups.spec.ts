import { test, expect } from '@playwright/test';
import { fixtures } from './fixtures';
import { createWcaApiState, registerWcaApiRoutes, seedAuth } from './mocks/wcaApi';

test.beforeEach(async ({ page }) => {
  await seedAuth(page);
  const state = createWcaApiState(fixtures);
  await registerWcaApiRoutes(page, state, fixtures);
});

test('creates per-room groups for multi-stage rounds', async ({ page }) => {
  await page.goto('/competitions/MultiStageComp2026');
  await page.getByText('3x3x3 Cube, Round 1').click();

  await page.getByRole('button', { name: 'Configure Group Counts' }).click();
  const dialog = page.getByRole('dialog', {
    name: 'Configuring Group Counts For 333-r1',
  });

  await dialog.getByLabel('Spread Groups Across All Stages').click();
  await dialog.locator('#groups-1-input').fill('2');
  await dialog.locator('#groups-2-input').fill('1');
  await dialog.getByRole('button', { name: 'Save And Create Groups' }).click();

  await expect(page.getByText('Main Room: Group 2')).toBeVisible();
  await expect(page.getByText('Side Room: Group 1')).toBeVisible();

  await expect(page.getByText('Main Room: Group 1')).toBeVisible();
});
