import { test, expect, PAGES } from './helpers/fixtures.js';

test('map data remains available as a visible table', async ({ page }) => {
  await page.goto(PAGES.collaboratorsMap);
  await expect(page.locator('#map')).toHaveAttribute('data-map-state', 'ready');
  await page.getByRole('button', { name: 'Show data', exact: true }).click();
  await expect(page.locator('#map-data table tbody tr')).toHaveCount(56);
  await expect(page.locator('#map-data .rb-people-list a')).toHaveCount(93);
  await expect(page.locator('#map-data')).toBeVisible();
  await page.getByRole('button', { name: 'Show map', exact: true }).click();
  await expect(page.locator('#map')).toBeVisible();
});

test('location search supports keyboard selection and dismissal', async ({ page }) => {
  await page.goto(PAGES.locations);
  await expect(page.locator('#map')).toHaveAttribute('data-map-state', 'ready');
  const search = page.getByRole('combobox', { name: 'Search locations' });
  await search.fill('mosq');
  await expect(page.locator('#search-results [role=option]').first()).toBeVisible();
  await search.press('ArrowDown');
  const selectedName = await page.locator('#search-results [aria-selected=true] span').first().textContent();
  await search.press('Enter');
  await expect(page.locator('.maplibregl-popup')).toBeVisible();
  await expect(page.locator('.maplibregl-popup')).toContainText(selectedName);
  await search.fill('church');
  await search.press('Escape');
  await expect(search).toHaveAttribute('aria-expanded', 'false');
});

test.describe('graceful map failures', () => {
  test.use({ allowAppErrors: true });

  test('a failed map module still exposes the research data', async ({ page }) => {
    await page.route('**/maplibre-gl@*/+esm', (route) => route.abort('failed'));
    await page.goto(PAGES.collaboratorsMap);
    await expect(page.getByRole('heading', { name: 'Collaborators by affiliation', exact: true })).toBeVisible();
    await expect(page.locator('#map-status')).toContainText(/map|unavailable|load/i);
    // The table is generated before loading the optional rendering module.
    await expect(page.locator('#map-data table tbody tr')).toHaveCount(56);
    if (!await page.locator('#map-data').isVisible()) {
      await page.getByRole('button', { name: 'Show data', exact: true }).click();
    }
    await expect(page.locator('#map-data')).toBeVisible();
  });

  test('empty collaborator data has an explicit state', async ({ page }) => {
    await page.route('**/Data/Collaborators_data.json', (route) => route.fulfill({ json: [] }));
    await page.goto(PAGES.collaboratorsMap);
    await expect(page.locator('#map')).toHaveAttribute('data-map-state', 'empty');
    await expect(page.locator('#map-status')).toContainText(/no|empty/i);
    await expect(page.getByRole('heading', { name: 'Collaborators by affiliation', exact: true })).toBeVisible();
  });
});
