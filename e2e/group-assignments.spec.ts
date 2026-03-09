import { test, expect } from '@playwright/test';
import { fixtures } from './fixtures';
import { createWcaApiState, registerWcaApiRoutes, seedAuth } from './mocks/wcaApi';

test.beforeEach(async ({ page }) => {
  await seedAuth(page);
  const state = createWcaApiState(fixtures);
  await registerWcaApiRoutes(page, state, fixtures);
});

test('creates groups, assigns scramblers, and generates assignments', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Test Competition 2026').click();
  await expect(page).toHaveURL(/\/competitions\/TestComp2026/);

  await page.getByText('3x3x3 Cube, Round 1').click();
  await expect(page).toHaveURL(/\/competitions\/TestComp2026\/events\/333-r1/);

  await page.getByRole('button', { name: 'Configure Group Counts' }).click();
  const groupCountsDialog = page.getByRole('dialog', {
    name: 'Configuring Group Counts For 333-r1',
  });

  await groupCountsDialog.getByLabel('Groups').fill('3');
  await groupCountsDialog.getByRole('button', { name: 'Save And Create Groups' }).click();

  await expect(page.getByText('Main Room: Group 3')).toBeVisible();

  await page.getByRole('button', { name: 'Configure Assignments' }).click();
  const assignmentsDialog = page.getByRole('dialog', {
    name: 'Configuring Assignments For 3x3x3 Cube, Round 1',
  });

  await assignmentsDialog.getByRole('switch').first().click();

  const alexRow = assignmentsDialog.getByRole('row', { name: /Alex Example/ });
  await expect(alexRow).toBeVisible();
  const alexGroup1 = alexRow.getByRole('cell').nth(5);
  await alexGroup1.click();
  await expect(alexGroup1).toHaveText('S');

  const jamieRow = assignmentsDialog.getByRole('row', { name: /Jamie Example/ });
  const jamieGroup2 = jamieRow.getByRole('cell').nth(6);
  await jamieGroup2.click();
  await expect(jamieGroup2).toHaveText('S');

  await assignmentsDialog.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('button', { name: 'Assign Competitor and Judging Assignments' }).click();

  const statsTable = page.getByRole('table').filter({ hasText: 'Round Size' });
  const statsRow = statsTable.getByRole('row').last();
  await expect(statsRow.getByRole('cell').nth(2)).toHaveText('2');
  await expect(statsRow.getByRole('cell').nth(3)).toHaveText('2');
});
