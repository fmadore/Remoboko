import { test, expect, PAGES, download } from './helpers/fixtures.js';

test('a narrow short iframe keeps the figure and actions reachable', async ({ page }) => {
  await page.goto(PAGES.index);
  await page.evaluate((url) => {
    const frame = document.createElement('iframe');
    frame.id = 'embedded-figure';
    frame.src = url;
    frame.style.cssText = 'width:320px;height:300px;border:0';
    document.body.replaceChildren(frame);
  }, PAGES.timeline);
  const frame = page.frameLocator('#embedded-figure');
  await expect(frame.locator('#plot svg g.event')).toHaveCount(37);
  const overflow = await frame.locator('html').evaluate((html) => html.scrollWidth - html.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await frame.getByRole('button', { name: 'Show as table', exact: true }).click();
  await expect(frame.locator('.rb-table tbody tr')).toHaveCount(37);
  await frame.getByRole('button', { name: 'Religion', exact: true }).click();
  await expect(frame.locator('.rb-table tbody tr')).toHaveCount(14);
  await frame.getByRole('button', { name: 'Show as chart', exact: true }).click();
  await page.locator('#embedded-figure').evaluate((element) => { element.style.width = '900px'; });
  await expect(frame.locator('#plot svg g.event')).toHaveCount(14);
  await expect(frame.locator('#plot .axis-label').first()).toBeVisible();
});

test('SVG styles and PNG export work across browser engines', async ({ page }) => {
  await page.goto(PAGES.byGender);
  await expect(page.locator('#plot svg .seg-value')).toHaveCount(2);
  const svg = await download(page, 'Download SVG');
  const style = await page.evaluate((xml) => {
    const doc = new DOMParser().parseFromString(xml, 'image/svg+xml');
    const label = doc.querySelector('.seg-value');
    return { font: label.style.fontSize, fill: label.style.fill, text: label.textContent };
  }, svg.bytes.toString('utf8'));
  expect(style.font).toMatch(/px$/);
  expect(style.fill).toMatch(/^(rgb|#)/);
  expect(style.text).toContain('%');
  const png = await download(page, 'Download PNG');
  expect(png.bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
});

test('treemap drilldown and return work using only the keyboard', async ({ page }) => {
  await page.goto(PAGES.treemap);
  const first = page.locator('#plot g.cell[role=button]').first();
  await first.focus();
  await first.press('Enter');
  await expect(page.locator('#crumbs li')).toHaveCount(2);
  const back = page.locator('#crumbs button').first();
  await back.focus();
  await back.press('Enter');
  await expect(page.locator('#plot g.cell')).toHaveCount(12);
});

test('a height-only viewport change releases the previous chart height', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 1400 });
  await page.goto(PAGES.byCountry);
  await expect(page.locator('#plot svg .rows > g')).toHaveCount(24);
  const before = await page.locator('#plot').evaluate((plot) => plot.getBoundingClientRect().height);
  await page.setViewportSize({ width: 1100, height: 600 });
  await expect.poll(() => page.locator('#plot').evaluate((plot) => plot.getBoundingClientRect().height)).toBeLessThan(before - 100);
  await expect(page.locator('#plot svg .rows > g')).toHaveCount(24);
});
