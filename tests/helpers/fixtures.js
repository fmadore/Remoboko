import { test as base, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import * as d3 from 'd3';

const root = new URL('../../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const d3Version = manifest.devDependencies.d3;
const mapVersion = manifest.devDependencies['maplibre-gl'];
const d3Names = Object.keys(d3);
const d3Bundle = await readFile(new URL('node_modules/d3/dist/d3.min.js', root), 'utf8');
// D3 exports names such as "window". Aliases keep those declarations from
// shadowing browser globals used while the UMD bundle initializes.
const bindings = d3Names.map((name) => `${name}: d3_${name}`).join(',');
const exports = d3Names.map((name) => `d3_${name} as ${name}`).join(',');
const d3Module = `${d3Bundle}\nconst {${bindings}} = globalThis.d3;\nexport {${exports}};`;

// Keep the actual libraries and WebGL renderer. Only external delivery and map
// tiles are replaced, so source/layer and export bugs still fail these tests.
export const test = base.extend({
  allowAppErrors: [false, { option: true }],
  deterministicNetwork: [async ({ context, baseURL }, use) => {
    const unexpected = [];
    await context.route('https://**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === 'cdn.jsdelivr.net' && url.pathname === `/npm/d3@${d3Version}/+esm`) {
        return route.fulfill({ contentType: 'text/javascript', body: d3Module });
      }
      if (url.hostname === 'cdn.jsdelivr.net' && url.pathname === `/npm/maplibre-gl@${mapVersion}/+esm`) {
        const local = new URL('node_modules/maplibre-gl/dist/maplibre-gl.mjs', baseURL).href;
        return route.fulfill({ contentType: 'text/javascript', body: `export * from ${JSON.stringify(local)};` });
      }
      if (url.hostname === 'cdn.jsdelivr.net' && url.pathname === `/npm/maplibre-gl@${mapVersion}/dist/maplibre-gl.css`) {
        return route.fulfill({
          contentType: 'text/css',
          path: fileURLToPath(new URL('node_modules/maplibre-gl/dist/maplibre-gl.css', root)),
        });
      }
      if (url.hostname === 'tiles.openfreemap.org' && url.pathname.startsWith('/styles/')) {
        return route.fulfill({ json: {
          version: 8,
          name: `fixture:${url.pathname.split('/').at(-1)}`,
          sources: {},
          layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#f6f7f8' } }],
        } });
      }
      if (url.hostname === 'fonts.googleapis.com') {
        return route.fulfill({ contentType: 'text/css', body: '' });
      }
      unexpected.push(url.href);
      return route.abort('blockedbyclient');
    });
    await use();
    expect(unexpected, 'Unexpected external request: pin or explicitly fixture this dependency').toEqual([]);
  }, { auto: true }],
  appErrors: [async ({ page, allowAppErrors }, use) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await use(errors);
    if (!allowAppErrors) expect(errors, 'Browser errors').toEqual([]);
  }, { auto: true }],
});

export { expect };

export const PAGES = {
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

export async function download(page, name) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name, exact: true }).click();
  const result = await pending;
  expect(await result.failure()).toBeNull();
  return { filename: result.suggestedFilename(), bytes: await readFile(await result.path()) };
}
