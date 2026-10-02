import { test, expect, PAGES } from './helpers/fixtures.js';

test.describe('chart data failures', () => {
  test.use({ allowAppErrors: true });

  test('an HTTP error displays a readable chart state', async ({ page }) => {
    await page.route('**/Data/Collaborators_data.json', (route) => route.fulfill({ status: 503, body: 'Unavailable' }));
    await page.goto(PAGES.byCountry);
    await expect(page.locator('#plot')).toContainText(/could not be loaded|unavailable/i);
    await expect(page.getByRole('heading', { name: 'Collaborators by country', exact: true })).toBeVisible();
  });

  test('empty activity data does not create a misleading chart', async ({ page }) => {
    await page.route('**/Data/Publications_and_activities_data.json', (route) => route.fulfill({ json: { rows: [] } }));
    await page.goto(PAGES.overTime);
    await expect(page.locator('#plot')).toContainText(/no|empty/i);
    await expect(page.locator('#plot rect.rb-mark')).toHaveCount(0);
    await expect(page.locator('#desc')).not.toContainText('NaN');
  });
});
