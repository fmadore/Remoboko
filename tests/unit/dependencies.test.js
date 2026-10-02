import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));

test('browser and test copies of runtime dependencies have the same exact versions', async () => {
  const d3 = await readFile(new URL('assets/d3.js', root), 'utf8');
  assert.ok(d3.includes(`d3@${manifest.devDependencies.d3}/+esm`));
  const maps = await readFile(new URL('assets/maps.js', root), 'utf8');
  assert.ok(maps.includes(`maplibre-gl@${manifest.devDependencies['maplibre-gl']}/+esm`));
  for (const path of [
    'Book_DeGruyter/Maps/UAC_UL_locations_map.html',
    'Book_DeGruyter/Maps/points_of_interest.html',
    'Book_DeGruyter/Maps/universities_map.html',
    'Final report/collaborators_map.html',
  ]) {
    const html = await readFile(new URL(path, root), 'utf8');
    assert.ok(html.includes(`maplibre-gl@${manifest.devDependencies['maplibre-gl']}/dist/maplibre-gl.css`), path);
  }
});
