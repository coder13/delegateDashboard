import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import type { Competition } from '@wca/helpers';
import { fixtures } from './fixtures';
import { createWcaApiState, registerWcaApiRoutes, seedAuth } from './mocks/wcaApi';

test('official FTO groups, assignments, persistence, display and CSV exports', async ({ page }) => {
  test.setTimeout(60_000);
  // Reuse the small two-person fixture, retaining official WCIF identifiers throughout.
  const wcif = JSON.parse(
    JSON.stringify(fixtures.wcif)
      .replaceAll('333', 'fto')
      .replaceAll('3x3x3 Cube', 'Face-Turning Octahedron')
  ) as Competition;
  // Exports read the required WCIF room extensions, omitted by the base UI fixture.
  wcif.schedule.venues[0].rooms[0].extensions = [];
  wcif.persons[0].email = 'alex@example.com';
  const state = createWcaApiState({ wcif });
  await seedAuth(page);
  await registerWcaApiRoutes(page, state, fixtures);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/competitions/TestComp2026');
  await expect(page.getByText('Events:').locator('..')).toHaveText('Events: FTO (1)');
  const roundLink = page.getByText('Face-Turning Octahedron, Round 1', { exact: true });
  await expect(roundLink).toBeVisible();
  const icon = page.locator('.cubing-icon.event-fto').first();
  await expect(icon).toBeVisible();
  expect(await icon.evaluate((element) => getComputedStyle(element, '::before').content)).toBe(
    '"\uf135"'
  );
  await roundLink.click();
  await expect(page).toHaveURL(/\/events\/fto-r1$/);

  await page.getByRole('button', { name: 'Configure Group Counts' }).click();
  const counts = page.getByRole('dialog', { name: 'Configuring Group Counts For fto-r1' });
  await counts.getByLabel('Groups').fill('2');
  await counts.getByRole('button', { name: 'Save And Create Groups' }).click();
  await expect(page.getByText('Main Room: Group 2')).toBeVisible();
  await page.getByRole('button', { name: 'Assign Competitor and Judging Assignments' }).click();
  const stats = page.getByRole('table').filter({ hasText: 'Round Size' }).getByRole('row').last();
  await expect(stats.getByRole('cell').nth(2)).toHaveText('2');
  await expect(stats.getByRole('cell').nth(3)).toHaveText('2');

  await page.getByRole('button', { name: 'Configure Assignments', exact: true }).click();
  const assignments = page.getByRole('dialog', {
    name: 'Configuring Assignments For Face-Turning Octahedron, Round 1',
  });
  await assignments.getByRole('switch').first().click();
  await expect(assignments.getByRole('row', { name: /Alex Example/ })).toBeVisible();
  await expect(assignments.getByRole('row', { name: /Jamie Example/ })).toBeVisible();
  await assignments.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('button', { name: 'SAVE', exact: true }).click();
  await expect(page.getByText('Saved!', { exact: true })).toBeVisible();
  const saved = state.wcifById.TestComp2026 as Competition;
  expect(saved.events[0].id).toBe('fto');
  expect(
    saved.schedule.venues[0].rooms[0].activities[0].childActivities.map(
      (group) => group.activityCode
    )
  ).toEqual(['fto-r1-g1', 'fto-r1-g2']);
  for (const person of saved.persons) {
    expect(person.registration?.eventIds).toEqual(['fto']);
    expect(person.assignments?.map((a) => a.assignmentCode).sort()).toEqual([
      'competitor',
      'staff-judge',
    ]);
  }

  await page.goto('/competitions/TestComp2026/assignments');
  const eventFilter = page.getByRole('button', { name: 'Face-Turning Octahedron', exact: true });
  await expect(eventFilter).toHaveAttribute('aria-pressed', 'true');
  await eventFilter.click();
  await expect(eventFilter).toHaveAttribute('aria-pressed', 'false');
  await eventFilter.click();

  await page.goto('/competitions/TestComp2026/export');
  for (const [button, expected] of [
    [
      'Generate Nametags CSV',
      ['fto', 'fto_station_number', 'fto_staff', 'Alex Example', 'Jamie Example'],
    ],
    ['Generate Scorecard CSV', ['Face-Turning Octahedron', 'ao5', 'Alex Example', 'Jamie Example']],
    ['Generate Registration CSV', ['alex@example.com', 'jamie@example.com']],
    [
      'Generate Nametags for publisher CSV',
      ['fto-0', 'fto_staff-0', 'Alex Example', 'Jamie Example'],
    ],
  ] as const) {
    await test.step(button, async () => {
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: button, exact: true }).click();
      expect(errors).toEqual([]);
      const download = await downloadPromise;
      expect(await download.failure()).toBeNull();
      const csv = await readFile((await download.path())!, 'utf8');
      for (const value of expected) expect(csv).toContain(value);
      expect(csv).not.toContain('undefined');
    });
  }
  expect(errors).toEqual([]);
});
