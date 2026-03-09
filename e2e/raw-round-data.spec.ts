import { test, expect } from '@playwright/test';
import { fixtures } from './fixtures';
import { createWcaApiState, registerWcaApiRoutes, seedAuth } from './mocks/wcaApi';

test.beforeEach(async ({ page }) => {
  await seedAuth(page);
  const state = createWcaApiState(fixtures);
  await registerWcaApiRoutes(page, state, fixtures);
});

test('edits raw round data and persists changes', async ({ page }) => {
  await page.goto('/competitions/TestComp2026');
  await page.getByText('3x3x3 Cube, Round 1').click();

  await page.getByLabel('Action Menu').click();
  await page.getByRole('menuitem', { name: 'Dangerously Edit Raw Round Data' }).click();

  const dialog = page.getByRole('dialog', { name: 'Raw Data for 333-r1' });
  const textArea = dialog.getByLabel('Multiline');
  const current = await textArea.inputValue();
  const parsed = JSON.parse(current);
  parsed.format = '3';

  await textArea.fill(JSON.stringify(parsed, null, 2));
  await dialog.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText("Don't Forget to save changes!")).toBeVisible();

  await page.getByLabel('Action Menu').click();
  await page.getByRole('menuitem', { name: 'Dangerously Edit Raw Round Data' }).click();

  const updated = await page
    .getByRole('dialog', { name: 'Raw Data for 333-r1' })
    .getByLabel('Multiline')
    .inputValue();
  await expect(updated).toContain('"format": "3"');
});
