import { test, expect, PAGES, download } from './helpers/fixtures.js';

const CHARTS = [
  ['country', PAGES.byCountry, '.rb-cat-label', 'rect.rb-mark'],
  ['gender', PAGES.byGender, '.seg-value', 'rect.rb-mark'],
  ['treemap', PAGES.treemap, 'g.cell text.name', 'g.cell rect'],
  ['timeline', PAGES.timeline, '.event-text', '.event-dot'],
  ['activities', PAGES.overTime, '.rb-axis text', 'rect.rb-mark'],
];

for (const [name, url, textSelector, markSelector] of CHARTS) {
  test(`${name} downloads self-contained SVG, PNG and the displayed data`, async ({ page }) => {
    await page.goto(url);
    await expect(page.locator(`#plot svg ${markSelector}`).first()).toBeVisible();
    const expectedStyles = await page.locator('#plot > svg').evaluate((svg, selectors) => {
      const sample = (selector, property) => {
        const node = svg.querySelector(selector);
        return getComputedStyle(node).getPropertyValue(property);
      };
      return {
        fontSize: sample(selectors.text, 'font-size'),
        textFill: sample(selectors.text, 'fill'),
        markFill: sample(selectors.mark, 'fill'),
      };
    }, { text: textSelector, mark: markSelector });

    const svgFile = await download(page, 'Download SVG');
    expect(svgFile.filename).toMatch(/\.svg$/);
    const exported = await page.evaluate(({ xml, textSelector, markSelector }) => {
      const doc = new DOMParser().parseFromString(xml, 'image/svg+xml');
      const figure = doc.querySelector('svg svg');
      const text = figure?.querySelector(textSelector);
      const mark = figure?.querySelector(markSelector);
      // Exports write a value once and let descendants inherit it unchanged.
      const effective = (node, property) => {
        for (let current = node; current && current !== doc; current = current.parentNode) {
          const value = current.style?.getPropertyValue(property);
          if (value) return value;
        }
        return '';
      };
      return {
        parseError: Boolean(doc.querySelector('parsererror')),
        width: Number(doc.documentElement.getAttribute('width')),
        height: Number(doc.documentElement.getAttribute('height')),
        fontSize: effective(text, 'font-size'),
        textFill: effective(text, 'fill'),
        markFill: effective(mark, 'fill'),
        text: doc.documentElement.textContent,
        hitAreas: doc.querySelectorAll('.rb-hit').length,
        bytes: xml.length,
      };
    }, { xml: svgFile.bytes.toString('utf8'), textSelector, markSelector });
    expect(exported.parseError).toBe(false);
    expect(exported.width).toBeGreaterThan(100);
    expect(exported.height).toBeGreaterThan(50);
    expect(exported.fontSize).toBe(expectedStyles.fontSize);
    expect(exported.textFill).toBe(expectedStyles.textFill);
    expect(exported.markFill).toBe(expectedStyles.markFill);
    expect(exported.hitAreas).toBe(0);
    expect(exported.text).toContain('Remoboko');

    const png = await download(page, 'Download PNG');
    expect(png.filename).toMatch(/\.png$/);
    expect(png.bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(png.bytes.readUInt32BE(16)).toBe(Math.round(exported.width * 2));
    expect(png.bytes.readUInt32BE(20)).toBe(Math.round(exported.height * 2));

    await page.getByRole('button', { name: 'Show as table', exact: true }).click();
    const rows = await page.locator('.rb-table tr').count();
    const csv = await download(page, 'Download CSV');
    expect(csv.filename).toMatch(/\.csv$/);
    // CSV values can contain quoted line breaks; compare by parsing in d3.
    const csvRows = await page.evaluate(async (text) => {
      const d3 = await import('/assets/d3.js');
      return d3.csvParseRows(text.replace(/^\uFEFF/, '')).length;
    }, csv.bytes.toString('utf8'));
    expect(csvRows).toBe(rows);

    // Downloading while the accessible table is open must not hide the SVG.
    const tableSvg = await download(page, 'Download SVG');
    const visibility = await page.evaluate((xml) => {
      const doc = new DOMParser().parseFromString(xml, 'image/svg+xml');
      return doc.querySelector('svg svg')?.style.visibility;
    }, tableSvg.bytes.toString('utf8'));
    expect(visibility).not.toBe('hidden');
  });
}

test('an open timeline table and CSV follow the theme filter', async ({ page }) => {
  await page.goto(PAGES.timeline);
  await page.getByRole('button', { name: 'Show as table', exact: true }).click();
  await expect(page.locator('.rb-table tbody tr')).toHaveCount(37);
  await page.getByRole('button', { name: 'Religion', exact: true }).click();
  await expect(page.locator('.rb-table tbody tr')).toHaveCount(14);
  const csv = await download(page, 'Download CSV');
  const rows = await page.evaluate(async (text) => (await import('/assets/d3.js')).csvParseRows(text.replace(/^\uFEFF/, '')), csv.bytes.toString('utf8'));
  expect(rows).toHaveLength(15);
  await page.getByRole('button', { name: 'Show as chart', exact: true }).click();
  await expect(page.locator('#plot svg g.event')).toHaveCount(14);
  await expect(page.locator('#plot > svg')).toBeVisible();
});

test('an open activities table follows years and series visibility', async ({ page }) => {
  await page.goto(PAGES.overTime);
  await page.getByRole('button', { name: 'Show as table', exact: true }).click();
  const initial = await page.locator('.rb-table').innerText();
  await page.getByRole('button', { name: 'By year', exact: true }).click();
  await expect(page.locator('.rb-table')).not.toHaveText(initial);
  const yearTable = await page.locator('.rb-table').innerText();
  await page.locator('.rb-legend button').first().click();
  await expect(page.locator('.rb-table')).not.toHaveText(yearTable);
  const csv = await download(page, 'Download CSV');
  expect(csv.bytes.length).toBeGreaterThan(30);
});
