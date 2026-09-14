// Every published URL must keep loading, render its marks from the JSON
// data, and throw no errors, on desktop and on a phone.
import { test, expect } from '@playwright/test';

const PAGES = {
  index: 'index.html',
  locations: 'Book_DeGruyter/Maps/UAC_UL_locations_map.html',
  pointsOfInterest: 'Book_DeGruyter/Maps/points_of_interest.html',
  universities: 'Book_DeGruyter/Maps/universities_map.html',
  timeline: 'Book_DeGruyter/Timeline/index.html',
  byCountry: 'Final report/collaborators_by_country.html',
  byGender: 'Final report/collaborators_gender.html',
  collaboratorsMap: 'Final report/collaborators_map.html',
  treemap: 'Final report/treemap_chart.html',
  overTime: 'Final report/activities_type_over_time.html',
};

function trackErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  return errors;
}

test('index lists every figure', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto(PAGES.index);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Remoboko interactive figures');
  const links = page.locator('.figures a');
  await expect(links).toHaveCount(8);
  for (const href of await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')))) {
    const res = await page.request.get(href);
    expect(res.ok(), `${href} should resolve`).toBeTruthy();
  }
  expect(errors).toEqual([]);
});

test('collaborators by country draws 24 bars summing to 93', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto(PAGES.byCountry);
  await expect(page.locator('#plot svg .rows > g')).toHaveCount(24);
  const values = await page.locator('#plot svg text.rb-value').allTextContents();
  expect(values.reduce((s, v) => s + Number(v), 0)).toBe(93);
  await page.getByRole('button', { name: 'Show as table' }).click();
  await expect(page.locator('.rb-table tbody tr')).toHaveCount(24);
  expect(errors).toEqual([]);
});

test('collaborators by gender draws one proportion bar summing to 100%', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto(PAGES.byGender);
  await expect(page.locator('#plot svg rect.rb-mark')).toHaveCount(2);
  await expect(page.locator('#desc')).toContainText('35 of the 93');
  const shares = await page.locator('#plot svg text.seg-value').allTextContents();
  expect(shares.map((s) => Number(s.split('· ')[1].replace('%', ''))).reduce((a, b) => a + b, 0)).toBe(100);
  await page.getByRole('button', { name: 'Show as table' }).click();
  await expect(page.locator('.rb-table tbody tr')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('activities over time stacks eight series and switches to years', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto(PAGES.overTime);
  await expect(page.locator('.rb-legend .rb-key')).toHaveCount(8);
  await expect(page.locator('#plot svg rect.rb-mark').first()).toBeVisible();
  const quarterBands = await page.locator('#plot svg rect.rb-hit').count();
  expect(quarterBands).toBeGreaterThan(20);
  await page.getByRole('button', { name: 'By year' }).click();
  await expect(page.locator('#plot svg rect.rb-hit')).toHaveCount(8);
  // Hiding a series keeps the others' colours (colour follows the entity)
  const seriesFills = (gs) => gs.map((g) => g.getAttribute('fill')).filter((f) => f !== 'none');
  const before = await page.locator('#plot svg g[fill]').evaluateAll(seriesFills);
  await page.locator('.rb-legend .rb-key').first().click();
  const after = await page.locator('#plot svg g[fill]').evaluateAll(seriesFills);
  expect(after).toEqual(before.slice(1));
  expect(errors).toEqual([]);
});

test('treemap shows every type and zooms into one', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto(PAGES.treemap);
  await expect(page.locator('#plot svg g.cell')).toHaveCount(12);
  await page.locator('#plot svg g.cell').first().click();
  await expect(page.locator('#crumbs li')).toHaveCount(2);
  await expect(page.locator('#plot svg g.cell').first()).toBeVisible();
  await page.locator('#crumbs button').first().click();
  await expect(page.locator('#plot svg g.cell')).toHaveCount(12);
  expect(errors).toEqual([]);
});

test('timeline draws 37 events and filters by theme', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto(PAGES.timeline);
  await expect(page.locator('#plot svg g.event')).toHaveCount(37);
  await page.getByRole('button', { name: 'Religion' }).click();
  await expect(page.locator('#plot svg g.event')).toHaveCount(14);
  expect(errors).toEqual([]);
});

for (const [name, url] of [['locations map', PAGES.locations], ['points of interest', PAGES.pointsOfInterest]]) {
  test(`${name} places 33 pins with search and country toggles`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(url);
    await expect(page.locator('.rb-pin')).toHaveCount(33);
    await page.getByRole('combobox', { name: 'Search locations' }).fill('mosq');
    await expect(page.locator('#search-results li').first()).toContainText(/mosq/i);
    const toggle = page.locator('#legend-card .rb-card-toggle');
    if (await toggle.isVisible()) await toggle.click();
    await page.locator('#legend-card .rb-key', { hasText: 'Togo' }).click();
    await expect(page.locator('.rb-pin:visible')).toHaveCount(33 - 14);
    expect(errors.filter((e) => !/tiles\.openfreemap|net::ERR|Failed to fetch/.test(e))).toEqual([]);
  });
}

test('universities map places four logos', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto(PAGES.universities);
  await expect(page.locator('.rb-logo-marker')).toHaveCount(4);
  await expect(page.locator('.rb-uni-list button')).toHaveCount(4);
  expect(errors.filter((e) => !/tiles\.openfreemap|net::ERR|Failed to fetch/.test(e))).toEqual([]);
});

test('collaborators map describes 93 people at 56 institutions', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto(PAGES.collaboratorsMap);
  await expect(page.locator('#title-card .rb-desc').first()).toContainText('93 collaborators at 56 institutions');
  await expect(page.locator('.rb-size-key li')).toHaveCount(3);
  expect(errors.filter((e) => !/tiles\.openfreemap|net::ERR|Failed to fetch/.test(e))).toEqual([]);
});
